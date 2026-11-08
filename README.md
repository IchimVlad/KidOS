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

## Lakebase Postgres

Baza de date este pe Neon, branch-ul `production`. `neon env pull` scrie `DATABASE_URL` (conexiune pooled) în `.env.local`. Interogările pleacă din server, prin `src/lib/db.ts`, cu driverul `pg`. Verificarea conexiunii este `GET /api/db`.

## localStorage

Persistența temporară este în browser, prin `src/lib/storage.ts`. Valorile sunt JSON, cheile primesc prefixul `KidOS.`, iar datele citite se validează cu Zod.

- Datele rămân în browserul și la originea în care au fost scrise. Nu există sincronizare între dispozitive, browsere sau utilizatori.
- Păstrarea datelor nu este garantată. Browserul le poate șterge la curățarea spațiului, în modul privat sau când cota de stocare este depășită.
- Nu stoca parole, tokenuri, date personale sau date medicale în localStorage.
