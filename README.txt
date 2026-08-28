SHAHMAHMUDPUR BAZAR — AUTH FIXED MASTER
========================================
Upload all files directly to GitHub repository ROOT. No folder is required.

FIX:
- Registration uses Supabase Auth.
- Login uses Supabase Auth.
- Password confirmation uses non-conflicting element IDs.
- User metadata (name + phone) is sent to Supabase.
- The SQL trigger creates public.profiles automatically.
- Access tokens are stored locally for this client-side GitHub Pages build.

IMPORTANT:
Do not publish or use a Supabase service-role key in the browser.
The included key is the public anon key.

After uploading:
1. Open Register.
2. Create a new account.
3. If Supabase requires email confirmation, confirm the email first.
4. Login.
