# CampusClaim — Campus Lost & Found
Built for **TechVexa**, using the assigned **Angular + Node/Express + SQLite** stack.

## The idea
A campus-wide board to post lost and found items, search by keyword/location/category, discover opposite-type matches, and submit ownership evidence. Use a staffed campus help desk for verification and safe handover.

## Run locally
Requires Node.js 24 and npm.
```sh
npm ci
npm run build
npm run server
```
Open http://localhost:3000. The SQLite database is created automatically in server/data. Start by posting an item (the server starts with an empty real board).

For UI development: `npm start`. This mode uses demo browser storage unless the API is served on the same origin.

## Demo vs full stack
The GitHub Pages deployment is a **frontend demo**, with six illustrative sample items, localStorage posts and claims, and category-based match suggestions. It does NOT synchronize between devices or send email. Sample dates are set when the page loads. The Express deployment automatically switches the same Angular app to a shared SQLite API.

## Deploy the full stack
Build the supplied Dockerfile and run it on a container host supporting persistent volumes. Mount a persistent writable volume at /data. Expose port 3000 (or set PORT). Example:
```sh
docker build -t campusclaim .
docker run -p 3000:3000 -v campusclaim-data:/data campusclaim
```
Do not deploy the SQLite database to an ephemeral serverless filesystem. No paid service is provisioned by this repository.

## API
- GET /api/health
- GET /api/items — public items only
- POST /api/items — validated item fields
- POST /api/claims — private evidence stored in SQLite, not returned by public API

## Test
`npm test` runs a temporary in-memory SQLite integration test for item creation, claims, private route exclusion and invalid fields. `npm run build` checks Angular compilation. CI tests before Pages deployment.

## Architecture
Angular standalone UI → Express REST API → parameterized SQLite queries. Static assets served by Express for the full-stack deployment. No API credentials required.

## Hackathon pitch (45 seconds)
Every campus has lost water bottles, keys and headphones — but the information is scattered across group chats. CampusClaim creates one searchable board. A student reports an item, finds a likely match, and submits a private identifying detail. A safe campus handover closes the loop. Our assigned stack is Angular, Express and SQLite: simple, low-cost and easy for one campus to operate.

## Important limitations / production roadmap
This is a hackathon MVP, not a production identity system. No login, student verification, admin review dashboard, automated email, image upload, or claim approval workflow is implemented. Claims are recorded but require authorized operator follow-up; do not collect real personal information until authentication, authorization, moderation, retention/deletion rules, HTTPS and campus consent are in place. The localStorage demo is device-local and should use fictional contact details. Match suggestions are category-based, not AI. Rate limiting is basic and single-process. Never publish unique ownership proof in the public item description.
