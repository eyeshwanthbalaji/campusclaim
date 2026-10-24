# CampusClaim — Campus Lost & Found Platform

**A centralized, searchable platform for recovering lost belongings on campus.**

Built for **TechVexa** using the assigned technology stack: **Angular, Node.js, Express.js, and SQLite**.

---

## 1. About the Project

CampusClaim is a campus-wide lost-and-found platform that helps students and campus staff report, search for, and recover lost belongings. Instead of relying on scattered WhatsApp groups, notices, and word of mouth, CampusClaim brings lost and found reports together in one organized system.

Users can publish lost or found item reports, search by keywords and location, explore potential matches, and submit private ownership evidence. A designated campus help desk can then support verification and safe handover.

## 2. Key Features

- **Lost and Found Reports:** Create reports for missing belongings and items that have been found.
- **Smart Search:** Search reports using keywords, locations, and categories.
- **Potential Match Suggestions:** Discover possible matches between lost and found items using category-based matching.
- **Private Ownership Claims:** Submit identifying evidence to help establish ownership.
- **Shared Database:** Store reports and claims in SQLite when using the full-stack deployment.
- **Responsive Interface:** Access the application through a browser on supported desktop and mobile devices.
- **Simple Deployment:** Run locally or deploy the application using Docker with persistent storage.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Angular |
| Backend | Node.js and Express.js |
| Database | SQLite |
| API | REST API |
| Deployment | Docker |
| Testing | Automated integration tests |

## 4. How It Works

1. A student reports a lost item or an item they have found.
2. Other users search the board using relevant keywords, categories, or locations.
3. The platform suggests potential matches based on item categories.
4. A person claiming an item submits private identifying evidence.
5. An authorized campus operator follows up to verify the claim.
6. The item is handed over safely through an appropriate campus help desk or designated process.

**Important:** Potential matches are suggestions, not proof of ownership. Unique identifying details should remain private.

## 5. Getting Started

### Prerequisites

Install the following software before running the application:

- Node.js 24
- npm
- Git (optional, for cloning the repository)

### Installation

Clone the repository and navigate to the project directory:

```bash
git clone <your-repository-url>
cd CampusClaim
```

Install the project dependencies:

```bash
npm ci
```

Build the Angular application:

```bash
npm run build
```

Start the full-stack Express server:

```bash
npm run server
```

Open the application in your browser:

**http://localhost:3000**

The SQLite database is initialized automatically. The live board starts empty, allowing users to create their own reports.

> Replace `<your-repository-url>` with the actual GitHub repository URL.

### Frontend Development

To run the Angular development server, use:

```bash
npm start
```

In development mode, the application may use browser localStorage for demonstration data unless the API is configured to run on the same origin. Browser-stored data is local to that browser and device.

## 6. Demo Version vs. Full-Stack Version

| Feature | GitHub Pages Demo | Full-Stack Deployment |
|---|---|---|
| Sample items | Six illustrative items | Starts with an empty board |
| Create reports | Browser localStorage | Shared SQLite database |
| Submit claims | Browser localStorage | SQLite database |
| Cross-device synchronization | No | Yes, through the shared API and database |
| Match suggestions | Category-based | Depends on the implemented matching functionality |
| Email notifications | Not implemented | Not implemented |
| User authentication | Not implemented | Not implemented |

The GitHub Pages version is intended for demonstrations. The Express deployment provides shared persistence through SQLite.

## 7. API Endpoints

The backend exposes the following REST API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check server health |
| GET | `/api/items` | Retrieve public item reports |
| POST | `/api/items` | Create an item report after validation |
| POST | `/api/claims` | Submit ownership evidence for private storage |

### API Notes

- Public item responses must not expose private ownership evidence.
- Item creation accepts validated fields.
- Ownership claims are stored privately and are not returned by the public items API.
- API validation and privacy controls should be strengthened before real-world deployment.

## 8. Project Architecture

The application follows a simple three-layer architecture:

```text
        Student / Campus User
                 |
                 v
       Angular Frontend
                 |
                 v
        Express REST API
                 |
                 v
          SQLite Database
```

**Frontend:** Provides the interface for creating reports, searching items, viewing possible matches, and submitting claims.

**Backend:** Handles API requests, validates input, and manages database operations.

**Database:** Stores item reports and private claim evidence using SQLite.

**Deployment:** Express serves the built Angular application and API from the same origin in the full-stack deployment.

## 9. Running Tests

Run the automated tests:

```bash
npm test
```

The integration tests use a temporary in-memory SQLite database to verify:

- Item creation.
- Ownership claim submission.
- Exclusion of private claim information from public routes.
- Rejection of invalid item fields.

Verify that the Angular application builds successfully:

```bash
npm run build
```

## 10. Docker Deployment

CampusClaim can be deployed to a container host that supports persistent writable storage.

Build the Docker image:

```bash
docker build -t campusclaim .
```

Run the application with persistent storage:

```bash
docker run -p 3000:3000 \
  -v campusclaim-data:/data \
  campusclaim
```

Open `http://localhost:3000`.

The `/data` directory must be writable and persistent so the SQLite database survives container replacement or restart. The application can use port `3000` by default or a configured `PORT` value.

**Deployment note:** Avoid storing the SQLite database on an ephemeral filesystem. This repository does not provision a paid hosting service.

## 11. Security and Privacy Considerations

CampusClaim is a hackathon MVP and is not yet a production-ready identity or verification system.

Before using real student information, implement:

- Secure authentication and student verification.
- Role-based authorization for campus operators.
- A claim review and approval workflow.
- Input sanitization, stronger validation, and rate limiting.
- HTTPS and secure deployment configuration.
- Moderation, data retention, and deletion policies.
- Campus approval and user consent procedures.

Never publish unique ownership evidence, private contact information, or sensitive item-identification details in public reports.

Until authentication and privacy controls are implemented, use fictional contact details and demonstration data.

## 12. Current Limitations

The current implementation does not include:

- Student login or identity verification.
- An administrative review dashboard.
- Automated email or push notifications.
- Image uploads.
- An implemented claim approval workflow.
- AI-powered matching.
- Production-grade abuse prevention.

Match suggestions are category-based and should not be described as AI-powered.

## 13. Future Enhancements

Potential improvements include:

1. **Student Authentication:** Enable verified campus accounts.
2. **Image Uploads:** Allow users to attach photographs of found items.
3. **Advanced Matching:** Compare item descriptions, dates, locations, and visual features.
4. **Admin Dashboard:** Enable authorized staff to review claims and manage reports.
5. **Notifications:** Notify users about relevant matches and claim updates.
6. **Status Tracking:** Track reports through open, matched, claimed, and resolved states.
7. **Analytics:** Identify common loss locations and frequently reported item categories.
8. **Data Management:** Introduce configurable retention and deletion policies.

These are proposed enhancements, not features currently implemented.

## 14. Hackathon Pitch

Every campus has students losing water bottles, ID cards, keys, and headphones. Yet information about these items is often scattered across group chats and notice boards.

**CampusClaim brings the campus lost-and-found process into one searchable platform.** Students can report missing or found belongings, discover potential matches, and submit private ownership evidence. A campus help desk can then support verification and safe handover.

Built with Angular, Express.js, and SQLite, CampusClaim provides a straightforward, low-cost foundation that can be expanded for individual campuses.

## 15. License

Add an appropriate open-source license before distributing the project publicly. Until a license is selected, all rights remain with the applicable copyright holder.

---

**CampusClaim — Report it. Find it. Return it.**


## 16. Vercel + shared Turso database

The Vercel deployment serves Angular and the Node serverless API in `api/index.js`. It uses Turso hosted SQLite via SQL-over-HTTPS rather than a local filesystem. The original Express backend remains in `server/index.cjs` for local/Docker use.

- Configure sensitive server-only `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` using the Vercel Turso integration. Never prefix these with public frontend variables or commit their values.
- `vercel.json` builds Angular into `dist/campusclaim/browser` and routes `/api/*` to the backend before the frontend fallback.
- `GET /api/health` returns `{ok:true,database:"turso",shared:true}` only after a real database query succeeds.
- Map pins, reports and claims are shared through the hosted database. Local demo data is not automatically uploaded. The hosted database starts empty.
- Free Starter database provisioning was selected; stay within provider quotas and review plan settings before upgrades.
- Interactive Leaflet map uses OpenStreetMap tiles; public pins can disclose location. Use fictional reports and contact details until campus authorization, login, moderation and retention/deletion controls exist.
- Rate limiting is best-effort per serverless instance, not a distributed abuse-control system.
- Run `node --test server/api.test.cjs server/vercel.test.cjs` and `npm run build` before deployment.
