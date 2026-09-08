# AI Home Backend

Simple Express, Prisma, PostgreSQL backend for the AI Home Transformation app.

## Setup

1. Copy `.env.example` to `.env` and fill in the provider credentials.
2. Install dependencies: `npm install`
3. Generate Prisma Client: `npm run prisma:generate`
4. Run the first migration: `npm run prisma:migrate`
5. Start the API: `npm run dev`

Health check: `GET http://localhost:5000/api/health`
