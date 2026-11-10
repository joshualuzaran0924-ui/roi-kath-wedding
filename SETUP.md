# Roi & Kathlyn Wedding Website — Free Deployment Guide

This is a React + Vite wedding invitation starter with:
- Click-to-open envelope introduction
- Wedding countdown and sections
- Photo gallery
- Google Maps direction links
- RSVP form
- Admin login and content editor
- RSVP response dashboard and CSV export
- Supabase database and photo storage integration

## 1. Run it locally (optional)

Install Node.js LTS from https://nodejs.org.

Open this project folder in a terminal and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## 2. Create a free Supabase project

1. Sign up at https://supabase.com.
2. Create a new project.
3. Open SQL Editor in your Supabase project.
4. Open `supabase.sql` from this project, copy all its contents, paste into SQL Editor, and run it.
5. Go to Project Settings > API.
6. Copy the Project URL and the publishable/anon key (never use the service_role key in the website).

## 3. Configure local environment

1. Make a copy of `.env.example` and name it `.env`.
2. Fill in your Supabase URL and publishable/anon key:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

3. Restart `npm run dev` if it is already running.

## 4. Create the two admin accounts

1. In Supabase, open Authentication > Users.
2. Add the email accounts you and Kathlyn will use.
3. Set a strong password for each account.
4. In Authentication > URL Configuration, add your deployed Netlify URL to Site URL and Redirect URLs after deployment.
5. Only share these admin credentials with the two administrators.

The SQL starter policies restrict content editing, photo uploads, and RSVP viewing to users explicitly listed in `public.admin_users`.

After creating the two auth users:
1. In Supabase > Authentication > Users, copy each user's UUID.
2. In SQL Editor, run this statement with the real UUIDs:

```sql
insert into public.admin_users (user_id)
values
  ('PASTE_ROI_USER_UUID'),
  ('PASTE_KATHLYN_USER_UUID');
```

Use the exact UUIDs, without the placeholder text. Also disable public user sign-ups in Authentication settings if you do not need new accounts. Do not share the Supabase service-role key.

## 5. Deploy free on Netlify

### Easiest: deploy with GitHub
1. Create a free GitHub account: https://github.com.
2. Create a new repository and upload this project folder (all files, including `src`, `package.json`, `netlify.toml`, and `supabase.sql`).
3. Create a free Netlify account: https://app.netlify.com.
4. Choose **Add new project** > **Import an existing project** > **GitHub**.
5. Select your repository.
6. Build command: `npm run build`
7. Publish directory: `dist`
8. Before deploying, open Site configuration > Environment variables and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
9. Deploy the site.

Netlify reads `netlify.toml` automatically. Every push to your connected GitHub repository triggers a new deployment.

### Alternative: manual deploy
Manual drag-and-drop requires a built `dist` folder. Run `npm install` and `npm run build` on a computer first, then drag the `dist` folder into Netlify's deploy area. A phone alone generally cannot run the build process conveniently.

## 6. Add your wedding details

1. Visit your deployed site and click **Administrator** at the bottom.
2. Sign in using an admin account.
3. Edit ceremony and reception names, addresses, times, story, entourage, dress code, and photos.
4. Click **Save and publish changes**.

The Google Maps buttons automatically search the addresses you enter.

## Important notes before sharing with guests

- If Supabase is not configured, the site runs in demo mode. RSVP entries and edits are stored only in that browser and will not be shared with you or other devices.
- For real guest RSVP storage and shared admin editing, configure Supabase first.
- Uploaded photos in connected mode go to the `wedding-photos` Supabase Storage bucket.
- Use optimized JPG/WebP images. The starter upload limit is 5 MB per photo.
- Background music only works with a direct audio file URL that you have permission to use. Browsers may require visitors to press play.
- This starter includes the functional core and an admin content editor. It does not yet include drag-and-drop page layout editing or a guest-specific invitation list.
- Netlify's free plan and Supabase's free plan have usage limits and can change. Check their current pricing pages before launch.

## Upgrade note: templates and guestbook

This upgraded version adds three switchable invitation designs (Botanical Romance, Classic Elegance, and Modern Editorial), an updating design preview in the admin editor, an editable wedding-day note, and a guestbook with administrator approval.

- If this is a **new Supabase setup**, run the updated `supabase.sql` once.
- If you **already ran the previous `supabase.sql`**, run `supabase-guestbook-migration.sql` once in Supabase SQL Editor. Do not rerun the original schema script just to add the guestbook.
- Existing invitation content and RSVP records are retained. The new template and schedule fields use safe defaults when loading older saved content.
- Guestbook entries submitted to Supabase remain hidden until an allowlisted administrator approves them in `/admin`.

The admin preview is a live design/content preview of the invitation cover. It is not a full drag-and-drop page builder; this is a lightweight, free-hosting-friendly editor.
