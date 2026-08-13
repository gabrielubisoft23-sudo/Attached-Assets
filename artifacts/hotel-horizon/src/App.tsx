import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getCheckAvailabilityQueryKey,
  useCheckAvailability,
  useCreateReservation,
  type AccommodationOption,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useRoute } from 'wouter';
import { AlertCircle, ArrowDown, ArrowLeft, ArrowRight, BedDouble, CalendarDays, Check, ChevronDown, ChevronUp, Clock3, Coffee, Compass, Globe2, Heart, Instagram, Loader2, Mail, MapPin, Menu, MessageCircle, Minus, Mountain, MoveUpRight, Phone, Plus, Quote, Send, ShieldCheck, Sparkles, Star, Utensils, Users, X } from 'lucide-react';

const queryClient = new QueryClient();
const image = (name: string) => `/images/${name}.jpg`;

type Room = {
  slug: string; name: string; eyebrow: string; description: string; longDescription: string;
  image: string; gallery: string[]; guests: number; area: string; bed: string; view: string; price: string; features: string[]; amenities: string[];
};

const rooms: Room[] = [
  { slug: 'suite-jardim', name: 'Suíte Jardim', eyebrow: 'Aconchego entre o verde', description: 'Um espaço acolhedor cercado pela natureza.', longDescription: 'A Suíte Jardim foi desenhada para quem deseja sentir o ritmo da serra logo ao abrir os olhos. A madeira aquecida, os tecidos naturais e a varanda privativa criam um abrigo íntimo, em diálogo constante com o jardim.', image: image('suite'), gallery: [image('suite'), image('detail'), image('view')], guests: 2, area: '42 m²', bed: 'Cama king size', view: 'Jardins do hotel', price: 'Consulte disponibilidade', features: ['Varanda privativa', 'Banheira de imersão', 'Lareira ecológica'], amenities: ['Wi-Fi de alta velocidade', 'Café de boas-vindas', 'Amenities de banho botânicos', 'Máquina de café e chá', 'Roupões e chinelos'] },
  { slug: 'suite-vista', name: 'Suíte Vista', eyebrow: 'Horizonte sem pressa', description: 'Conforto e privacidade com uma vista privilegiada.', longDescription: 'Na Suíte Vista, a paisagem é parte da arquitetura. A janela ampla enquadra as montanhas da Mantiqueira e acompanha a luz mudar ao longo do dia, enquanto cada detalhe convida a ficar mais um pouco.', image: image('view'), gallery: [image('view'), image('suite'), image('detail')], guests: 2, area: '50 m²', bed: 'Cama king size', view: 'Vale da Mantiqueira', price: 'Consulte disponibilidade', features: ['Vista panorâmica', 'Sala de leitura', 'Banheira junto à janela'], amenities: ['Wi-Fi de alta velocidade', 'Café de boas-vindas', 'Amenities de banho botânicos', 'Máquina de café e chá', 'Roupões e chinelos'] },
  { slug: 'suite-master', name: 'Suíte Master', eyebrow: 'O tempo por inteiro', description: 'Uma experiência completa para quem busca exclusividade.', longDescription: 'Nossa suíte mais generosa reúne sala, quarto e um terraço suspenso sobre a copa das árvores. É um lugar para celebrar, descansar profundamente e deixar que a serra organize os dias.', image: image('detail'), gallery: [image('detail'), image('view'), image('suite')], guests: 3, area: '78 m²', bed: 'Cama king size', view: 'Montanhas e bosque', price: 'Consulte disponibilidade', features: ['Terraço panorâmico', 'Sala de estar', 'Lareira a lenha'], amenities: ['Wi-Fi de alta velocidade', 'Café de boas-vindas', 'Amenities de banho botânicos', 'Máquina de café e chá', 'Roupões e chinelos'] },
];

const experiences = [
  { title: 'Banho de floresta', text: 'Caminhe sem destino pela mata nativa, guiado apenas pelo som da água.', image: image('nature'), icon: Mountain },
  { title: 'Ritual Horizon', text: 'Massagem, sauna e um chá de ervas para devolver espaço ao corpo.', image: image('wellness'), icon: Heart },
  { title: 'Mesa da serra', text: 'Ingredientes de pequenos produtores em um menu que acompanha as estações.', image: image('dining'), icon: Utensils },
  { title: 'Manhã de altitude', text: 'Uma prática de respiração e alongamento com o vale aos seus pés.', image: image('view'), icon: Sparkles },
];
const gallery = [
  { src: image('hero'), label: 'A chegada', size: 'tall' },
  { src: image('suite'), label: 'Suíte Jardim', size: 'wide' },
  { src: image('dining'), label: 'Mesa Horizon', size: 'standard' },
  { src: image('wellness'), label: 'Casa de banho', size: 'standard' },
  { src: image('nature'), label: 'A Mantiqueira', size: 'wide' },
  { src: image('detail'), label: 'Detalhes', size: 'standard' },
];
const offers = [
  { title: 'Fim de semana a dois', text: 'Dois dias para lembrar o que acontece quando nada precisa acontecer.', condition: 'Inclui café da manhã e um jantar para duas pessoas.', image: image('dining'), offerCode: 'fim-de-semana', discountPercent: 10 },
  { title: 'Ritmo da serra', text: 'Uma pausa mais longa, com tempo para conhecer a região sem pressa.', condition: 'A partir de três noites, com ritual Horizon incluído.', image: image('view'), offerCode: 'ritmo-da-serra', discountPercent: 15 },
];

function formatBRL(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
const reviews = [
  { quote: 'Um lugar raro: arquitetura silenciosa, serviço atento sem ser invasivo e uma paisagem que parece continuar dentro do quarto.', name: 'Mariana Alves', place: 'São Paulo, Brasil' },
  { quote: 'O Horizon tem uma maneira muito própria de cuidar. Saímos descansados de verdade, não apenas longe de casa.', name: 'Rafael e Luísa', place: 'Rio de Janeiro, Brasil' },
  { quote: 'Cada refeição foi uma descoberta e cada pessoa da equipe parecia saber exatamente quando se aproximar. Voltaremos no inverno.', name: 'Camila Nogueira', place: 'Belo Horizonte, Brasil' },
];

function scrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`focus-ring flex items-center gap-3 ${light ? 'text-[#f7f4ee]' : 'text-[#243b30]'}`} data-testid="link-logo">
    <span className="relative flex h-9 w-9 items-center justify-center border border-current/50 rounded-full"><span className="font-display text-xl italic leading-none">H</span><span className="absolute -bottom-1 h-2 w-px bg-current" /></span>
    <span className="font-body text-[11px] font-semibold tracking-[.28em] uppercase">Hotel<br /><span className="font-normal tracking-[.42em]">Horizon</span></span>
  </Link>;
}

function Header() {
  const [scrolled, setScrolled] = useState(false); const [open, setOpen] = useState(false); const [, setLocation] = useLocation();
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  const go = (id: string) => { setOpen(false); if (window.location.pathname !== '/') { setLocation('/'); setTimeout(() => scrollToId(id), 120); } else scrollToId(id); };
  const links = [['O hotel', 'hotel'], ['Acomodações', 'acomodacoes'], ['Experiências', 'experiencias'], ['Gastronomia', 'gastronomia'], ['Galeria', 'galeria'], ['Localização', 'localizacao']];
  return <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${scrolled || open ? 'bg-[#f7f4ee]/95 text-[#243b30] shadow-[0_1px_0_rgba(36,59,48,.12)] backdrop-blur-md' : 'bg-transparent text-[#f7f4ee]'}`} data-testid="site-header">
    <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"><Logo light={!scrolled && !open} />
      <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">{links.map(([label, id]) => <button key={id} onClick={() => go(id)} className="focus-ring text-[11px] uppercase tracking-[.14em] opacity-80 transition hover:opacity-100" data-testid={`button-nav-${id}`}>{label}</button>)}</nav>
      <div className="hidden items-center gap-5 lg:flex"><span className="text-[10px] tracking-[.16em] opacity-65">PT <span className="mx-1 opacity-40">/</span> EN</span><Link href="/reservar" className="focus-ring bg-[#b89b5e] px-5 py-3 text-[10px] font-semibold uppercase tracking-[.17em] text-[#1d2b25] transition hover:bg-[#cfb777]" data-testid="link-header-reserve">Reservar agora</Link></div>
      <div className="flex items-center gap-3 lg:hidden"><Link href="/reservar" className="focus-ring bg-[#b89b5e] px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[.12em] text-[#1d2b25]" data-testid="link-mobile-reserve">Reservar</Link><button onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} className="focus-ring p-2" data-testid="button-mobile-menu">{open ? <X size={21} /> : <Menu size={22} />}</button></div>
    </div>
    <div className={`lg:hidden overflow-hidden transition-all duration-500 ${open ? 'max-h-[calc(100dvh-78px)] border-t border-[#243b30]/10' : 'max-h-0'}`}><nav className="flex min-h-[calc(100dvh-79px)] flex-col justify-center gap-7 bg-[#f7f4ee] px-7 py-10" aria-label="Menu mobile">{links.map(([label, id], i) => <button key={id} onClick={() => go(id)} className="reveal flex items-center justify-between border-b border-[#243b30]/10 pb-4 text-left font-display text-3xl text-[#243b30]" style={{ animationDelay: `${i * 60}ms` }} data-testid={`button-mobile-nav-${id}`}>{label}<ArrowRight size={18} strokeWidth={1.2} /></button>)}<Link href="/reservar" onClick={() => setOpen(false)} className="mt-3 flex items-center justify-between bg-[#243b30] px-5 py-4 text-[11px] uppercase tracking-[.16em] text-[#f7f4ee]" data-testid="link-mobile-menu-reserve">Planeje sua estadia <MoveUpRight size={16} /></Link></nav></div>
  </header>;
}

function BookingWidget({ compact = false }: { compact?: boolean }) {
  const [, setLocation] = useLocation(); const [checkin, setCheckin] = useState(''); const [checkout, setCheckout] = useState(''); const [guests, setGuests] = useState('2'); const [roomsCount, setRoomsCount] = useState('1'); const [promo, setPromo] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); const params = new URLSearchParams({ checkin, checkout, guests, rooms: roomsCount, promo }); setLocation(`/reservar?${params.toString()}`); };
  return <form onSubmit={submit} className={`grid gap-px bg-[#243b30]/15 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-[1.15fr_1.15fr_.8fr_.7fr_1fr_auto]'}`} data-testid="form-booking">
    <label className="flex min-h-[69px] flex-col justify-center bg-[#f7f4ee] px-4 py-3 text-[#243b30]"><span className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]"><CalendarDays size={12} /> Check-in</span><input required type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="focus-ring bg-transparent text-sm outline-none" data-testid="input-checkin" /></label>
    <label className="flex min-h-[69px] flex-col justify-center bg-[#f7f4ee] px-4 py-3 text-[#243b30]"><span className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]"><CalendarDays size={12} /> Check-out</span><input required type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="focus-ring bg-transparent text-sm outline-none" data-testid="input-checkout" /></label>
    <label className="flex min-h-[69px] flex-col justify-center bg-[#f7f4ee] px-4 py-3 text-[#243b30]"><span className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]"><Users size={12} /> Hóspedes</span><select value={guests} onChange={e => setGuests(e.target.value)} className="focus-ring bg-transparent text-sm outline-none" data-testid="select-guests">{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'hóspede' : 'hóspedes'}</option>)}</select></label>
    <label className="flex min-h-[69px] flex-col justify-center bg-[#f7f4ee] px-4 py-3 text-[#243b30]"><span className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]"><BedDouble size={12} /> Quartos</span><select value={roomsCount} onChange={e => setRoomsCount(e.target.value)} className="focus-ring bg-transparent text-sm outline-none" data-testid="select-rooms">{[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
    {!compact && <label className="col-span-2 flex min-h-[69px] flex-col justify-center bg-[#f7f4ee] px-4 py-3 text-[#243b30] md:col-span-1"><span className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Código promocional</span><input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Opcional" className="focus-ring bg-transparent text-sm outline-none placeholder:text-[#706e67]/60" data-testid="input-promo" /></label>}
    <button type="submit" className={`${compact ? 'col-span-2' : 'col-span-2 md:col-span-1'} min-h-[69px] bg-[#b89b5e] px-5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#1d2b25] transition hover:bg-[#cfb777] focus:outline-none focus:ring-2 focus:ring-[#b89b5e] focus:ring-offset-2`} data-testid="button-check-availability">Ver disponibilidade</button>
  </form>;
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) { return <p className={`mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.24em] ${light ? 'text-[#d7c59b]' : 'text-[#9a7d42]'}`}><span className="h-px w-7 bg-current" />{children}</p>; }
function SectionTitle({ eyebrow, title, copy, light = false, align = 'left' }: { eyebrow: string; title: ReactNode; copy?: string; light?: boolean; align?: 'left' | 'center' }) { return <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl`}><Eyebrow light={light}>{eyebrow}</Eyebrow><h2 className={`font-display text-4xl leading-[1.05] sm:text-5xl lg:text-[4.35rem] ${light ? 'text-[#f7f4ee]' : 'text-[#243b30]'}`}>{title}</h2>{copy && <p className={`mt-6 max-w-xl text-[15px] leading-7 ${align === 'center' ? 'mx-auto' : ''} ${light ? 'text-[#f7f4ee]/70' : 'text-[#706e67]'}`}>{copy}</p>}</div>; }

function Hero() {
  return <section className="relative flex min-h-[710px] items-end overflow-hidden bg-[#243b30] pb-36 pt-32 text-[#f7f4ee] sm:min-h-[790px] lg:min-h-[94vh]" data-testid="section-hero">
    <img src={image('hero')} alt="Arquitetura do Hotel Horizon entre as montanhas" className="hero-image absolute inset-0 h-full w-full object-cover object-center opacity-75" /><div className="absolute inset-0 bg-gradient-to-r from-[#14241e]/80 via-[#1d2b25]/35 to-[#1d2b25]/25" /><div className="absolute inset-0 bg-gradient-to-t from-[#1d2b25]/85 via-transparent to-[#1d2b25]/20" />
    <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12"><div className="max-w-2xl"><p className="reveal mb-6 text-[10px] font-semibold uppercase tracking-[.32em] text-[#d7c59b]">Serra da Mantiqueira · Campos do Jordão</p><h1 className="reveal reveal-delay-1 font-display text-6xl leading-[.94] tracking-[-.03em] sm:text-8xl lg:text-[8.25rem]">Uma experiência<br /><em>para lembrar.</em></h1><p className="reveal reveal-delay-2 mt-7 max-w-md text-base leading-7 text-[#f7f4ee]/75">Um refúgio onde conforto, natureza e hospitalidade se encontram no ritmo certo.</p><div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-5"><Link href="/reservar" className="focus-ring bg-[#b89b5e] px-6 py-4 text-[10px] font-semibold uppercase tracking-[.17em] text-[#1d2b25] transition hover:bg-[#d1b978]" data-testid="link-hero-reserve">Reservar sua estadia <MoveUpRight className="ml-3 inline" size={15} /></Link><button onClick={() => scrollToId('hotel')} className="focus-ring line-link px-1 py-3 text-[10px] font-semibold uppercase tracking-[.17em]" data-testid="button-hero-discover">Conhecer o hotel</button></div></div></div>
    <div className="absolute bottom-10 left-5 z-10 flex items-center gap-3 text-[9px] uppercase tracking-[.2em] text-[#f7f4ee]/60 sm:left-12"><ArrowDown size={15} className="animate-bounce" /> Deslize para descobrir</div>
    <div className="absolute bottom-[-1px] left-0 right-0 z-10 h-20 bg-gradient-to-t from-[#f7f4ee] to-transparent" />
  </section>;
}

function HotelIntro() {
  return <section id="hotel" className="bg-[#f7f4ee] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40" data-testid="section-hotel"><div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-28"><div><SectionTitle eyebrow="O hotel" title={<>Mais do que uma estadia.<br /><em>Uma experiência.</em></>} copy="O Hotel Horizon foi criado para proporcionar momentos de tranquilidade, conforto e conexão. Cada detalhe foi cuidadosamente pensado para transformar uma simples hospedagem em uma experiência memorável." /><button onClick={() => scrollToId('experiencias')} className="line-link focus-ring mt-8 inline-flex items-center gap-3 pb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#243b30]" data-testid="button-discover-hotel">Descubra o hotel <ArrowRight size={15} /></button></div><div className="relative min-h-[420px] sm:min-h-[550px]"><div className="img-zoom absolute right-0 top-0 h-[68%] w-[74%] overflow-hidden"><img src={image('view')} alt="Vista da serra a partir do Hotel Horizon" loading="lazy" className="h-full w-full object-cover" /></div><div className="img-zoom absolute bottom-0 left-0 h-[47%] w-[54%] overflow-hidden border-[10px] border-[#f7f4ee] sm:border-[14px]"><img src={image('detail')} alt="Detalhe da suíte com roupa de cama natural" loading="lazy" className="h-full w-full object-cover" /></div><span className="absolute bottom-[9%] right-[4%] hidden font-display text-[8rem] italic leading-none text-[#b89b5e]/40 sm:block">H</span></div></div></section>;
}

function Differentiators() {
  const items = [{ title: 'Localização privilegiada', text: 'A poucos minutos do centro, em uma clareira reservada da serra.', icon: Compass }, { title: 'Experiência pessoal', text: 'Atendimento atento, no compasso de cada hóspede.', icon: Heart }, { title: 'Mesa autoral', text: 'Ingredientes selecionados e histórias servidas à mesa.', icon: Utensils }, { title: 'Tempo de qualidade', text: 'Espaços para descansar, respirar e olhar mais longe.', icon: Clock3 }];
  return <section className="bg-[#e8e0d2] px-5 py-20 sm:px-8 lg:px-12" data-testid="section-differentiators"><div className="mx-auto max-w-[1280px]"><div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Eyebrow>O que nos move</Eyebrow><h2 className="font-display text-3xl text-[#243b30] sm:text-4xl">Pequenas escolhas.<br /><em>Grande diferença.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[#706e67]">A hospitalidade que fica na memória mora nos detalhes que não pedem atenção.</p></div><div className="grid gap-0 border-y border-[#243b30]/15 md:grid-cols-4">{items.map(({ title, text, icon: Icon }, i) => <div key={title} className={`group border-[#243b30]/15 py-8 md:px-7 ${i > 0 ? 'md:border-l' : ''}`}><Icon size={23} strokeWidth={1.2} className="mb-10 text-[#9a7d42] transition-transform duration-500 group-hover:-translate-y-1" /><h3 className="font-display text-2xl text-[#243b30]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#706e67]">{text}</p></div>)}</div></div></section>;
}

function Rooms() {
  return <section id="acomodacoes" className="bg-[#f7f4ee] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="section-rooms"><div className="mx-auto max-w-[1280px]"><div className="flex items-end justify-between gap-6"><SectionTitle eyebrow="Acomodações" title={<>Espaços pensados<br /><em>para desacelerar.</em></>} /><span className="hidden pb-2 text-[10px] uppercase tracking-[.18em] text-[#706e67] md:block">03 maneiras de ficar</span></div><div className="mt-14 grid gap-7 lg:grid-cols-3">{rooms.map((room, i) => <article key={room.slug} className={`${i === 1 ? 'lg:mt-16' : ''}`} data-testid={`card-room-${room.slug}`}><Link href={`/acomodacoes/${room.slug}`} className="group focus-ring block"><div className="img-zoom relative aspect-[.82] overflow-hidden bg-[#e8e0d2]"><img src={room.image} alt={room.name} loading="lazy" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#1d2b25]/60 via-transparent to-transparent opacity-75" /><span className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[.2em] text-[#f7f4ee]">0{i + 1} <span className="mx-2 text-[#d7c59b]">/</span> {room.eyebrow}</span><span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f4ee]/90 text-[#243b30] opacity-0 transition group-hover:opacity-100"><MoveUpRight size={16} /></span></div><div className="pt-5"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-3xl text-[#243b30]">{room.name}</h3><span className="pt-2 text-[10px] uppercase tracking-[.12em] text-[#706e67]">{room.area}</span></div><p className="mt-2 text-sm leading-6 text-[#706e67]">{room.description}</p><div className="mt-5 flex items-center gap-5 text-[10px] uppercase tracking-[.12em] text-[#706e67]"><span className="flex items-center gap-2"><Users size={13} /> {room.guests} hóspedes</span><span className="flex items-center gap-2"><BedDouble size={13} /> {room.bed}</span></div><span className="line-link mt-6 inline-flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[.17em] text-[#243b30]">Conhecer acomodação <ArrowRight size={14} /></span></div></Link></article>)}</div><div className="mt-16 flex justify-center"><Link href="/reservar" className="focus-ring border border-[#243b30]/25 px-7 py-4 text-[10px] font-semibold uppercase tracking-[.17em] text-[#243b30] transition hover:border-[#243b30] hover:bg-[#243b30] hover:text-[#f7f4ee]" data-testid="link-rooms-reserve">Encontrar meu quarto <ArrowRight className="ml-3 inline" size={14} /></Link></div></div></section>;
}

function Experiences() {
  return <section id="experiencias" className="bg-[#243b30] px-5 py-24 text-[#f7f4ee] sm:px-8 sm:py-32 lg:px-12" data-testid="section-experiences"><div className="mx-auto max-w-[1280px]"><SectionTitle eyebrow="Experiências" title={<>Viva o seu tempo<br /><em>do seu jeito.</em></>} copy="Na serra, os melhores planos não precisam de agenda. Escolha um caminho, uma mesa ou simplesmente uma janela." light /><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{experiences.map(({ title, text, image: src, icon: Icon }, i) => <article key={title} className={`${i % 2 === 1 ? 'lg:mt-12' : ''} group`} data-testid={`card-experience-${i}`}><div className="img-zoom relative aspect-[.78] overflow-hidden"><img src={src} alt={title} loading="lazy" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:opacity-100" /><div className="absolute inset-0 bg-[#1d2b25]/30" /><div className="absolute inset-x-5 bottom-5"><Icon size={21} strokeWidth={1.2} className="mb-8 text-[#d7c59b]" /><h3 className="font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-5 text-[#f7f4ee]/70">{text}</p></div></div></article>)}</div><div className="mt-14 text-center"><Link href="/reservar" className="focus-ring line-link inline-flex items-center gap-3 pb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7c59b]" data-testid="link-experiences-reserve">Monte sua experiência <ArrowRight size={15} /></Link></div></div></section>;
}

function GastronomyWellness() {
  return <><section id="gastronomia" className="bg-[#f7f4ee] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="section-gastronomy"><div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-24"><div className="relative grid grid-cols-5 gap-3"><div className="img-zoom col-span-3 aspect-[.72] overflow-hidden"><img src={image('dining')} alt="Mesa posta no restaurante do Hotel Horizon" loading="lazy" className="h-full w-full object-cover" /></div><div className="img-zoom col-span-2 mt-16 aspect-[.72] overflow-hidden"><img src={image('suite')} alt="Detalhe de ingredientes e louças do restaurante" loading="lazy" className="h-full w-full object-cover" /></div></div><div><SectionTitle eyebrow="Gastronomia" title={<>Sabores que fazem parte <em>da experiência.</em></>} copy="A cozinha Horizon celebra a serra sem caricaturas. Produtos locais, fogo baixo e receitas que chegam à mesa com delicadeza." /><div className="mt-9 grid grid-cols-2 gap-y-3 border-y border-[#243b30]/15 py-5 text-sm text-[#706e67]"><span className="flex items-center gap-2"><Coffee size={15} className="text-[#b89b5e]" /> Café da manhã</span><span className="flex items-center gap-2"><Utensils size={15} className="text-[#b89b5e]" /> Restaurante</span><span className="flex items-center gap-2"><Sparkles size={15} className="text-[#b89b5e]" /> Bar da casa</span><span className="flex items-center gap-2"><Clock3 size={15} className="text-[#b89b5e]" /> Room service</span></div><button onClick={() => scrollToId('gastronomia')} className="line-link focus-ring mt-8 inline-flex items-center gap-3 pb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#243b30]" data-testid="button-gastronomy">Conheça nossa gastronomia <ArrowRight size={15} /></button></div></div></section><section id="spa-bem-estar" className="bg-[#e8e0d2] px-5 py-24 sm:px-8 lg:px-12" data-testid="section-wellness"><div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24"><div className="order-2 lg:order-1"><SectionTitle eyebrow="Spa & bem-estar" title={<>Seu momento<br /><em>de pausa.</em></>} copy="Permita-se desacelerar, respirar e aproveitar cada instante. O corpo entende quando encontra espaço." /><button onClick={() => scrollToId('spa-bem-estar')} className="line-link focus-ring mt-8 inline-flex items-center gap-3 pb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#243b30]" data-testid="button-wellness">Conhecer o Spa <ArrowRight size={15} /></button></div><div className="img-zoom order-1 aspect-[1.5] overflow-hidden lg:order-2"><img src={image('wellness')} alt="Espaço de bem-estar com piscina de pedra" loading="lazy" className="h-full w-full object-cover" /></div></div></section></>;
}

function Gallery({ onOpen }: { onOpen: (index: number) => void }) {
  return <section id="galeria" className="bg-[#f7f4ee] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="section-gallery"><div className="mx-auto max-w-[1280px]"><div className="flex items-end justify-between"><SectionTitle eyebrow="Galeria" title={<>Um lugar para<br /><em>olhar devagar.</em></>} /><span className="hidden pb-2 text-[10px] uppercase tracking-[.18em] text-[#706e67] md:block">Abra uma imagem para ampliar</span></div><div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">{gallery.map((item, i) => <button key={item.label} onClick={() => onOpen(i)} className={`focus-ring img-zoom group relative overflow-hidden text-left ${item.size === 'tall' ? 'row-span-2 aspect-[.73] sm:col-span-2 sm:row-span-2' : item.size === 'wide' ? 'col-span-2 aspect-[1.65]' : 'aspect-square'}`} data-testid={`button-gallery-${i}`}><img src={item.src} alt={item.label} loading="lazy" className="h-full w-full object-cover" /><span className="absolute inset-0 bg-[#1d2b25]/0 transition group-hover:bg-[#1d2b25]/25" /><span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[.16em] text-[#f7f4ee] opacity-0 transition group-hover:opacity-100">{item.label}</span></button>)}</div></div></section>;
}

function Reviews() {
  const [active, setActive] = useState(0); const review = reviews[active];
  return <section className="bg-[#d9ceb9] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="section-reviews"><div className="mx-auto max-w-[900px] text-center"><Quote size={32} strokeWidth={1} className="mx-auto mb-9 text-[#9a7d42]" /><p className="font-display text-3xl leading-[1.18] text-[#243b30] sm:text-5xl">“{review.quote}”</p><div className="mt-9"><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-[#243b30]">{review.name}</p><p className="mt-2 text-sm text-[#706e67]">{review.place}</p><div className="mt-4 flex justify-center gap-1 text-[#9a7d42]">{[1,2,3,4,5].map(n => <Star key={n} size={12} fill="currentColor" />)}</div></div><div className="mt-12 flex items-center justify-center gap-3"><button onClick={() => setActive((active - 1 + reviews.length) % reviews.length)} className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[#243b30]/25 text-[#243b30] transition hover:bg-[#243b30] hover:text-[#f7f4ee]" aria-label="Depoimento anterior" data-testid="button-review-prev"><ArrowLeft size={16} /></button><span className="mx-3 text-[10px] tracking-[.18em] text-[#706e67]">{String(active + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}</span><button onClick={() => setActive((active + 1) % reviews.length)} className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[#243b30]/25 text-[#243b30] transition hover:bg-[#243b30] hover:text-[#f7f4ee]" aria-label="Próximo depoimento" data-testid="button-review-next"><ArrowRight size={16} /></button></div></div></section>;
}

function LocationSection() {
  return <section id="localizacao" className="bg-[#f7f4ee] px-5 py-24 sm:px-8 sm:py-32 lg:px-12" data-testid="section-location"><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24"><div><SectionTitle eyebrow="Localização" title={<>Encontre o seu<br /><em>caminho até nós.</em></>} copy="No alto da Serra da Mantiqueira, perto o bastante para chegar sem esforço — e longe o suficiente para ouvir o silêncio." /><div className="mt-10 space-y-5 border-t border-[#243b30]/15 pt-6 text-sm text-[#706e67]"><p className="flex gap-3"><MapPin size={17} className="shrink-0 text-[#b89b5e]" /> Estrada do Horto, 4400, Alto da Boa Vista,<br />Campos do Jordão — SP</p><p className="flex items-center gap-3"><Phone size={16} className="text-[#b89b5e]" /> +55 12 3663 2040</p><p className="flex items-center gap-3"><Mail size={16} className="text-[#b89b5e]" /> cuidado@hotelhorizon.com.br</p></div><a href="https://www.google.com/maps/search/Campos+do+Jordao" target="_blank" rel="noreferrer" className="focus-ring line-link mt-8 inline-flex items-center gap-3 pb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#243b30]" data-testid="link-directions">Como chegar <MoveUpRight size={14} /></a></div><div className="relative min-h-[390px] overflow-hidden bg-[#243b30]"><img src={image('nature')} alt="Estrada entre a natureza na Serra da Mantiqueira" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" /><div className="absolute inset-0 bg-[#243b30]/30" /><div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#f7f4ee]"><div><p className="text-[10px] uppercase tracking-[.18em] text-[#d7c59b]">Estamos aqui</p><p className="mt-2 font-display text-2xl">Campos do Jordão</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f7f4ee]/50"><MapPin size={17} /></span></div></div></div></section>;
}

function Offers() {
  return <section className="bg-[#243b30] px-5 py-24 text-[#f7f4ee] sm:px-8 sm:py-32 lg:px-12" data-testid="section-offers"><div className="mx-auto max-w-[1280px]"><div className="flex items-end justify-between"><SectionTitle eyebrow="Experiências especiais" title={<>Fique por um motivo<br /><em>especial.</em></>} light /><span className="hidden pb-2 text-[10px] uppercase tracking-[.18em] text-[#f7f4ee]/50 md:block">Para guardar na memória</span></div><div className="mt-14 grid gap-6 md:grid-cols-2">{offers.map((offer, i) => <article key={offer.title} className="group grid grid-cols-2 gap-5 border-t border-[#f7f4ee]/20 pt-5" data-testid={`card-offer-${i}`}><div className="img-zoom aspect-square overflow-hidden"><img src={offer.image} alt={offer.title} loading="lazy" className="h-full w-full object-cover" /></div><div className="flex flex-col"><h3 className="font-display text-2xl">{offer.title}</h3><p className="mt-3 text-sm leading-6 text-[#f7f4ee]/70">{offer.text}</p><p className="mt-auto pt-5 text-[11px] leading-5 text-[#d7c59b]">{offer.condition}</p><Link href={`/reservar?offer=${offer.offerCode}`} className="line-link mt-5 inline-flex w-fit items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[.17em]" data-testid={`link-offer-${i}`}>Ver oferta <ArrowRight size={14} /></Link></div></article>)}</div></div></section>;
}

function FinalCta() { return <section className="relative flex min-h-[490px] items-center overflow-hidden px-5 py-24 text-center text-[#f7f4ee] sm:px-8 lg:px-12" data-testid="section-final-cta"><img src={image('hero')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-bottom" /><div className="absolute inset-0 bg-[#1d2b25]/70" /><div className="relative z-10 mx-auto max-w-2xl"><Eyebrow light>Quando você estiver pronto</Eyebrow><h2 className="font-display text-5xl leading-[.98] sm:text-7xl">Seu próximo momento<br /><em>começa aqui.</em></h2><p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#f7f4ee]/70">Reserve sua estadia e descubra a pausa que a serra guardou para você.</p><Link href="/reservar" className="focus-ring mt-8 inline-flex bg-[#b89b5e] px-7 py-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#1d2b25] transition hover:bg-[#d1b978]" data-testid="link-final-reserve">Reservar agora <MoveUpRight className="ml-3" size={15} /></Link></div></section>; }

function Footer() { const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); return <footer className="bg-[#1d2b25] px-5 pb-8 pt-16 text-[#f7f4ee] sm:px-8 lg:px-12" data-testid="site-footer"><div className="mx-auto max-w-[1280px]"><div className="grid gap-12 border-b border-[#f7f4ee]/15 pb-14 md:grid-cols-[1.3fr_1fr_1fr_1.5fr]"><div><Logo light /><p className="mt-6 max-w-xs text-sm leading-6 text-[#f7f4ee]/55">Uma casa para viver a serra com presença, beleza e tempo.</p></div><div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7c59b]">Hotel</p><div className="flex flex-col items-start gap-3 text-sm text-[#f7f4ee]/65"><button onClick={() => scrollToId('hotel')} data-testid="button-footer-hotel">O hotel</button><button onClick={() => scrollToId('acomodacoes')} data-testid="button-footer-rooms">Acomodações</button><button onClick={() => scrollToId('experiencias')} data-testid="button-footer-experiences">Experiências</button><button onClick={() => scrollToId('galeria')} data-testid="button-footer-gallery">Galeria</button></div></div><div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7c59b]">Informações</p><div className="flex flex-col items-start gap-3 text-sm text-[#f7f4ee]/65"><button onClick={() => scrollToId('localizacao')} data-testid="button-footer-location">Localização</button><a href="mailto:cuidado@hotelhorizon.com.br" data-testid="link-footer-email">Contato</a><span>FAQ</span><Link href="/politica-de-privacidade" data-testid="link-footer-privacy">Privacidade</Link></div></div><div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7c59b]">Uma carta de Horizon</p><p className="mb-5 text-sm leading-6 text-[#f7f4ee]/55">Receba novidades e experiências especiais, sem excesso.</p><form onSubmit={e => { e.preventDefault(); if (email) setSent(true); }} className="flex border-b border-[#f7f4ee]/35 pb-2"><label htmlFor="newsletter-email" className="sr-only">Seu e-mail</label><input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu melhor e-mail" className="focus-ring min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#f7f4ee]/40" data-testid="input-newsletter" /><button aria-label="Inscrever-se" className="focus-ring text-[#d7c59b]" data-testid="button-newsletter">{sent ? <span className="text-[10px] uppercase tracking-[.1em]">Inscrito</span> : <Send size={16} />}</button></form></div></div><div className="flex flex-col justify-between gap-5 pt-7 text-[10px] uppercase tracking-[.13em] text-[#f7f4ee]/45 sm:flex-row"><span>© 2026 Hotel Horizon. Todos os direitos reservados.</span><div className="flex items-center gap-5"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" data-testid="link-instagram"><Instagram size={16} /></a><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" data-testid="link-facebook"><Globe2 size={16} /></a><span>Estrada do Horto, 4400, Alto da Boa Vista, Campos do Jordão — SP</span></div></div></div></footer>; }

function Lightbox({ index, onClose, onChange }: { index: number; onClose: () => void; onChange: (index: number) => void }) { const item = gallery[index]; useEffect(() => { const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onChange((index + 1) % gallery.length); if (e.key === 'ArrowLeft') onChange((index - 1 + gallery.length) % gallery.length); }; window.addEventListener('keydown', handle); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; }; }, [index, onClose, onChange]); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15231d]/95 p-5 sm:p-10" role="dialog" aria-modal="true" aria-label={`Imagem: ${item.label}`}><button onClick={onClose} className="focus-ring absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#f7f4ee]/30 text-[#f7f4ee]" aria-label="Fechar galeria" data-testid="button-lightbox-close"><X size={20} /></button><button onClick={() => onChange((index - 1 + gallery.length) % gallery.length)} className="focus-ring absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#f7f4ee]/30 text-[#f7f4ee] sm:left-8" aria-label="Imagem anterior" data-testid="button-lightbox-prev"><ArrowLeft size={18} /></button><figure className="max-h-full max-w-5xl text-center"><img src={item.src} alt={item.label} className="max-h-[78vh] w-auto max-w-full object-contain" /><figcaption className="mt-4 text-[10px] uppercase tracking-[.2em] text-[#f7f4ee]/65">{item.label} <span className="mx-3 text-[#d7c59b]">{String(index + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span></figcaption></figure><button onClick={() => onChange((index + 1) % gallery.length)} className="focus-ring absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#f7f4ee]/30 text-[#f7f4ee] sm:right-8" aria-label="Próxima imagem" data-testid="button-lightbox-next"><ArrowRight size={18} /></button></div>; }

function Home() { const [lightbox, setLightbox] = useState<number | null>(null); return <div className="noise min-h-[100dvh] bg-[#f7f4ee]"><Header /><main><Hero /><div className="relative z-20 mx-auto -mt-20 max-w-[1280px] px-5 sm:px-8 lg:px-12"><div className="bg-[#f7f4ee] p-3 shadow-[0_15px_55px_rgba(29,43,37,.16)] sm:p-4"><BookingWidget /></div></div><HotelIntro /><Differentiators /><Rooms /><Experiences /><GastronomyWellness /><Gallery onOpen={setLightbox} /><Reviews /><LocationSection /><Offers /><FinalCta /></main><Footer /><div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#243b30]/10 bg-[#f7f4ee]/95 p-3 backdrop-blur-md lg:hidden"><Link href="/reservar" className="focus-ring flex w-full items-center justify-center bg-[#b89b5e] py-3.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#1d2b25]" data-testid="link-sticky-mobile-reserve">Reservar agora <ArrowRight className="ml-3" size={15} /></Link></div>{lightbox !== null && <Lightbox index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />}</div>; }

function AccommodationDetail() { const [, params] = useRoute('/acomodacoes/:slug'); const room = rooms.find(item => item.slug === params?.slug) ?? rooms[0]; const [lightbox, setLightbox] = useState<number | null>(null); return <div className="noise min-h-[100dvh] bg-[#f7f4ee]"><Header /><main className="pt-[78px]"><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12"><Link href="/" className="focus-ring line-link inline-flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#243b30]" data-testid="link-detail-back"><ArrowLeft size={15} /> Voltar ao hotel</Link><div className="mt-8 grid gap-3 md:grid-cols-2 md:grid-rows-2"><button onClick={() => setLightbox(0)} className="focus-ring img-zoom row-span-2 aspect-[.9] overflow-hidden md:aspect-auto" data-testid="button-detail-gallery-0"><img src={room.gallery[0]} alt={room.name} className="h-full w-full object-cover" /></button>{room.gallery.slice(1).map((src, i) => <button onClick={() => setLightbox(i + 1)} key={src} className="focus-ring img-zoom hidden aspect-[1.6] overflow-hidden md:block" data-testid={`button-detail-gallery-${i + 1}`}><img src={src} alt={`${room.name}, detalhe ${i + 2}`} className="h-full w-full object-cover" /></button>)}</div></div><section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:gap-24 lg:px-12"><div><Eyebrow>{room.eyebrow}</Eyebrow><h1 className="font-display text-5xl leading-[1.02] text-[#243b30] sm:text-7xl">{room.name}</h1><p className="mt-8 max-w-xl text-base leading-8 text-[#706e67]">{room.longDescription}</p><div className="mt-12 grid grid-cols-2 gap-y-7 border-y border-[#243b30]/15 py-7 sm:grid-cols-4"><div><p className="text-[9px] uppercase tracking-[.16em] text-[#706e67]">Hóspedes</p><p className="mt-2 font-display text-xl text-[#243b30]">{room.guests}</p></div><div><p className="text-[9px] uppercase tracking-[.16em] text-[#706e67]">Área</p><p className="mt-2 font-display text-xl text-[#243b30]">{room.area}</p></div><div><p className="text-[9px] uppercase tracking-[.16em] text-[#706e67]">Cama</p><p className="mt-2 font-display text-xl text-[#243b30]">King</p></div><div><p className="text-[9px] uppercase tracking-[.16em] text-[#706e67]">Vista</p><p className="mt-2 font-display text-xl text-[#243b30]">{room.view.split(' ')[0]}</p></div></div><h2 className="mt-14 font-display text-3xl text-[#243b30]">Comodidades</h2><div className="mt-5 grid gap-3 text-sm text-[#706e67] sm:grid-cols-2">{room.amenities.map(item => <p key={item} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#b89b5e]" />{item}</p>)}</div></div><aside className="h-fit border border-[#243b30]/15 bg-[#e8e0d2] p-6 sm:p-8 lg:sticky lg:top-28"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#9a7d42]">Sua estadia</p><p className="mt-3 font-display text-3xl text-[#243b30]">{room.price}</p><p className="mt-3 text-sm leading-6 text-[#706e67]">Consulte datas e condições para esta acomodação. Nossa equipe responde pessoalmente.</p><Link href={`/reservar?accommodationSlug=${room.slug}`} className="focus-ring mt-7 flex items-center justify-center bg-[#243b30] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.17em] text-[#f7f4ee] transition hover:bg-[#345244]" data-testid="link-detail-reserve">Reservar esta acomodação <ArrowRight className="ml-3" size={15} /></Link><div className="mt-8 border-t border-[#243b30]/15 pt-6"><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#243b30]">Política de hospedagem</p><p className="mt-3 text-xs leading-5 text-[#706e67]">Check-in a partir das 15h · Check-out até 12h<br />Cancelamento flexível até 7 dias antes.</p></div></aside></section></main><Footer />{lightbox !== null && <Lightbox index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />}</div>; }

type ReserveStep = 'search' | 'results' | 'form' | 'confirmation';

function OfferBanner({ offer }: { offer: (typeof offers)[number] }) {
  return <div className="mb-6 border border-[#b89b5e]/50 bg-[#243b30] p-5 text-[#f7f4ee]" data-testid="banner-offer">
    <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7c59b]">Oferta selecionada</p>
    <p className="mt-2 font-display text-2xl">{offer.title}</p>
    <p className="mt-2 text-sm leading-6 text-[#f7f4ee]/75">{offer.text}</p>
    <p className="mt-3 text-[11px] uppercase tracking-[.1em] text-[#d7c59b]">{offer.condition} · {offer.discountPercent}% de desconto na diária</p>
  </div>;
}

function Reserve() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] ?? '');
  const activeOffer = offers.find(o => o.offerCode === params.get('offer'));
  const preselectedSlug = params.get('accommodationSlug') ?? '';

  const [step, setStep] = useState<ReserveStep>(params.get('checkin') && params.get('checkout') ? 'results' : 'search');
  const [checkin, setCheckin] = useState(params.get('checkin') ?? '');
  const [checkout, setCheckout] = useState(params.get('checkout') ?? '');
  const [guests, setGuests] = useState(params.get('guests') ?? '2');
  const [roomsCount, setRoomsCount] = useState(params.get('rooms') ?? '1');
  const [searchError, setSearchError] = useState('');
  const [selectedOption, setSelectedOption] = useState<AccommodationOption | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<{ confirmationCode: string; accommodationName: string; checkin: string; checkout: string; guests: number; totalAmount: number; guestName: string } | null>(null);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [formError, setFormError] = useState('');

  const guestsNumber = Number(guests) || 1;
  const roomsNumber = Number(roomsCount) || 1;

  const availabilityParams = { checkin, checkout, guests: guestsNumber, rooms: roomsNumber };
  const availability = useCheckAvailability(
    availabilityParams,
    { query: { queryKey: getCheckAvailabilityQueryKey(availabilityParams), enabled: step === 'results' && Boolean(checkin) && Boolean(checkout) } },
  );
  const createReservation = useCreateReservation();

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!checkin || !checkout) { setSearchError('Selecione as datas de check-in e check-out.'); return; }
    if (checkin < todayISO()) { setSearchError('A data de check-in não pode estar no passado.'); return; }
    if (checkout <= checkin) { setSearchError('O check-out deve ser depois do check-in.'); return; }
    if (activeOffer?.offerCode === 'ritmo-da-serra') {
      const nights = Math.round((new Date(`${checkout}T00:00:00`).getTime() - new Date(`${checkin}T00:00:00`).getTime()) / 86400000);
      if (nights < 3) { setSearchError('A oferta "Ritmo da serra" exige no mínimo 3 noites.'); return; }
    }
    setLocation(`/reservar?${new URLSearchParams({ checkin, checkout, guests, rooms: roomsCount, ...(activeOffer ? { offer: activeOffer.offerCode } : {}) }).toString()}`, { replace: true });
    setStep('results');
  };

  const chooseOption = (option: AccommodationOption) => { setSelectedOption(option); setFormError(''); setStep('form'); };

  const submitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedOption) return;
    if (guestName.trim().length < 2) { setFormError('Informe seu nome completo.'); return; }
    if (!isValidEmail(guestEmail)) { setFormError('Informe um e-mail válido.'); return; }
    if (guestPhone.trim().length < 8) { setFormError('Informe um telefone válido.'); return; }
    if (!agreedPrivacy) { setFormError('É necessário concordar com a Política de Privacidade para continuar.'); return; }

    createReservation.mutate(
      { data: {
        checkin, checkout, guests: guestsNumber, rooms: roomsNumber,
        accommodationSlug: selectedOption.slug,
        offerCode: activeOffer?.offerCode ?? null,
        guestName: guestName.trim(), guestEmail: guestEmail.trim(), guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim() || null,
      } },
      {
        onSuccess: (reservation) => {
          setConfirmedReservation({ confirmationCode: reservation.confirmationCode, accommodationName: reservation.accommodationName, checkin: reservation.checkin, checkout: reservation.checkout, guests: reservation.guests, totalAmount: reservation.totalAmount, guestName: reservation.guestName });
          setStep('confirmation');
        },
        onError: (err) => setFormError(err instanceof Error ? err.message : 'Não foi possível concluir a reserva agora. Tente novamente.'),
      },
    );
  };

  return <div className="noise min-h-[100dvh] bg-[#e8e0d2]"><Header /><main className="mx-auto max-w-[1100px] px-5 pb-20 pt-32 sm:px-8 lg:px-12">
    <Link href="/" className="focus-ring line-link inline-flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#243b30]" data-testid="link-reserve-back"><ArrowLeft size={15} /> Voltar ao hotel</Link>
    <div className="mt-12 grid items-start gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-24">
      <div><Eyebrow>Reserva direta</Eyebrow><h1 className="font-display text-6xl leading-[.95] text-[#243b30] sm:text-8xl">Seu tempo<br /><em>começa aqui.</em></h1><p className="mt-8 max-w-md text-base leading-7 text-[#706e67]">Você está a poucos passos de uma pausa na Serra da Mantiqueira. Consulte a disponibilidade real dos nossos quartos e reserve diretamente com a gente.</p><div className="mt-10 flex gap-3 text-[10px] uppercase tracking-[.14em] text-[#706e67]"><span className="flex items-center gap-2"><ShieldIcon /> Dados protegidos</span><span className="flex items-center gap-2"><Heart size={14} /> Atendimento pessoal</span></div></div>
      <div className="bg-[#f7f4ee] p-5 shadow-[0_15px_55px_rgba(29,43,37,.1)] sm:p-8">
        {activeOffer && <OfferBanner offer={activeOffer} />}

        {step === 'search' && <form onSubmit={runSearch} data-testid="form-reserve-search">
          <h2 className="font-display text-3xl text-[#243b30]">Consulte disponibilidade</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Check-in</span><input required type="date" min={todayISO()} value={checkin} onChange={e => setCheckin(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-search-checkin" /></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Check-out</span><input required type="date" min={checkin || todayISO()} value={checkout} onChange={e => setCheckout(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-search-checkout" /></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Hóspedes</span><select value={guests} onChange={e => setGuests(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="select-search-guests">{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'hóspede' : 'hóspedes'}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Quartos</span><select value={roomsCount} onChange={e => setRoomsCount(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="select-search-rooms">{[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          {searchError && <p className="mt-3 flex items-center gap-2 text-xs text-red-700" role="alert" data-testid="text-search-error"><AlertCircle size={14} /> {searchError}</p>}
          <button type="submit" className="focus-ring mt-6 w-full bg-[#b89b5e] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[#1d2b25] transition hover:bg-[#cfb777]" data-testid="button-search-availability">Ver disponibilidade</button>
        </form>}

        {step === 'results' && <div data-testid="section-reserve-results">
          <div className="flex items-center justify-between"><h2 className="font-display text-3xl text-[#243b30]">Quartos disponíveis</h2><button onClick={() => setStep('search')} className="focus-ring text-[10px] font-semibold uppercase tracking-[.14em] text-[#243b30]" data-testid="button-back-to-search">Alterar busca</button></div>
          <p className="mt-2 text-sm text-[#706e67]">{checkin} a {checkout} · {guests} {guestsNumber === 1 ? 'hóspede' : 'hóspedes'} · {roomsCount} {roomsNumber === 1 ? 'quarto' : 'quartos'}</p>
          {availability.isLoading && <p className="mt-8 flex items-center gap-2 text-sm text-[#706e67]" data-testid="text-availability-loading"><Loader2 size={16} className="animate-spin" /> Consultando disponibilidade…</p>}
          {availability.isError && <p className="mt-8 flex items-center gap-2 text-sm text-red-700" role="alert" data-testid="text-availability-error"><AlertCircle size={16} /> Não foi possível consultar a disponibilidade agora. Tente novamente.</p>}
          {availability.data && <div className="mt-6 space-y-4">
            {availability.data.options.filter(option => option.availableRooms >= roomsNumber && option.maxGuests * roomsNumber >= guestsNumber).length === 0 && <p className="text-sm text-[#706e67]" data-testid="text-no-availability">{availability.data.message}</p>}
            {availability.data.options.filter(option => option.availableRooms >= roomsNumber && option.maxGuests * roomsNumber >= guestsNumber).map(option => {
              const preselected = preselectedSlug === option.slug;
              const discounted = activeOffer ? Math.round(option.totalPrice * (1 - activeOffer.discountPercent / 100)) : option.totalPrice;
              return <article key={option.slug} className={`flex gap-4 border p-4 ${preselected ? 'border-[#b89b5e]' : 'border-[#243b30]/15'}`} data-testid={`card-availability-${option.slug}`}>
                <img src={option.photos[0]} alt={option.name} className="h-24 w-24 shrink-0 object-cover" loading="lazy" />
                <div className="flex-1"><h3 className="font-display text-xl text-[#243b30]">{option.name}</h3><p className="mt-1 text-xs leading-5 text-[#706e67]">{option.description}</p><p className="mt-2 text-[11px] uppercase tracking-[.1em] text-[#706e67]">Até {option.maxGuests} hóspedes por quarto · {option.availableRooms} {option.availableRooms === 1 ? 'quarto disponível' : 'quartos disponíveis'}</p></div>
                <div className="flex shrink-0 flex-col items-end justify-between text-right">
                  <div><p className="text-[10px] uppercase tracking-[.1em] text-[#706e67]">{formatBRL(option.pricePerNight)} / noite</p><p className="mt-1 font-display text-lg text-[#243b30]">{formatBRL(discounted)}</p>{activeOffer && <p className="text-[10px] text-[#9a7d42]">com a oferta ({activeOffer.discountPercent}% off)</p>}</div>
                  <button onClick={() => chooseOption(option)} className="focus-ring mt-3 bg-[#243b30] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[.14em] text-[#f7f4ee] transition hover:bg-[#345244]" data-testid={`button-choose-${option.slug}`}>Escolher este quarto</button>
                </div>
              </article>;
            })}
          </div>}
        </div>}

        {step === 'form' && selectedOption && <form onSubmit={submitReservation} data-testid="form-reserve-guest">
          <div className="flex items-center justify-between"><h2 className="font-display text-3xl text-[#243b30]">Seus dados</h2><button type="button" onClick={() => setStep('results')} className="focus-ring text-[10px] font-semibold uppercase tracking-[.14em] text-[#243b30]" data-testid="button-back-to-results">Trocar quarto</button></div>
          <div className="mt-4 flex items-center gap-3 border border-[#243b30]/15 bg-[#e8e0d2] p-4"><img src={selectedOption.photos[0]} alt={selectedOption.name} className="h-16 w-16 object-cover" /><div><p className="font-display text-lg text-[#243b30]">{selectedOption.name}</p><p className="text-xs text-[#706e67]">{checkin} a {checkout} · {guests} {guestsNumber === 1 ? 'hóspede' : 'hóspedes'}</p><p className="text-xs font-medium text-[#243b30]">{formatBRL(activeOffer ? Math.round(selectedOption.totalPrice * (1 - activeOffer.discountPercent / 100)) : selectedOption.totalPrice)} · pagamento no check-in</p></div></div>
          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Nome completo</span><input required value={guestName} onChange={e => setGuestName(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-guest-name" /></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">E-mail</span><input required type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-guest-email" /></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Telefone</span><input required type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+55 12 90000-0000" className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-guest-phone" /></label>
            <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Observações (opcional)</span><textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={3} className="focus-ring border border-[#243b30]/20 bg-transparent px-3 py-3 text-sm outline-none" data-testid="input-guest-notes" /></label>
            <label className="flex items-start gap-2 text-xs text-[#706e67]"><input required type="checkbox" checked={agreedPrivacy} onChange={e => setAgreedPrivacy(e.target.checked)} className="focus-ring mt-0.5" data-testid="checkbox-privacy" /><span>Li e concordo com a <Link href="/politica-de-privacidade" target="_blank" className="underline">Política de Privacidade</Link>.</span></label>
          </div>
          {formError && <p className="mt-4 flex items-center gap-2 text-xs text-red-700" role="alert" data-testid="text-form-error"><AlertCircle size={14} /> {formError}</p>}
          <button type="submit" disabled={createReservation.isPending} className="focus-ring mt-6 flex w-full items-center justify-center gap-2 bg-[#b89b5e] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[#1d2b25] transition hover:bg-[#cfb777] disabled:opacity-60" data-testid="button-confirm-reservation">{createReservation.isPending && <Loader2 size={14} className="animate-spin" />} Confirmar reserva</button>
        </form>}

        {step === 'confirmation' && confirmedReservation && <div data-testid="section-reserve-confirmation">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#243b30] text-[#f7f4ee]"><Check size={22} /></div>
          <h2 className="mt-5 font-display text-3xl text-[#243b30]">Reserva confirmada!</h2>
          <p className="mt-2 text-sm text-[#706e67]">Enviamos os detalhes para você, {confirmedReservation.guestName.split(' ')[0]}. Guarde o código da sua reserva.</p>
          <div className="mt-6 space-y-3 border border-[#243b30]/15 bg-[#e8e0d2] p-5 text-sm">
            <p className="flex justify-between"><span className="text-[#706e67]">Código da reserva</span><strong className="font-display text-lg text-[#243b30]" data-testid="text-confirmation-code">{confirmedReservation.confirmationCode}</strong></p>
            <p className="flex justify-between"><span className="text-[#706e67]">Acomodação</span><span className="font-medium text-[#243b30]">{confirmedReservation.accommodationName}</span></p>
            <p className="flex justify-between"><span className="text-[#706e67]">Datas</span><span className="font-medium text-[#243b30]">{confirmedReservation.checkin} a {confirmedReservation.checkout}</span></p>
            <p className="flex justify-between"><span className="text-[#706e67]">Hóspedes</span><span className="font-medium text-[#243b30]">{confirmedReservation.guests}</span></p>
            <p className="flex justify-between border-t border-[#243b30]/15 pt-3"><span className="text-[#706e67]">Valor total</span><strong className="font-display text-lg text-[#243b30]">{formatBRL(confirmedReservation.totalAmount)}</strong></p>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#706e67]">O pagamento é feito diretamente no check-in — ainda não há cobrança online. Qualquer dúvida, fale com a gente pelo WhatsApp ou por e-mail.</p>
          <Link href="/" className="focus-ring mt-7 inline-flex items-center gap-2 bg-[#243b30] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[#f7f4ee] transition hover:bg-[#345244]" data-testid="link-confirmation-home">Voltar ao início <ArrowRight size={14} /></Link>
        </div>}
      </div>
    </div>
    <div className="mt-24 border-t border-[#243b30]/15 pt-8 text-sm text-[#706e67]"><div className="flex flex-wrap justify-between gap-5"><span>Hotel Horizon · Campos do Jordão</span><span>+55 12 3663 2040 · cuidado@hotelhorizon.com.br</span></div></div>
  </main></div>;
}
function ShieldIcon() { return <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#9a7d42] text-[8px]">✓</span>; }

function PrivacyPolicy() {
  return <div className="noise min-h-[100dvh] bg-[#f7f4ee]"><Header /><main className="mx-auto max-w-[820px] px-5 pb-24 pt-36 sm:px-8 lg:px-12">
    <Link href="/" className="focus-ring line-link inline-flex items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#243b30]" data-testid="link-privacy-back"><ArrowLeft size={15} /> Voltar ao hotel</Link>
    <Eyebrow>Privacidade</Eyebrow>
    <h1 className="font-display text-5xl text-[#243b30] sm:text-6xl">Política de Privacidade</h1>
    <p className="mt-3 text-sm text-[#706e67]">Última atualização: agosto de 2026</p>
    <div className="mt-10 space-y-7 text-sm leading-7 text-[#706e67]">
      <section><h2 className="font-display text-2xl text-[#243b30]">1. Quem somos</h2><p className="mt-2">O Hotel Horizon, localizado na Estrada do Horto, 4400, Alto da Boa Vista, Campos do Jordão — SP, é responsável pelo tratamento dos dados pessoais coletados através deste site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p></section>
      <section><h2 className="font-display text-2xl text-[#243b30]">2. Quais dados coletamos</h2><p className="mt-2">Ao utilizar nosso formulário de reserva, coletamos nome completo, e-mail, telefone, datas de estadia, número de hóspedes, acomodação escolhida e eventuais observações que você nos enviar.</p></section>
      <section><h2 className="font-display text-2xl text-[#243b30]">3. Para que usamos seus dados</h2><p className="mt-2">Os dados coletados são utilizados exclusivamente para gerenciar sua reserva, confirmar disponibilidade, entrar em contato sobre sua estadia e cumprir obrigações legais e contratuais relacionadas à hospedagem. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.</p></section>
      <section><h2 className="font-display text-2xl text-[#243b30]">4. Por quanto tempo guardamos seus dados</h2><p className="mt-2">Mantemos os dados de reservas pelo tempo necessário para cumprir finalidades contratuais, fiscais e legais, após o qual são eliminados ou anonimizados.</p></section>
      <section><h2 className="font-display text-2xl text-[#243b30]">5. Seus direitos</h2><p className="mt-2">Você pode solicitar a qualquer momento a confirmação, correção, portabilidade ou eliminação dos seus dados pessoais, entrando em contato pelo e-mail cuidado@hotelhorizon.com.br.</p></section>
      <section><h2 className="font-display text-2xl text-[#243b30]">6. Contato</h2><p className="mt-2">Em caso de dúvidas sobre esta política, fale com a gente pelo e-mail cuidado@hotelhorizon.com.br ou pelo telefone +55 12 3663 2040.</p></section>
    </div>
  </main><Footer /></div>;
}

function WhatsAppButton() {
  const message = encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre uma reserva no Hotel Horizon.');
  return <a href={`https://wa.me/551236632040?text=${message}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp" className="focus-ring fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,.25)] transition hover:scale-105" data-testid="button-whatsapp-float"><MessageCircle size={26} /></a>;
}

function Router() { return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route path="/acomodacoes/:slug" component={AccommodationDetail} /><Route path="/reservar" component={Reserve} /><Route path="/politica-de-privacidade" component={PrivacyPolicy} /><Route component={NotFound} /></Switch></ErrorBoundary>; }
function App() {
  useEffect(() => {
    document.title = 'Hotel Horizon — Uma experiência para lembrar';
    const description = document.querySelector('meta[name="description"]') ?? document.createElement('meta');
    description.setAttribute('name', 'description');
    description.setAttribute('content', 'Hotel Horizon — hospedagem de charme na Serra da Mantiqueira, em Campos do Jordão. Reserve diretamente e viva uma experiência de conforto, gastronomia e bem-estar.');
    document.head.appendChild(description);
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', window.location.origin);
    document.head.appendChild(canonical);
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: 'Hotel Horizon',
      description: 'Refúgio boutique de design, natureza e hospitalidade na Serra da Mantiqueira.',
      address: { '@type': 'PostalAddress', streetAddress: 'Estrada do Horto, 4400, Alto da Boa Vista', addressLocality: 'Campos do Jordão', addressRegion: 'SP', addressCountry: 'BR' },
      telephone: '+55 12 3663 2040',
      email: 'cuidado@hotelhorizon.com.br',
      amenityFeature: ['Spa', 'Restaurante', 'Piscina', 'Wi-Fi'],
    });
    document.head.appendChild(schema);
    return () => { schema.remove(); };
  }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /><WhatsAppButton /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
