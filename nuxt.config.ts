import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabasePublishableKey =
  process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NUXT_PUBLIC_SUPABASE_KEY ||
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY
const paystackPublicKey =
  process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
  process.env.NUXT_PAYSTACK_PUBLIC_KEY ||
  process.env.PAYSTACK_PUBLIC_KEY
const paystackSecretKey = process.env.NUXT_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
const paystackWebhookSecret =
  process.env.NUXT_PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_WEBHOOK_SECRET
const supabaseSecretKey =
  process.env.NUXT_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY
const hasNuxtImage = (() => {
  try {
    require.resolve('@nuxt/image')
    return true
  } catch {
    return false
  }
})()

const modules: any[] = [
  ...(hasNuxtImage
    ? [
        [
          '@nuxt/image',
          {
            quality: 72,
            format: ['avif', 'webp'],
            screens: {
              xs: 320,
              sm: 480,
              md: 768,
              lg: 1024,
              xl: 1280,
            },
            presets: {
              productCard: {
                modifiers: {
                  width: 341,
                  height: 341,
                  fit: 'cover',
                  format: 'webp',
                  quality: 72,
                },
              },
              tile: {
                modifiers: {
                  width: 546,
                  height: 683,
                  fit: 'cover',
                  format: 'webp',
                  quality: 72,
                },
              },
            },
          },
        ],
      ]
    : []),
]

export default defineNuxtConfig({
  compatibilityDate: '2026-05-14',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'ANAI | Activewear and Athleisure',
      meta: [
        {
          name: 'description',
          content: 'Shop ANAI activewear, athleisure sets, tops, outerwear, and accessories with secure checkout in Kenya.',
        },
      ],
      link: [
        {
          rel: 'preload',
          href: '/images/hero/run-poster.webp',
          as: 'image',
          type: 'image/webp',
          fetchpriority: 'high',
        },
      ],
    },
  },
  modules,
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  typescript: {
    typeCheck: true,
  },
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
      '/images/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
      '/Anai-Font/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
    },
  },
  runtimeConfig: {
    supabaseSecretKey,
    paystackSecretKey,
    paystackWebhookSecret,
    emailApiKey: '',
    adminOrderEmail: '',
    public: {
      siteUrl: '',
      supabaseUrl,
      supabasePublishableKey,
      supabaseAnonKey: supabasePublishableKey,
      paystackPublicKey,
      sentryDsn: '',
    },
  },
})
