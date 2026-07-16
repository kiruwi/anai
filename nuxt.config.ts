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
const googleTagId =
  process.env.NUXT_PUBLIC_GOOGLE_TAG_ID ||
  process.env.NUXT_PUBLIC_GTAG_ID ||
  process.env.GOOGLE_TAG_ID ||
  ''
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
  "form-action 'self'",
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
  ].join(' '),
  [
    "script-src-elem",
    "'self'",
    "'unsafe-inline'",
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
  ].join(' '),
  [
    "connect-src",
    "'self'",
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
    'https://pagead2.googlesyndication.com',
    'https://*.supabase.co',
    'wss://*.supabase.co',
  ].join(' '),
  [
    "frame-src",
    "'self'",
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
      script: [
        {
          innerHTML: [
            'window.dataLayer = window.dataLayer || [];',
            'window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };',
            "window.gtag('consent', 'default', {",
            "  ad_storage: 'denied',",
            "  ad_user_data: 'denied',",
            "  ad_personalization: 'denied',",
            "  analytics_storage: 'denied',",
            '  wait_for_update: 500',
            '});',
          ].join('\n'),
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
    mpesaEnvironment: process.env.NUXT_MPESA_ENVIRONMENT || 'sandbox',
    mpesaConsumerKey: process.env.NUXT_MPESA_CONSUMER_KEY || '',
    mpesaConsumerSecret: process.env.NUXT_MPESA_CONSUMER_SECRET || '',
    mpesaShortcode: process.env.NUXT_MPESA_SHORTCODE || '',
    mpesaPasskey: process.env.NUXT_MPESA_PASSKEY || '',
    mpesaCallbackUrl: process.env.NUXT_MPESA_CALLBACK_URL || '',
    mpesaCallbackToken: process.env.NUXT_MPESA_CALLBACK_TOKEN || '',
    mpesaTransactionType: process.env.NUXT_MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    mpesaTransactionDescription: process.env.NUXT_MPESA_TRANSACTION_DESCRIPTION || 'ANAI payment',
    emailApiKey: '',
    adminOrderEmail: '',
    public: {
      siteUrl: '',
      supabaseUrl,
      supabasePublishableKey,
      supabaseAnonKey: supabasePublishableKey,
      googleTagId,
    },
  },
})
