import { getDatabase } from './db'
import type { ReversalUpdate } from './mpesaReversal'

export async function recordMpesaReversal(attempt: string, update: ReversalUpdate) {
  const sql = getDatabase()
  const [row] = await sql`
    select public.update_return_reversal(${attempt}::uuid,${update.outcome},${update.conversation ?? null},
      ${update.originator ?? null},${update.original ?? null},${update.receipt ?? null},${update.amount ?? null}::integer) as id
  ` as unknown as Array<{ id: string | null }>
  return row?.id
}
