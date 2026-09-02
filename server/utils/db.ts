import { neon } from '@neondatabase/serverless'
import { createError } from 'h3'

export type DatabaseClient = ReturnType<typeof neon>

let database: DatabaseClient | undefined
let activeDatabaseUrl: string | undefined

/** Returns the private, pooled Neon HTTP query client for server-only use. */
export const getDatabase = (): DatabaseClient => {
  const config = useRuntimeConfig()
  const databaseUrl = typeof config.databaseUrl === 'string' ? config.databaseUrl.trim() : ''

  if (!databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Neon database URL is not configured.',
    })
  }

  if (!database || activeDatabaseUrl !== databaseUrl) {
    database = neon(databaseUrl)
    activeDatabaseUrl = databaseUrl
  }

  return database
}
