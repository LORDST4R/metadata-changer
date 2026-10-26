# Stardom — Uniquify Media

**Strip tracking data • Kill C2PA & AI signatures • Inject unique realistic metadata**

100% private. Runs entirely in the browser. Your media never leaves your device.

## Features

- **Uniquify** — the core process (remove old metadata + optionally add unique new metadata)
- **Media Library** — keeps a history of what you’ve uniquified, stored locally
- **Photos vs Videos** — clearly separated with badges and filters
- **Filter by day** — Today, Yesterday, Last 7 days, Last 30 days
- Two modes:
  - Uniquify + Realistic Metadata (looks like a real camera photo)
  - Pure Uniquify (zero metadata)
- Mobile-friendly dark design
- Ready for your domain (`rewardnest.us` or any other)

## Deploy to Vercel + Custom Domain

1. Create a GitHub repository
2. Upload all files from this folder
3. Import the repo in [Vercel](https://vercel.com)
4. Deploy
5. In Vercel → Settings → Domains → add your domain
6. Update DNS at your registrar as Vercel instructs

## Local test

Open `index.html` or run:

```bash
npx serve .
```

## Notes

- Photos: full Uniquify support (deep clean + unique EXIF)
- Videos: currently added to library; deeper video metadata rewriting can be upgraded later with ffmpeg.wasm
- Library is stored in the browser (localStorage). Clearing site data will clear the library.
