# Sumadhwa Swaradhuri Setup Guide

## Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in SQL Editor (in order):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_invites.sql`
3. Create storage bucket: Storage → New bucket → Name: `recordings`, Private: Yes
4. Copy project URL and keys to `.env.local`

## Clerk

1. Create an application at [clerk.com](https://clerk.com)
2. Set your admin account: Users → select user → Public metadata: `{ "role": "teacher_admin" }`
3. Teachers invite students by email. Students get access when they sign up.
4. Teacher admins can invite new teachers from the dashboard.
5. Copy keys to `.env.local`

## Environment Variables

See `.env.example` for required variables.
