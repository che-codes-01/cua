// ─── Configuration ────────────────────────────────────────────────────────────
// All values can be overridden via environment variables.
import dotenv from 'dotenv';
dotenv.config();   // load .env before anything reads process.env

export const config = {
  port:         parseInt(process.env.PORT         || '3000'),
  jwtSecret:    process.env.JWT_SECRET             || 'dev-secret-change-in-prod',
  adminKey:     process.env.ADMIN_KEY              || 'admin-super-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN         || '8h',
  seedDemoData: process.env.SEED_DEMO_DATA         === 'true',
};
