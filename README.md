# ŠRD Posušje - Rezervacija ribolovnih pozicija

Jednostavna i minimalistička React aplikacija za rezervaciju ribolovnih pozicija na jezeru.

## Pokretanje

1. Instalirajte pakete:

```bash
npm install
```

2. Pokrenite razvojni poslužitelj:

```bash
npm run dev
```

3. Izgradite za produkciju:

```bash
npm run build
```

## Struktura projekta

- `src/components` - ponovljivo UI komponente
- `src/pages` - glavna stranica aplikacije
- `src/hooks` - prilagođeni React hook za rezervacije
- `src/services` - logika za spremanje rezervacija i autentifikaciju
- `src/types` - TypeScript tipovi
- `src/data` - konfiguracija pozicija pinova
- `src/assets` - slika karte jezera

## Kako ažurirati kartu i pinove

- `src/assets/lake-photo.png` - zamijenite ovom datotekom slike jezera
- `src/data/positions.ts` - prilagodite `x` i `y` koordinate za 24 pin-a

Koordinate su postavljene u postocima i kasnije se automatski pozicioniraju na karti.

## Administracija

- Otvorite panel za prijavu administratora
- Upišite lozinku: `Posusje2026!`
- Administrator može:
  - brisati rezervacije
  - uređivati rezervacije
  - označiti rezervaciju kao završenu

## Dijeljena pohrana rezervacija

Aplikacija podržava dijeljenu pohranu preko Supabasea. Ako postavite `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` u `.env` datoteci, rezervacije će se pohranjivati u Supabase tablicu `reservations`.

Ako env varijable nisu postavljene, aplikacija će i dalje raditi lokalno pomoću browser `localStorage`.

### Primjer Supabase tablice

Stvorite tablicu `reservations` s ovim stupcima:

- `id` (text, primary key)
- `positionId` (int)
- `firstName` (text)
- `lastName` (text)
- `phone` (text)
- `arriveDate` (date)
- `leaveDate` (date)
- `persons` (int)
- `notes` (text)
- `completed` (boolean)

## Kako postaviti Supabase

1. Kopirajte `.env.example` u `.env`
2. Dodajte svoj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
3. Pokrenite `npm run dev`

Ako želite da backend radi dijeljeno za sve korisnike, preporučam Vercel + Supabase.

## Deploy na Vercel + Supabase

### 1. Napravite GitHub repozitorij

1. U root direktoriju projekta pokrenite:

```bash
git init
git add .
git commit -m "Initial ŠRD Posušje reservation app"
```

2. Napravite novi GitHub repozitorij i povežite ga:

```bash
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. Napravite Supabase projekt

1. Otvorite https://app.supabase.com i prijavite se.
2. Kliknite `New project` i napravite besplatan projekt.
3. U sekciji `Database` dodajte novu tablicu `reservations`.

### 3. Kreirajte tablicu `reservations`

U Supabase SQL editoru pokrenite ovaj SQL kod:

```sql
create table public.reservations (
  id text primary key,
  positionId int not null,
  firstName text not null,
  lastName text not null,
  phone text not null,
  arriveDate date not null,
  leaveDate date not null,
  persons int not null,
  notes text,
  completed boolean not null default false
);
```

### 4. Konfigurirajte pristup iz frontenda

Za ovu aplikaciju je dovoljno da tablica bude javno dostupna preko Supabase anon ključa.
Ako je potrebno, provjerite da `Row Level Security` (RLS) za tablicu `reservations` nije omogućena, ili dodajte ove jednostavne policyje:

```sql
-- Ako koristite RLS, dodajte ove policyje da bi anon korisnik mogao čitati i zapisivati
alter table public.reservations enable row level security;
create policy "Allow read" on public.reservations for select using (true);
create policy "Allow insert" on public.reservations for insert with check (true);
create policy "Allow update" on public.reservations for update using (true) with check (true);
create policy "Allow delete" on public.reservations for delete using (true);
```

### 5. Postavite Vercel projekt

1. Otvorite https://vercel.com i prijavite se.
2. Kliknite `New Project` i odaberite GitHub repozitorij.
3. Zadržite zadane postavke za framework (React + Vite).
4. U `Environment Variables` dodajte:
   - `VITE_SUPABASE_URL` = vaš Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = vaš Supabase anon key

### 6. Build postavke na Vercelu

U Vercelu, pod Build & Output Settings postavite:

- Build command: `npm run build`
- Output directory: `dist`

Vercel će automatski instalirati dependencyje i deployati aplikaciju.

### 7. Pokrenite i provjerite

Nakon uspješnog deploya, Vercel će dati adresu poput `https://your-app.vercel.app`.
Otvorite je i testirajte:
- Dodajte rezervaciju
- Osvježite stranicu u drugom pregledniku ili uređaju
- Trebalo bi se vidjeti dijeljene rezervacije

### 8. Korisna napomena

- `.env` datoteka koristite samo lokalno.
- U Vercel-u treba staviti varijable u Project Settings > Environment Variables.
- Ako ne želite Vercelovu poddomenu, možete koristiti vlastitu domenu ili besplatnu `Freenom` domenu.

## Kako aplikacija radi na hostingu

- Frontend: statička React aplikacija buildana u `dist`
- Backend: Supabase baza za pohranu rezervacija
- Rezervacije se dijele sa svim korisnicima jer frontend koristi isti Supabase projekt i istu tablicu

## Dodatni savjeti

- Ako želite kasnije dodati sigurniju autentifikaciju, Supabase može upravljati korisnicima i admin pristupom.
- Za sada je u aplikaciji anon Supabase ključ dovoljan za dijeljene rezervacije.
