/*
 * חיבור יחיד ל-Postgres (Supabase) דרך Prisma.
 * singleton על globalThis כדי לשרוד HMR בפיתוח — כמו store.server הישן.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

const g = globalThis as typeof globalThis & { __prisma?: PrismaClient }
export const db = (g.__prisma ??= createClient())
