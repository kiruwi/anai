import { createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdmin = () => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase admin credentials are not configured.',
    })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
