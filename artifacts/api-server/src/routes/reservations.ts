import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { db, reservationsTable, roomsTable } from "@workspace/db";
import {
  CheckAvailabilityQueryParams,
  CheckAvailabilityResponse,
  CreateReservationBody,
  CreateReservationResponse,
  GetReservationParams,
  GetReservationResponse,
  UpdateReservationBody,
  UpdateReservationParams,
  UpdateReservationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const defaultRoomTypes = [
  {
    slug: "suite-jardim",
    name: "Suíte Jardim",
    description: "Um espaço acolhedor cercado pela natureza.",
    pricePerNight: 1850,
    maxGuests: 2,
    totalRooms: 6,
    photos: ["/images/suite.jpg", "/images/detail.jpg"],
    amenities: ["Varanda privativa", "Banheira de imersão", "Cama king size"],
  },
  {
    slug: "suite-vista",
    name: "Suíte Vista",
    description: "Conforto e privacidade com uma vista privilegiada.",
    pricePerNight: 2450,
    maxGuests: 2,
    totalRooms: 5,
    photos: ["/images/view.jpg", "/images/suite.jpg"],
    amenities: ["Vista panorâmica", "Sala de leitura", "Banheira junto à janela"],
  },
  {
    slug: "suite-master",
    name: "Suíte Master",
    description: "Uma experiência completa para quem busca exclusividade.",
    pricePerNight: 3900,
    maxGuests: 3,
    totalRooms: 2,
    photos: ["/images/detail.jpg", "/images/view.jpg"],
    amenities: ["Terraço panorâmico", "Sala de estar", "Lareira a lenha"],
  },
  {
    slug: "suite-bosque",
    name: "Suíte Bosque",
    description: "Silêncio, luz natural e o verde da Mantiqueira por todos os lados.",
    pricePerNight: 2150,
    maxGuests: 2,
    totalRooms: 4,
    photos: ["/images/nature.jpg", "/images/suite.jpg"],
    amenities: ["Jardim privativo", "Ducha dupla", "Café da manhã na varanda"],
  },
];

class NoAvailabilityError extends Error {}

const offers = {
  "fim-de-semana": { name: "Fim de semana a dois", discountPercent: 10 },
  "ritmo-da-serra": { name: "Ritmo da serra", discountPercent: 15 },
} as const;

async function ensureRoomTypes(): Promise<void> {
  await db
    .insert(roomsTable)
    .values(defaultRoomTypes)
    .onConflictDoNothing({ target: roomsTable.slug });
}

function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return parsed;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function datesAreValid(checkin: Date, checkout: Date): boolean {
  return checkin.getTime() < checkout.getTime() && dateOnly(checkin) >= dateOnly(new Date());
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function nightsBetween(checkin: Date, checkout: Date): number {
  return Math.round((checkout.getTime() - checkin.getTime()) / 86_400_000);
}

function reservationDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function bookedRooms(
  checkin: string,
  checkout: string,
  accommodationSlug: string,
): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${reservationsTable.rooms}), 0)`,
    })
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.status, "confirmed"),
        lt(reservationsTable.checkin, checkout),
        gt(reservationsTable.checkout, checkin),
        eq(reservationsTable.accommodationSlug, accommodationSlug),
      ),
    );

  return Number(result?.total ?? 0);
}

router.get("/rooms/availability", async (req, res): Promise<void> => {
  const checkin = parseCalendarDate(req.query.checkin);
  const checkout = parseCalendarDate(req.query.checkout);

  const parsed = CheckAvailabilityQueryParams.safeParse({
    checkin,
    checkout,
    guests: req.query.guests,
    rooms: req.query.rooms,
  });

  if (!parsed.success || !checkin || !checkout || !datesAreValid(checkin, checkout)) {
    res.status(400).json({ error: "Informe um período válido, com check-out depois do check-in." });
    return;
  }

  await ensureRoomTypes();
  const checkinString = dateOnly(checkin);
  const checkoutString = dateOnly(checkout);
  const roomTypes = await db
    .select()
    .from(roomsTable)
    .orderBy(asc(roomsTable.id));

  const options = await Promise.all(
    roomTypes.map(async (roomType) => {
      const booked = await bookedRooms(checkinString, checkoutString, roomType.slug);
      const availableRooms = Math.max(roomType.totalRooms - booked, 0);
      return {
        slug: roomType.slug,
        name: roomType.name,
        description: roomType.description,
        pricePerNight: roomType.pricePerNight,
        totalPrice: roomType.pricePerNight * nightsBetween(checkin, checkout) * parsed.data.rooms,
        photos: roomType.photos,
        amenities: roomType.amenities,
        availableRooms,
        maxGuests: roomType.maxGuests,
      };
    }),
  );

  const selected = options.find(
    (option) =>
      option.availableRooms >= parsed.data.rooms &&
      option.maxGuests * parsed.data.rooms >= parsed.data.guests,
  );
  const roomsAvailable = selected?.availableRooms ?? Math.max(...options.map((option) => option.availableRooms), 0);

  res.json(
    CheckAvailabilityResponse.parse({
      available: Boolean(selected),
      roomsAvailable,
      accommodationSlug: selected?.slug ?? null,
      accommodationName: selected?.name ?? null,
      message: selected
        ? `Encontramos ${selected.name} para a sua estadia.`
        : "Não encontramos quartos para esse período. Tente outras datas.",
      options,
    }),
  );
});

router.post("/reservations", async (req, res): Promise<void> => {
  const input = (req.body ?? {}) as Record<string, unknown>;
  const parsed = CreateReservationBody.safeParse({
    ...input,
    checkin: parseCalendarDate(input.checkin),
    checkout: parseCalendarDate(input.checkout),
  });

  if (
    !parsed.success ||
    !parsed.data.checkin ||
    !parsed.data.checkout ||
    !datesAreValid(parsed.data.checkin, parsed.data.checkout) ||
    !isValidEmail(parsed.data.guestEmail)
  ) {
    res.status(400).json({ error: "Confira as datas e os dados do hóspede antes de continuar." });
    return;
  }

  await ensureRoomTypes();
  const checkin = dateOnly(parsed.data.checkin);
  const checkout = dateOnly(parsed.data.checkout);
  const requestedSlug = parsed.data.accommodationSlug ?? null;
  const selectedOffer = parsed.data.offerCode
    ? offers[parsed.data.offerCode as keyof typeof offers]
    : undefined;

  if (parsed.data.offerCode && !selectedOffer) {
    res.status(400).json({ error: "Oferta selecionada inválida." });
    return;
  }

  try {
    const reservation = await db.transaction(async (tx) => {
      const roomTypes = requestedSlug
        ? await tx
            .select()
            .from(roomsTable)
            .where(eq(roomsTable.slug, requestedSlug))
            .orderBy(asc(roomsTable.id))
            .for("update")
        : await tx
            .select()
            .from(roomsTable)
            .orderBy(asc(roomsTable.id))
            .for("update");

      for (const roomType of roomTypes) {
        if (roomType.maxGuests * parsed.data.rooms < parsed.data.guests) {
          continue;
        }

        const [result] = await tx
          .select({
            total: sql<number>`coalesce(sum(${reservationsTable.rooms}), 0)`,
          })
          .from(reservationsTable)
          .where(
            and(
              eq(reservationsTable.status, "confirmed"),
              lt(reservationsTable.checkin, checkout),
              gt(reservationsTable.checkout, checkin),
              eq(reservationsTable.accommodationSlug, roomType.slug),
            ),
          );

        const booked = Number(result?.total ?? 0);
        if (roomType.totalRooms - booked < parsed.data.rooms) {
          continue;
        }

        const baseAmount =
          roomType.pricePerNight *
          nightsBetween(parsed.data.checkin, parsed.data.checkout) *
          parsed.data.rooms;
        const totalAmount = selectedOffer
          ? Math.round(baseAmount * (1 - selectedOffer.discountPercent / 100))
          : baseAmount;

        const [created] = await tx
          .insert(reservationsTable)
          .values({
            confirmationCode: `HZ-${randomUUID().slice(0, 8).toUpperCase()}`,
            status: "confirmed",
            checkin,
            checkout,
            guests: parsed.data.guests,
            rooms: parsed.data.rooms,
            totalAmount,
            accommodationSlug: roomType.slug,
            accommodationName: roomType.name,
            guestName: parsed.data.guestName.trim(),
            guestEmail: parsed.data.guestEmail.trim().toLowerCase(),
            guestPhone: parsed.data.guestPhone.trim(),
            offerCode: parsed.data.offerCode ?? null,
            offerName: selectedOffer?.name ?? null,
            specialRequests: parsed.data.specialRequests?.trim() || null,
          })
          .returning();

        return created;
      }

      throw new NoAvailabilityError("No rooms available");
    });

    res.status(201).json(CreateReservationResponse.parse(reservation));
  } catch (error) {
    if (error instanceof NoAvailabilityError) {
      res.status(409).json({ error: "As acomodações escolhidas ficaram indisponíveis. Consulte outras datas." });
      return;
    }

    req.log.error({ err: error }, "Failed to create reservation");
    res.status(500).json({ error: "Não foi possível concluir a reserva agora." });
  }
});

router.get("/reservations/:id", async (req, res): Promise<void> => {
  const parsed = GetReservationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Código de reserva inválido." });
    return;
  }

  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, parsed.data.id));

  if (!reservation) {
    res.status(404).json({ error: "Reserva não encontrada." });
    return;
  }

  res.json(GetReservationResponse.parse(reservation));
});

router.patch("/reservations/:id", async (req, res): Promise<void> => {
  const params = UpdateReservationParams.safeParse(req.params);
  const rawBody = (req.body ?? {}) as Record<string, unknown>;
  const body = UpdateReservationBody.safeParse({
    ...rawBody,
    ...(rawBody.checkin !== undefined
      ? { checkin: parseCalendarDate(rawBody.checkin) }
      : {}),
    ...(rawBody.checkout !== undefined
      ? { checkout: parseCalendarDate(rawBody.checkout) }
      : {}),
  });

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Atualização de reserva inválida." });
    return;
  }

  const [existing] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Reserva não encontrada." });
    return;
  }

  if (body.data.status === "cancelled") {
    const [cancelled] = await db
      .update(reservationsTable)
      .set({ status: "cancelled" })
      .where(eq(reservationsTable.id, params.data.id))
      .returning();
    res.json(UpdateReservationResponse.parse(cancelled));
    return;
  }

  const nextCheckin = body.data.checkin ? dateOnly(body.data.checkin) : existing.checkin;
  const nextCheckout = body.data.checkout ? dateOnly(body.data.checkout) : existing.checkout;
  const nextGuests = body.data.guests ?? existing.guests;
  const nextRooms = body.data.rooms ?? existing.rooms;
  const nextSlug = body.data.accommodationSlug ?? existing.accommodationSlug;
  const checkinDate = reservationDate(nextCheckin);
  const checkoutDate = reservationDate(nextCheckout);

  if (!datesAreValid(checkinDate, checkoutDate)) {
    res.status(400).json({ error: "Confira o período da estadia." });
    return;
  }

  const [roomType] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.slug, nextSlug));
  if (!roomType || roomType.maxGuests * nextRooms < nextGuests) {
    res.status(409).json({ error: "A acomodação não comporta esse número de hóspedes." });
    return;
  }

  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${reservationsTable.rooms}), 0)` })
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.status, "confirmed"),
        lt(reservationsTable.checkin, nextCheckout),
        gt(reservationsTable.checkout, nextCheckin),
        eq(reservationsTable.accommodationSlug, nextSlug),
        sql`${reservationsTable.id} <> ${params.data.id}`,
      ),
    );

  if (roomType.totalRooms - Number(result?.total ?? 0) < nextRooms) {
    res.status(409).json({ error: "As novas datas não estão disponíveis." });
    return;
  }

  const selectedOffer = body.data.offerCode
    ? offers[body.data.offerCode as keyof typeof offers]
    : undefined;
  if (body.data.offerCode && !selectedOffer) {
    res.status(400).json({ error: "Oferta selecionada inválida." });
    return;
  }

  const baseAmount = roomType.pricePerNight * nightsBetween(checkinDate, checkoutDate) * nextRooms;
  const [updated] = await db
    .update(reservationsTable)
    .set({
      status: "confirmed",
      checkin: nextCheckin,
      checkout: nextCheckout,
      guests: nextGuests,
      rooms: nextRooms,
      accommodationSlug: nextSlug,
      accommodationName: roomType.name,
      totalAmount: selectedOffer
        ? Math.round(baseAmount * (1 - selectedOffer.discountPercent / 100))
        : baseAmount,
      offerCode: body.data.offerCode ?? existing.offerCode,
      offerName: selectedOffer?.name ?? existing.offerName,
    })
    .where(eq(reservationsTable.id, params.data.id))
    .returning();

  res.json(UpdateReservationResponse.parse(updated));
});

export default router;