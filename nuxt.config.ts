const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.NUXT_PUBLIC_SUPABASE_KEY ||
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)
const paystackPublicKey =
  process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
  process.env.NUXT_PAYSTACK_PUBLIC_KEY ||
  process.env.PAYSTACK_PUBLIC_KEY
const paystackSecretKey = process.env.NUXT_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
const paystackWebhookSecret =
  process.env.NUXT_PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_WEBHOOK_SECRET
const supabaseServiceRoleKey =
  process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export default defineNuxtConfig({
  compatibilityDate: '2026-05-14',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
        },
      ],
    },
  },
  modules: hasSupabaseConfig
    ? [
        [
          '@nuxtjs/supabase',
          {
            redirect: false,
            types: '~~/types/database.types.ts',
            url: supabaseUrl,
            key: supabaseKey,
          },
        ],
      ]
    : [],
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  typescript: {
    typeCheck: true,
  },
  runtimeConfig: {
    supabaseServiceRoleKey,
    paystackSecretKey,
    paystackWebhookSecret,
    emailApiKey: '',
    adminOrderEmail: '',
    public: {
      siteUrl: '',
      supabaseUrl,
      supabaseAnonKey: supabaseKey,
      paystackPublicKey,
      sentryDsn: '',
    },
  },
})
