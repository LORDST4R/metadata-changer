# Metadata Changer Pro

**Deep clean images • Kill C2PA & AI signatures • Make AI images look normal**

100% client-side. Your images never leave your device.

## Features

- **Two modes**:
  - Clean + Inject Unique Realistic Metadata (looks like a real iPhone/Canon/Sony photo)
  - Pure Clean (zero metadata)
- Strong removal of most C2PA / AI authenticity markers via canvas re-encode
- Unique metadata generated on every download
- Mobile-friendly
- Batch support
- Works completely offline after first load

## Live Domain

Point your domain **rewardnest.us** to this Vercel project after deployment.

## Deploy to Vercel (Recommended)

1. Create a new GitHub repository
2. Upload all files from this folder
3. Go to [vercel.com](https://vercel.com) → New Project → Import the repo
4. Deploy (no build settings needed — it's static)
5. In Vercel project settings → Domains → add `rewardnest.us` and `www.rewardnest.us`
6. In your domain registrar, point the DNS to Vercel (they show you the exact records)

Done. Your tool will be live on your domain and work great on mobile.

## Local Test

Just open `index.html` in a browser, or:

```bash
npx serve .
```

## Tech

- Pure HTML + CSS + JavaScript
- Canvas re-encoding for deep metadata/C2PA removal
- piexifjs for writing realistic EXIF
- No backend, no tracking, no uploads
