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
const googleTagId =
  process.env.NUXT_PUBLIC_GOOGLE_TAG_ID ||
  process.env.NUXT_PUBLIC_GTAG_ID ||
  process.env.GOOGLE_TAG_ID ||
  'G-WW5TYKEGPK'
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

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.paystack.com https://paystack.com",
  [
    "img-src",
    "'self'",
    'data:',
    'blob:',
    'https://images.unsplash.com',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
  ].join(' '),
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://fonts.googleapis.com",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://js.paystack.co',
    'https://checkout.paystack.com',
    'https://applepay.cdn-apple.com',
  ].join(' '),
  [
    "script-src-elem",
    "'self'",
    "'unsafe-inline'",
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://js.paystack.co',
    'https://checkout.paystack.com',
    'https://applepay.cdn-apple.com',
  ].join(' '),
  [
    "connect-src",
    "'self'",
    'https://api.paystack.co',
    'https://checkout.paystack.com',
    'https://standard.paystack.co',
    'https://legacy-staging.paystack.co',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
    'https://pagead2.googlesyndication.com',
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://*.sentry.io',
  ].join(' '),
  [
    "frame-src",
    "'self'",
    'https://checkout.paystack.com',
    'https://standard.paystack.co',
    'https://legacy-staging.paystack.co',
    'https://paystack.com',
    'https://www.googletagmanager.com',
  ].join(' '),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = {
  'content-security-policy': contentSecurityPolicy,
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
}

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
    },
  },
  modules,
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  typescript: {
    typeCheck: false,
  },
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/**': {
        headers: securityHeaders,
      },
      '/_nuxt/**': {
        headers: {
          ...securityHeaders,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
      '/images/**': {
        headers: {
          ...securityHeaders,
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
      googleTagId,
      sentryDsn: '',
    },
  },
})
