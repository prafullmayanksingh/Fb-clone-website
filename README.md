# Community

A responsive social-networking application with an explicit browser demo mode and an optional Supabase-backed, multi-user mode.

## Run the demo

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app clearly labels itself as a local demo. Demo state stays in that browser and is not shared with other users.

## Enable real accounts and shared data

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and the publishable (or legacy `anon`) key. Do not use a `service_role` or secret key in this frontend.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run the SQL migrations in `supabase/migrations/` in filename order in the Supabase SQL Editor.
5. In Supabase Auth, enable email sign-up and configure the site URL and redirect allowlist for both local development and the deployed site. Configure SMTP for production verification and recovery emails.
6. To enable Google sign-in, configure the Google OAuth provider in Supabase and add its client credentials there.
7. Restart Vite. Authenticated users now share the Supabase feed and can use cloud posts/media, polls, reactions, comments, friend requests, follows, private conversations, and live notifications.

Supabase Auth handles password hashing, JWT/session rotation, email verification, and password recovery. Row-level security policies in the migration enforce data access; the browser never receives an administrative key.

## Deploy to Netlify

The repository includes `netlify.toml` for Vite production builds and client-side routing.

1. Connect this repository to a Netlify site, or authenticate with the Netlify CLI and run `npx netlify-cli deploy --prod --dir=dist`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Netlify environment variables for the deploy context.
3. Deploy/redeploy after setting environment variables; Vite embeds these public settings at build time.
4. Add the Netlify site URL to Supabase Auth's site URL and redirect allowlist.

Build locally with `npm run build`; preview with `npm run preview`. The service worker caches only the app shell/static assets and does not cache Supabase API responses.

## Implemented

- Email sign-up/sign-in, Supabase email verification, password recovery/reset, Google OAuth hook, and sign-out
- Profile editing and public/friends/private profile visibility
- Shared, realtime feed; compressed multi-image uploads; text and poll posts with single-vote results; post deletion; six reactions; comments
- Friend requests, accept/reject/cancel/unfriend, following, private group join requests with owner approval, page follower/post/reaction/comment analytics, private one-to-one conversations, text/media/file and recorded voice messages, conversation read receipts, typing indicators, chat presence, realtime notifications
- Supabase/Postgres schema and RLS policies for profiles, feed, polls, comments, reactions, stories, groups, pages, conversations, notifications, and reports
- Responsive UI, dark mode, and installable/offline app shell (PWA)

## Demo-only or requires additional services/UI

The marketplace, curated groups, and Watch previews remain demo content. Group administration beyond private join approvals, page controls beyond basic engagement metrics, stories viewer/management screens, report triage, platform-wide analytics, and marketplace transactions still need work. Video/GIF post types and WebRTC calling are not implemented. AI features need separate provider services and credentials. Do not treat this portfolio project as a production Facebook replacement without further security review, abuse controls, operational monitoring, backups, and privacy/compliance work.
