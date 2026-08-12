import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { db, hotelRoomTypesTable, reservationsTable } from "@workspace/db";
import {
  CheckAvailabilityQueryParams,
  CheckAvailabilityResponse,
  CreateReservationBody,
  CreateReservationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const defaultRoomTypes = [
  { slug: "suite-jardim", name: "Suíte Jardim", maxGuests: 2, totalRooms: 6 },
  { slug: "suite-vista", name: "Suíte Vista", maxGuests: 2, totalRooms: 5 },
  { slug: "suite-master", name: "Suíte Master", maxGuests: 3, totalRooms: 2 },
];

class NoAvailabilityError extends Error {}

async function ensureRoomTypes(): Promise<void> {
  await db
    .insert(hotelRoomTypesTable)
    .values(defaultRoomTypes)
    .onConflictDoNothing({ target: hotelRoomTypesTable.slug });
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

router.get("/availability", async (req, res): Promise<void> => {
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
    .from(hotelRoomTypesTable)
    .orderBy(asc(hotelRoomTypesTable.id));

  const options = await Promise.all(
    roomTypes.map(async (roomType) => {
      const booked = await bookedRooms(checkinString, checkoutString, roomType.slug);
      const availableRooms = Math.max(roomType.totalRooms - booked, 0);
      return {
        slug: roomType.slug,
        name: roomType.name,
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

  try {
    const reservation = await db.transaction(async (tx) => {
      const roomTypes = requestedSlug
        ? await tx
            .select()
            .from(hotelRoomTypesTable)
            .where(eq(hotelRoomTypesTable.slug, requestedSlug))
            .orderBy(asc(hotelRoomTypesTable.id))
            .for("update")
        : await tx
            .select()
            .from(hotelRoomTypesTable)
            .orderBy(asc(hotelRoomTypesTable.id))
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

        const [created] = await tx
          .insert(reservationsTable)
          .values({
            confirmationCode: `HZ-${randomUUID().slice(0, 8).toUpperCase()}`,
            status: "confirmed",
            checkin,
            checkout,
            guests: parsed.data.guests,
            rooms: parsed.data.rooms,
            accommodationSlug: roomType.slug,
            accommodationName: roomType.name,
            guestName: parsed.data.guestName.trim(),
            guestEmail: parsed.data.guestEmail.trim().toLowerCase(),
            guestPhone: parsed.data.guestPhone.trim(),
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

export default router;