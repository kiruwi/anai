import { createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const websocketTransport = WebSocket as unknown as typeof globalThis.WebSocket

export const getSupabaseAdmin = () => {
  const config = useRuntimeConfig()
  const supabaseUrl =
    typeof config.public.supabaseUrl === 'string' ? config.public.supabaseUrl : ''
  const secretKey = typeof config.supabaseSecretKey === 'string' ? config.supabaseSecretKey : ''

  if (!supabaseUrl || !secretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase secret key is not configured.',
    })
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: websocketTransport,
    },
  })
}
