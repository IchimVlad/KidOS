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
- `npm run db:generate` — generează Prisma Client
- `npm run db:migrate:dev -- --name init` — creează și aplică prima migrare
- `npm run db:migrate:deploy` — aplică migrările existente
- `npm run db:studio` — deschide Prisma Studio

## Conexiune la Neon

Adaugă `DATABASE_URL` și `DATABASE_URL_UNPOOLED` în `.env` (fișierul este ignorat de Git). Aplicația folosește `DATABASE_URL`, adresa pooled, pentru interogările runtime. Prisma folosește `DATABASE_URL_UNPOOLED`, conexiunea directă, pentru migrări și unelte de dezvoltare.

Schema bazei de date este în `prisma/schema.prisma`. Adaugă modele Prisma acolo, apoi rulează `npm run db:migrate:dev -- --name nume_migrare` pentru a genera și aplica o migrare. Clientul se generează automat la instalare; pentru regenerare fără migrare, folosește `npm run db:generate`.

MVP-ul nu include conturi sau autentificare. Un `ProfileSpace` conține profilurile afișate în selector, iar fiecare persoană — copil, adult sau vârstnic — este un `PatientProfile`. `ProfileRelationship` indică profilul care gestionează profilul pacientului (`PARENT`, `LEGAL_GUARDIAN`, `CAREGIVER`, `FAMILY_MEMBER` sau `OTHER`). Relația este direcțională: `managerProfileId` gestionează `patientProfileId`. Triajul, istoricul și consultațiile aparțin profilului pacientului; `startedByProfileId`, `recordedByProfileId` și `requestedByProfileId` păstrează proveniența unde e cazul.

Relațiile și selectorul de profil sunt doar structură funcțională pentru demonstrație, nu autentificare sau control de acces. Extensiile ulterioare pot adăuga conturi și permisiuni reale, clinici și programări, consimțăminte, plăți și rapoarte medicale. Până atunci, folosiți numai date fictive, nu informații medicale reale.

Înainte de prima migrare, verifică dacă ramura Neon conține deja tabele sau date. Dacă da, schema trebuie întâi introspectată și migrările Prisma inițializate fără a recrea acele tabele. Schema MVP nu a fost aplicată la Neon.

Pornește aplicația cu `pnpm dev` și deschide `http://localhost:3000/api/db-test` pentru a testa Prisma cu `SELECT now()`. Un răspuns `{ "ok": true, "databaseTime": "..." }` confirmă conexiunea.

## localStorage

Persistența temporară este în browser, prin `src/lib/storage.ts`. Valorile sunt JSON, cheile primesc prefixul `KidOS.`, iar datele citite se validează cu Zod.

- Datele rămân în browserul și la originea în care au fost scrise. Nu există sincronizare între dispozitive, browsere sau utilizatori.
- Păstrarea datelor nu este garantată. Browserul le poate șterge la curățarea spațiului, în modul privat sau când cota de stocare este depășită.
- Nu stoca parole, tokenuri, date personale sau date medicale în localStorage.
