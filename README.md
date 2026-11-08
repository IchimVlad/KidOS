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
- `npm run db:seed` — adaugă date demo fictive în baza de date
- `npm run db:migrate:dev -- --name init` — creează și aplică prima migrare
- `npm run db:migrate:deploy` — aplică migrările existente
- `npm run db:studio` — deschide Prisma Studio

## Conexiune la Neon

Adaugă `DATABASE_URL` și `DATABASE_URL_UNPOOLED` în `.env` (fișierul este ignorat de Git). Aplicația folosește `DATABASE_URL`, adresa pooled, pentru interogările runtime. Prisma folosește `DATABASE_URL_UNPOOLED`, conexiunea directă, pentru migrări și unelte de dezvoltare.

Schema bazei de date este în `prisma/schema.prisma`. Adaugă modele Prisma acolo, apoi rulează `npm run db:migrate:dev -- --name nume_migrare` pentru a genera și aplica o migrare. Clientul se generează automat la instalare; pentru regenerare fără migrare, folosește `npm run db:generate`.

Seed-ul adaugă date fictive în limba română, într-un context din Brașov, și folosește `DATABASE_URL_UNPOOLED`. Poate fi rulat din nou: actualizează aceleași înregistrări demo și nu șterge alte date. Înainte de rulare, verifică ce bază de date este configurată în `.env`.

MVP-ul nu include conturi sau autentificare. Un `ProfileSpace` conține profilurile afișate în selector, iar fiecare persoană — copil, adult sau vârstnic — este un `PatientProfile`. `ProfileRelationship` indică profilul care gestionează profilul pacientului (`PARENT`, `LEGAL_GUARDIAN`, `CAREGIVER`, `FAMILY_MEMBER` sau `OTHER`). Relația este direcțională: `managerProfileId` gestionează `patientProfileId`. Triajul, istoricul și consultațiile aparțin profilului pacientului; `startedByProfileId`, `recordedByProfileId` și `requestedByProfileId` păstrează proveniența unde e cazul.

Relațiile și selectorul de profil sunt doar structură funcțională pentru demonstrație, nu autentificare sau control de acces. Extensiile ulterioare pot adăuga conturi și permisiuni reale, clinici și programări, consimțăminte, plăți și rapoarte medicale. Până atunci, folosiți numai date fictive, nu informații medicale reale.

Înainte de prima migrare, verifică dacă ramura Neon conține deja tabele sau date. Dacă da, schema trebuie întâi introspectată și migrările Prisma inițializate fără a recrea acele tabele. Schema MVP nu a fost aplicată la Neon.

Extragerea opțională a alergiilor, afecțiunilor cronice și tratamentelor dintr-o consultație folosește Gemini 3.6 Flash prin Interactions API. Configurează `GEMINI_API_KEY` numai în mediul serverului. Procesarea începe doar după apăsarea butonului de extragere, iar utilizatorul trebuie să selecteze și să confirme fiecare propunere înainte ca aceasta să fie adăugată la profil. Chatul selectat este transmis către Google cu `store: false`, astfel încât interacțiunea să nu fie păstrată pentru istoricul API. Disponibilitatea și limitele gratuite depind de cont, model, regiune și condițiile curente ale Google. Consultați politicile Google privind datele înainte de a folosi informații medicale reale. MVP-ul nu are autentificare sau control de acces și este destinat exclusiv datelor fictive.

La confirmarea unor informații medicale noi, acestea sunt adăugate individual la profil și înregistrate ca eveniment în timeline-ul pacientului. Aplică migrările de bază de date înainte de pornire cu `npm run db:migrate:deploy`, după ce verifici că istoricul migrărilor din baza de date este reconciliat cu cel din repository.

Pornește aplicația cu `pnpm dev` și deschide `http://localhost:3000/api/db-test` pentru a testa Prisma cu `SELECT now()`. Un răspuns `{ "ok": true, "databaseTime": "..." }` confirmă conexiunea.

## Lakebase Postgres

Baza de date este pe Neon, branch-ul `production`. `neon env pull` scrie `DATABASE_URL` (conexiune pooled) în `.env.local`. Interogările pleacă din server, prin `src/lib/db.ts`, cu driverul `pg`. Verificarea conexiunii este `GET /api/db`.

## localStorage

Persistența temporară este în browser, prin `src/lib/storage.ts`. Valorile sunt JSON, cheile primesc prefixul `KidOS.`, iar datele citite se validează cu Zod.

- Datele rămân în browserul și la originea în care au fost scrise. Nu există sincronizare între dispozitive, browsere sau utilizatori.
- Păstrarea datelor nu este garantată. Browserul le poate șterge la curățarea spațiului, în modul privat sau când cota de stocare este depășită.
- Nu stoca parole, tokenuri, date personale sau date medicale în localStorage.
