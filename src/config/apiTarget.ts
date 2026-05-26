/**
 * Where the mobile app loads data from.
 *
 * - railway — production (Railway deploy, same DB as admin on the web)
 * - local   — PatricksColdCut start_server.bat on your PC
 * - auto    — try Railway first, then local emulator
 */
export type ApiTarget = 'railway' | 'local' | 'auto';

/** Public URL from Railway → Networking (see PatricksColdCut/RAILWAY.md) */
export const RAILWAY_API_URL = 'https://jean-production-dad4.up.railway.app';

/** Change this one line to switch environments */
export const API_TARGET: ApiTarget = 'railway';
