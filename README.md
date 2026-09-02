# Nadlan Platform

A bilingual (English / Hebrew, full RTL) international real-estate platform: a public
marketplace for new-build and resale properties, role-based dashboards for agents,
contractors and admins, and **Nadlanometer** — a property assistant that matches buyers
with listings from the live inventory.

> **Status: portfolio / demo project.** It was built as a full product exercise — schema,
> server layer, dashboards and design system — and is not operated as a live service.
> Everything runs locally against your own Postgres with seeded demo data.

---

## Highlights

| Area                         | What it does                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Marketplace**              | Search and filter listings by city, category, deal type, price, rooms and area; property pages with gallery, project context, similar listings and a lead form.                                                             |
| **Nadlanometer assistant**   | Conversational property matching over the real inventory, answering in the language the visitor writes in and returning ranked recommendation cards. Works with or without an AI API key (see [AI features](#ai-features)). |
| **Agent / seller dashboard** | Pipeline of leads with stages, activity log, follow-ups and heat; viewings calendar; deals, payment schedules and commissions; publishing new listings.                                                                     |
| **Contractor inventory**     | Projects and units, reservations, price history, and a smart import that turns a price list into structured inventory changes (new / price change / sold).                                                                  |
| **Admin portal**             | Organisations, partner applications, user management, listing moderation and two-stage payment approvals.                                                                                                                   |
| **Chat**                     | Conversations between clients, agents and contractors, with per-participant read state and entity-linked messages.                                                                                                          |
| **Bilingual by design**      | Every string is `Localized` (`he` / `en`); direction, fonts and layout flip with the locale, and the choice is remembered in a cookie so SSR renders the right side up.                                                     |

## Tech stack

- **React Router v8** (framework mode, SSR) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a small in-house design system (`app/components/ui`)
- **Prisma 7** + **PostgreSQL** (works with any Postgres — local, Supabase, Neon)
- **Motion** for transitions, **Swiper** for galleries, **Lucide** for icons
- **Anthropic SDK** — optional, for the AI assistant and smart import
- **Docker** multi-stage build for deployment

## Getting started

**Prerequisites:** Node.js 22.22+ (or 24) and a PostgreSQL database.

```bash
git clone https://github.com/Idansrur13/nadlan-platform.git
cd nadlan-platform
npm install

cp .env.example .env        # then set DATABASE_URL / DIRECT_URL
npm run db:migrate          # create the schema
npm run db:seed             # load the demo inventory, leads, deals and chats

npm run dev                 # http://localhost:5173
```

The seed data comes from `app/data/` — projects in Tel Aviv, Larnaca and Miami, plus
users, leads, viewings, deals and conversations, so every dashboard has something to show.

### Scripts

| Script               | Purpose                     |
| -------------------- | --------------------------- |
| `npm run dev`        | Development server with HMR |
| `npm run build`      | Production build            |
| `npm start`          | Serve the production build  |
| `npm run typecheck`  | Route typegen + `tsc`       |
| `npm run format`     | Prettier over the repo      |
| `npm run db:migrate` | Apply Prisma migrations     |
| `npm run db:seed`    | Reseed demo data            |
| `npm run db:studio`  | Prisma Studio               |

## AI features

Both AI features are **optional and off by default** — the app never makes a paid API call
unless you configure a key.

| Feature                | With `ANTHROPIC_API_KEY`                                                                  | Without a key                                                                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nadlanometer assistant | Claude reads the live inventory and answers conversationally with ranked recommendations. | A built-in matching engine (`app/assistant/local-engine.ts`) parses budget, city, rooms, size, deal type, category and amenities from the message, scores the inventory and answers in the language the visitor used. The UI marks these answers as demo mode. |
| Smart import           | Any price list — PDF, DOCX, image, CSV — is turned into structured inventory changes.     | CSV / TSV / JSON price lists are parsed locally (`app/server/import-local.server.ts`), with Hebrew and English column headers. Try `docs/samples/price-list.csv`.                                                                                              |

In both paths the classification of each unit (new / price change / sold) is computed
deterministically against the database — the model is never trusted with that decision.

To enable the AI path, add to `.env`:

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

## Project structure

```
app/
├── routes/           public pages + dashboards (seller, contractor, admin)
├── server/           data access: Prisma queries, mappers, import, AI
├── assistant/        Nadlanometer — prompt, schema and offline matching engine
├── components/       design system (ui/) and shared blocks
├── data/             demo/seed data and domain metadata
├── types/            the domain model
├── i18n/             dictionary, locale provider, language switcher
└── listings/         marketplace list and cards
prisma/               schema, migrations and seed script
docs/                 functional spec and work plan (Hebrew), sample imports
```

Routes never talk to Prisma directly: pages call the functions in `app/server/`, which map
database rows to the domain types in `app/types/`. That keeps the UI free of persistence
details and made the migration from in-memory data to Postgres a single-layer change.

## Docker

```bash
docker build -t nadlan-platform .
docker run -p 3000:3000 --env-file .env nadlan-platform
```

## Documentation

- [`docs/spec.md`](docs/spec.md) — functional specification (Hebrew)
- [`docs/tasks.md`](docs/tasks.md) — work plan (Hebrew)

## License

[MIT](LICENSE) © Idan Srur
