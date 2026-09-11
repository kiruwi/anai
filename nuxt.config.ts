import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const databaseUrl = process.env.NUXT_DATABASE_URL || ''
const brevoApiKey = process.env.NUXT_BREVO_API_KEY || process.env.BREVO_API_KEY || ''
const brevoSenderEmail = process.env.NUXT_BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || ''
const salesNotificationEmail =
  process.env.NUXT_SALES_NOTIFICATION_EMAIL ||
  process.env.SALES_NOTIFICATION_EMAIL ||
  process.env.NUXT_SUPPORT_NOTIFICATION_EMAIL ||
  process.env.SUPPORT_NOTIFICATION_EMAIL ||
  ''
const supportNotificationEmail =
  process.env.NUXT_SUPPORT_NOTIFICATION_EMAIL || process.env.SUPPORT_NOTIFICATION_EMAIL || ''
const googleTagId =
  process.env.NUXT_PUBLIC_GOOGLE_TAG_ID ||
  process.env.NUXT_PUBLIC_GTAG_ID ||
  process.env.GOOGLE_TAG_ID ||
  ''
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
  devtools: { enabled: false },
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
        {
          name: 'theme-color',
          content: '#000000',
        },
      ],
      link: [
        {
          rel: 'icon',
          href: '/favicon.ico',
          sizes: 'any',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
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
          'cache-control': 'public, max-age=3600, must-revalidate',
        },
      },
      '/account/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
      '/cart/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
      '/checkout/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
      '/wishlist/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
      '/lookbook/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
      '/shop-the-look/**': {
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      },
    },
  },
  runtimeConfig: {
    ga4PropertyId: '',
    ga4ClientEmail: '',
    ga4PrivateKey: '',
    recoveryToken: process.env.NUXT_RECOVERY_TOKEN || '',
    trustedClientIpHeader: process.env.NUXT_TRUSTED_CLIENT_IP_HEADER || '',
    databaseUrl,
    brevoApiKey,
    brevoSenderEmail,
    salesNotificationEmail,
    supportNotificationEmail,
    mpesaEnvironment: process.env.NUXT_MPESA_ENVIRONMENT || 'sandbox',
    mpesaConsumerKey: process.env.NUXT_MPESA_CONSUMER_KEY || '',
    mpesaConsumerSecret: process.env.NUXT_MPESA_CONSUMER_SECRET || '',
    mpesaShortcode: process.env.NUXT_MPESA_SHORTCODE || '',
    mpesaTillNumber: process.env.NUXT_MPESA_TILL_NUMBER || '',
    mpesaPasskey: process.env.NUXT_MPESA_PASSKEY || '',
    mpesaCallbackUrl: process.env.NUXT_MPESA_CALLBACK_URL || '',
    mpesaCallbackToken: process.env.NUXT_MPESA_CALLBACK_TOKEN || '',
    mpesaTransactionType: process.env.NUXT_MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    mpesaTransactionDescription: process.env.NUXT_MPESA_TRANSACTION_DESCRIPTION || 'ANAI payment',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://anaibymurda.com',
      googleTagId,
    },
  },
})
