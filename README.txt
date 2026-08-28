SHAHMAHMUDPUR BAZAR
======================
এই ZIP-এর সব ফাইল GitHub repository-এর ROOT directory-তে রাখবেন।
কোনো folder দরকার নেই।

এটি একটি fully client-side starter marketplace:
- Homepage
- Search/filter
- Categories
- Registration/login
- Post ad
- My ads
- Favourite
- Ad details
- Messages demo
- Hijama appointment demo
- Admin moderation demo
- Static information pages

ডেটা browser localStorage-এ থাকে। অর্থাৎ GitHub Pages-এ upload করলেই demo/working frontend চলবে।

PRODUCTION NOTE:
Real multi-user deployment-এর জন্য Supabase database/auth/storage এবং server-side/RLS security যুক্ত করতে হবে। বর্তমান demo-তে password localStorage-এ রাখা হয়, তাই এটিকে production authentication হিসেবে ব্যবহার করবেন না।
