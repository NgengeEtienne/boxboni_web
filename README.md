# boxboni_web ("Waypoint")

Internal note: this is BoxBoni's field-recon tool for scouting new potential
collection-point locations, branded as **"Waypoint"** in the UI. Field agents
using it are not told it belongs to BoxBoni -- the BoxBoni name/logo must
never appear in anything this app renders. It does reuse BoxBoni's color
palette and typography (Poppins/Inter), just not the name.

Flow: a scout logs in (email + password, a `SCOUT`-type account in
`boxboni_backend`), sees a dashboard with their total places registered, and
registers a new place in two steps -- pick Region -> Division -> Subdivision
(cascading dropdowns, full Cameroon administrative data) and name the place,
then confirm their GPS position on a map (pin is draggable to correct for GPS
drift) and save. The backend stamps the submitting agent and timestamp
automatically. Submissions land in `warehouses.PlaceSubmission` -- a staging
table, not the live `Warehouse` table -- so promoting a scouted location to a
real operational warehouse is a deliberate admin step, not automatic.

## Local dev

Runs on **port 3001** (not 3000 -- that's `boxboni-admin`). Needs
`boxboni_backend` running on `:8000` with `http://localhost:3001` in its
`CORS_ALLOWED_ORIGINS` (already set in `.env.example`).

```bash
npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` in `.env.local` points at the backend API.

A test SCOUT account exists in dev: `scout@test.local` / `ScoutPass123!`
(create more via Django admin -- User type "Scout", set both phone and email).
