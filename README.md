# KidOS

Fundație tehnică pentru KidOS. Aplicația pornește cu o pagină rădăcină goală și nu include încă funcționalități de produs.

## Cerințe

- Node.js 20.9 sau mai nou
- pnpm 10.33.4, versiunea declarată în `packageManager`

## Instalare

```bash
pnpm install
```

## Comenzi

- `pnpm dev` — server de dezvoltare
- `pnpm build` — build de producție
- `pnpm start` — pornește aplicația construită
- `pnpm lint` — ESLint
- `pnpm typecheck` — verificarea TypeScript
- `pnpm test` — Vitest, o singură rulare, fără watch
- `pnpm db:generate` — generează Prisma Client
- `pnpm db:migrate:dev` — creează și aplică o migrare locală
- `pnpm db:migrate:deploy` — aplică migrările existente
- `pnpm db:studio` — deschide Prisma Studio

## Conexiune la Neon

Adaugă `DATABASE_URL` și `DATABASE_URL_UNPOOLED` în `.env` (fișierul este ignorat de Git). Aplicația folosește `DATABASE_URL`, adresa pooled, pentru interogările runtime. Prisma folosește `DATABASE_URL_UNPOOLED`, conexiunea directă, pentru migrări și unelte de dezvoltare.

Schema bazei de date este în `prisma/schema.prisma`. Adaugă modele Prisma acolo, apoi rulează `pnpm db:migrate:dev --name nume_migrare` pentru a genera și aplica o migrare. Clientul se generează automat la migrare; pentru regenerare fără migrare, folosește `pnpm db:generate`.

Înainte de prima migrare, verifică dacă Neon conține deja tabele sau date. Dacă da, schema trebuie întâi introspectată și migrările Prisma trebuie inițializate fără a recrea acele tabele. În acest moment nu există migrări Prisma în proiect și nu a fost modificată schema din Neon.

Pornește aplicația cu `pnpm dev` și deschide `http://localhost:3000/api/db-test` pentru a testa Prisma cu `SELECT now()`. Un răspuns `{ "ok": true, "databaseTime": "..." }` confirmă conexiunea.

## localStorage

Persistența temporară este în browser, prin `src/lib/storage.ts`. Valorile sunt JSON, cheile primesc prefixul `KidOS.`, iar datele citite se validează cu Zod.

- Datele rămân în browserul și la originea în care au fost scrise. Nu există sincronizare între dispozitive, browsere sau utilizatori.
- Păstrarea datelor nu este garantată. Browserul le poate șterge la curățarea spațiului, în modul privat sau când cota de stocare este depășită.
- Nu stoca parole, tokenuri, date personale sau date medicale în localStorage.
