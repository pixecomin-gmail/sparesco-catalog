# Product Studio — isolated local application

Run in PowerShell:

```powershell
cd products-studio
npm ci
npm run dev -- -p 3001
```

Open http://localhost:3001 (redirects to /new/admin/products).

V2 local JSON data was not included in your upload. This app uses `.sparesco-v2-local/` within its own folder.

**Not deployable to Cloudflare Pages yet:** APIs use Node fs and runtime=nodejs, and store.ts disables production access. The other two apps are unchanged.
