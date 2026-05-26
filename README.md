# Ezquerdev — Patrick's Cold Cuts (Customer Mobile App)

React Native customer app for **Patrick's Cold Cuts**. It consumes the Symfony Customer API (`/api/customer/*`) on the shared backend in `PatricksColdCut`.

## Features

- **Guest browse** — shop without signing in
- **Sign in / register** — JWT (`POST /api/login`) or Google OAuth (with setup below)
- **Shop** — products, search, categories, favorites
- **Cart & checkout** — delivery date/address, place order
- **Orders** — list, detail, pay (GCash, card, cash, bank transfer)
- **Account** — profile, edit, log out

## Prerequisites

- Node.js 22+
- Android Studio + emulator (or physical Android device)
- **PatricksColdCut** backend — local (`start_server.bat`) or [Railway](https://railway.com/project/26c2459c-7304-43d3-af80-8cfbad07a54f) deploy ([GitHub jean](https://github.com/JinEzquer/jean))
- `adb` on PATH

## API target (local vs Railway)

Edit **`src/config/apiTarget.ts`**:

| `API_TARGET` | Behavior |
|--------------|----------|
| `railway` | Use production API only (same DB as web admin on Railway) |
| `local` | Use `start_server.bat` on your PC |
| `auto` | Try Railway first, then local |

Default production URL:

`https://jean-production-dad4.up.railway.app`

Products you add in **Railway admin** appear in the app when `API_TARGET` is `railway`. No extra sync step.

Optional override: copy `src/config/apiTarget.local.example.ts` → `apiTarget.local.ts` (gitignored).

**Google sign-in on Railway:** add this redirect URI in [Google Cloud Console](https://console.cloud.google.com/):

`https://jean-production-dad4.up.railway.app/connect/google/check`

## Quick start

### Option A — Railway API (no local PHP server)

```bat
cd Ezquerdev
npm run dev
```

Keep Metro running; the app talks to Railway over HTTPS.

### Option B — Local API (development)

```bat
REM 1. Backend (PatricksColdCut folder)
start_server.bat

REM 2. Set API_TARGET to "local" in src/config/apiTarget.ts

REM 3. Mobile
cd Ezquerdev
npm run dev
```

Or two terminals:

```bat
npm run start:clean
npm run android
```

**Do not** use `npx react-native run-android` alone — it skips `adb reverse` and the app stays **black**.

`npm run android` / `npm run dev` forward **8081** (Metro) and **8000** (API + **Google OAuth**).

Admin in Chrome (same time): `http://127.0.0.1:8000/admin`

### Black / blank emulator screen

```bat
npm run fix:blank
npm run dev
```

Or:

```bat
npm run metro:stop
npm run start:clean
npm run android
```

Emulator: **Ctrl+M** → **Reload**. The app loads JS from **localhost:8081** (via `adb reverse`), not `10.0.2.2`.

## Google sign-in on emulator

Google **blocks** `http://10.0.2.2:8000` (private IP error).

**Before Google sign-in, run:**

```bat
npm run fix:emulator-network
```

**Google Cloud Console** → Authorized redirect URI (only this one needed for mobile):

```text
http://127.0.0.1:8000/connect/google/check
```

Full guide: `../PatricksColdCut/docs/GOOGLE-OAUTH-MOBILE.md`

**For grading demos:** use **email + password** — always works. Google is optional extra credit.

## Presenting to instructor

- **`../PatricksColdCut/docs/FINAL_PROJECT_INSTRUCTOR_GUIDE.md`** — 10-minute demo script  
- **`../PatricksColdCut/docs/RUBRIC_CHECKLIST.md`** — criteria ↔ evidence  

## API

`src/app/api/customer.ts` — products, profile, orders, payments.

## Docs (backend)

| File | Purpose |
|------|---------|
| `FINAL_PROJECT_INSTRUCTOR_GUIDE.md` | Grading demo script |
| `GOOGLE-OAUTH-MOBILE.md` | Google OAuth on emulator |
| `PROJECT_SETUP.md` | Full stack setup |
| `CUSTOMER_API.md` | REST reference |
| `JWT-HOW-IT-WORKS.md` | Auth for demo |
