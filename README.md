# Roi & Kath Wedding Website

A React + Vite wedding invitation website designed for free Netlify hosting, with optional Supabase-powered shared content, RSVP responses, photo storage, and a moderated guestbook.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Connect this repository to Netlify. Build command: `npm run build`. Publish directory: `dist`.

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables to enable shared content, administrator login, RSVP storage, photo uploads, and the guestbook. Never put a Supabase service-role key in the frontend.

See [SETUP.md](./SETUP.md) for the database and administrator setup steps.
