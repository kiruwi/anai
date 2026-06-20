export type LegalContentBlock = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type LegalPolicy = {
  slug: string
  title: string
  subtitle: string
  metaTitle: string
  metaDescription: string
  blocks: LegalContentBlock[]
}

export const lastUpdated = '10 June 2026'

export const supportDetails = {
  email: 'Contact Anai Support through the contact page.',
  phone: 'Share your phone or WhatsApp number in your support request so we can follow up.',
  location: 'Anai operates from Nairobi, Kenya.',
}

export const legalPolicies: LegalPolicy[] = [
  {
    slug: 'refund-policy',
    title: 'Refund & Return Policy',
    subtitle:
      'Read how Anai handles returns, exchanges, refunds, failed payments, and Paystack payment disputes.',
    metaTitle: 'Refund & Return Policy | Anai',
    metaDescription:
      'Read the Anai refund, return, exchange, failed payment, and Paystack dispute policy.',
    blocks: [
      {
        heading: '1. Returns',
        paragraphs: [
          'You may request a return within 7 days after receiving your order.',
          'To qualify for a return:',
        ],
        bullets: [
          'The item must be unused.',
          'The item must be in its original condition.',
          'The item must have all tags, packaging, and accessories.',
          'You must provide proof of purchase or your Paystack payment reference.',
        ],
      },
      {
        heading: '2. Non-returnable items',
        paragraphs: ['The following items cannot be returned unless they are defective or incorrect:'],
        bullets: [
          'Sale or clearance items',
          'Gift cards or vouchers',
          'Personalised or custom-made items',
          'Items damaged after delivery due to misuse',
          'Items returned without proof of purchase',
        ],
      },
      {
        heading: '3. Exchanges',
        paragraphs: [
          'You may request an exchange if:',
          'Exchanges depend on stock availability. If the replacement item is unavailable, we may offer store credit or a refund.',
        ],
        bullets: [
          'You received the wrong item.',
          'You received the wrong size.',
          'The item arrived damaged or defective.',
          'The item does not match the order confirmation.',
        ],
      },
      {
        heading: '4. Refunds',
        paragraphs: [
          'Once we receive and inspect the returned item, we will notify you about the refund decision.',
          'Approved refunds will be processed through the original payment method used at checkout.',
          'If you paid through Paystack, the refund will be linked to your Paystack transaction reference.',
          'Refund processing timelines may vary depending on your bank, card provider, or mobile money provider.',
        ],
      },
      {
        heading: '5. Delivery fees',
        paragraphs: [
          'Delivery fees are non-refundable unless:',
          'If you return an item for size, preference, or change of mind, you may pay the return delivery cost.',
        ],
        bullets: [
          'Anai sent the wrong item.',
          'The item arrived damaged.',
          'The order was cancelled before dispatch.',
          'The issue was caused by Anai.',
        ],
      },
      {
        heading: '6. Damaged or incorrect items',
        paragraphs: [
          'Please inspect your order when it arrives.',
          'If you receive a damaged, defective, or incorrect item, contact us within 48 hours of delivery with:',
          'We will review the claim and provide the next steps.',
        ],
        bullets: [
          'Your name',
          'Order number',
          'Paystack transaction reference',
          'Photos of the item',
          'Photos of the packaging',
          'A short description of the issue',
        ],
      },
      {
        heading: '7. Order cancellations',
        paragraphs: [
          'You may cancel an order before it is dispatched.',
          'Once an order has been dispatched, it cannot be cancelled. You may request a return after receiving it, subject to this policy.',
        ],
      },
      {
        heading: '8. Failed or duplicate payments',
        paragraphs: [
          'If your Paystack payment failed but money was deducted, contact us with your transaction reference.',
          'If you made a duplicate payment, contact us as soon as possible. Once confirmed, we will process a refund for the duplicate amount.',
        ],
      },
      {
        heading: '9. Chargebacks and disputes',
        paragraphs: [
          'If you have a payment issue, contact Anai first so we can help resolve it.',
          'For faster support, include your order number and Paystack transaction reference.',
        ],
      },
      {
        heading: '10. Contact us',
        paragraphs: [
          'For refund, return, or exchange requests, contact Anai Support.',
          supportDetails.email,
          supportDetails.phone,
          supportDetails.location,
        ],
      },
    ],
  },
  {
    slug: 'delivery-policy',
    title: 'Delivery Policy',
    subtitle:
      'Read how Anai handles delivery timelines, fees, failed delivery, and package inspection.',
    metaTitle: 'Delivery Policy | Anai',
    metaDescription:
      'Read how Anai handles delivery timelines, delivery fees, failed delivery, and package inspection.',
    blocks: [
      {
        heading: '1. Delivery coverage',
        paragraphs: [
          'Anai delivers orders within Kenya.',
          'Delivery timelines and fees depend on your location and the delivery method selected at checkout.',
        ],
      },
      {
        heading: '2. Delivery timelines',
        paragraphs: [
          'Delivery timelines are estimates. Delays may happen due to courier delays, stock availability, location, weather, public holidays, or events outside Anai control.',
        ],
      },
      {
        heading: '3. Delivery details',
        paragraphs: [
          'You must provide accurate delivery information, including your name, phone number, address, and any delivery instructions.',
          'Anai is not responsible for delays caused by incorrect phone numbers, wrong addresses, or unavailable recipients.',
        ],
      },
      {
        heading: '4. Failed delivery',
        paragraphs: [
          'If delivery fails because you are unavailable or unreachable, you may be charged for another delivery attempt.',
        ],
      },
      {
        heading: '5. Delivery inspection',
        paragraphs: [
          'Please inspect your package when it arrives.',
          'Report damaged, missing, or incorrect items within 48 hours of delivery.',
        ],
      },
      {
        heading: '6. Contact',
        paragraphs: [
          'For delivery support, contact Anai Support.',
          supportDetails.email,
          supportDetails.phone,
        ],
      },
    ],
  },
  {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    subtitle: 'Read the terms for using the Anai website and buying products online.',
    metaTitle: 'Terms of Use | Anai',
    metaDescription: 'Read the terms for using the Anai website and buying products online.',
    blocks: [
      {
        heading: '1. About Anai',
        paragraphs: ['Anai operates this website to display and sell products online.'],
      },
      {
        heading: '2. Product information',
        paragraphs: [
          'We try to display product details, prices, colours, sizes, and availability correctly.',
          'Minor differences may occur due to screen display settings, lighting, or product updates.',
        ],
      },
      {
        heading: '3. Pricing',
        paragraphs: [
          'All prices are shown in Kenya Shillings, unless stated otherwise.',
          'Prices may change without prior notice. The price shown at checkout is the final product price before delivery fees, discounts, or other charges.',
        ],
      },
      {
        heading: '4. Orders',
        paragraphs: [
          'An order is confirmed once payment is received and accepted.',
          'Anai may cancel an order if:',
        ],
        bullets: [
          'The item is out of stock.',
          'The payment cannot be verified.',
          'The delivery details are incorrect.',
          'Fraud or misuse is suspected.',
          'The price or product details were listed incorrectly by mistake.',
        ],
      },
      {
        heading: '5. Payments',
        paragraphs: [
          'Payments are processed through Paystack.',
          'By paying through Paystack, you may also be subject to Paystack payment terms.',
          'Anai does not store your full card details.',
        ],
      },
      {
        heading: '6. Delivery',
        paragraphs: [
          'Delivery timelines are estimates and may change due to courier delays, stock availability, location, weather, public holidays, or other factors outside Anai control.',
        ],
      },
      {
        heading: '7. Returns and refunds',
        paragraphs: ['Returns and refunds are handled under the Anai Refund & Return Policy.'],
      },
      {
        heading: '8. User conduct',
        paragraphs: [
          'You agree not to misuse this website, attempt fraud, interfere with checkout, copy content, upload harmful files, or use the website for unlawful activity.',
        ],
      },
      {
        heading: '9. Intellectual property',
        paragraphs: [
          'All website content belongs to Anai or its licensors. You may not copy, reuse, distribute, or modify our content without written permission.',
        ],
      },
      {
        heading: '10. Limitation of liability',
        paragraphs: [
          'Anai is not liable for indirect loss, loss of profit, delay caused by third parties, payment provider downtime, courier delays, or misuse of purchased products.',
        ],
      },
      {
        heading: '11. Changes to these terms',
        paragraphs: [
          'Anai may update these Terms of Use at any time. Updates will appear on this page with a new date.',
        ],
      },
      {
        heading: '12. Contact',
        paragraphs: [supportDetails.email, supportDetails.phone],
      },
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'Read how Anai collects, uses, stores, and protects customer data.',
    metaTitle: 'Privacy Policy | Anai',
    metaDescription: 'Read how Anai collects, uses, stores, and protects customer data.',
    blocks: [
      {
        heading: '1. Information we collect',
        paragraphs: ['We may collect:'],
        bullets: [
          'Name',
          'Phone number',
          'Email address',
          'Delivery address',
          'Order details',
          'Payment reference',
          'Device and browser information',
          'Messages sent through contact forms, WhatsApp, or email',
        ],
      },
      {
        heading: '2. How we use your information',
        paragraphs: ['We use your information to:'],
        bullets: [
          'Process orders',
          'Confirm payments',
          'Deliver products',
          'Handle returns and refunds',
          'Respond to customer support requests',
          'Prevent fraud',
          'Improve the website',
          'Send order updates or marketing messages, where allowed',
        ],
      },
      {
        heading: '3. Payments',
        paragraphs: [
          'Payments are processed through Paystack. Anai does not store your full card details.',
          'We may receive payment status, transaction reference, amount paid, and payment confirmation details from Paystack.',
        ],
      },
      {
        heading: '4. Sharing your information',
        paragraphs: [
          'We may share your information with:',
          'We do not sell your personal information.',
        ],
        bullets: [
          'Payment providers',
          'Delivery partners',
          'Website hosting providers',
          'Customer support tools',
          'Legal or regulatory authorities, where required',
        ],
      },
      {
        heading: '5. Cookies',
        paragraphs: [
          'Anai may use cookies to improve website performance, remember your preferences, track analytics, and support checkout.',
          'You can block cookies in your browser settings, but some website features may not work correctly.',
        ],
      },
      {
        heading: '6. Data security',
        paragraphs: [
          'We take reasonable steps to protect your personal information from loss, misuse, unauthorised access, or disclosure.',
        ],
      },
      {
        heading: '7. Your rights',
        paragraphs: ['You may request to:'],
        bullets: [
          'Access your personal data',
          'Correct inaccurate data',
          'Delete your data',
          'Object to some uses of your data',
          'Withdraw consent where processing depends on consent',
        ],
      },
      {
        heading: '8. Contact',
        paragraphs: ['For privacy requests, contact Anai Privacy Team.', supportDetails.email],
      },
    ],
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    subtitle:
      'Read how Anai uses cookies for checkout, preferences, analytics, and site performance.',
    metaTitle: 'Cookie Policy | Anai',
    metaDescription:
      'Read how Anai uses cookies for checkout, preferences, analytics, and site performance.',
    blocks: [
      {
        heading: '1. What cookies are',
        paragraphs: [
          'Cookies are small files stored on your device when you visit a website. They help the website work, remember choices, and understand how visitors use the site.',
        ],
      },
      {
        heading: '2. Types of cookies we use',
        bullets: [
          'Essential cookies: keep the site and checkout working.',
          'Analytics cookies: help us understand site traffic.',
          'Preference cookies: remember settings such as cart or display choices.',
          'Marketing cookies: help us measure campaign performance.',
        ],
      },
      {
        heading: '3. Managing cookies',
        paragraphs: [
          'You can manage cookies through your browser settings or the cookie banner.',
          'If you block some cookies, parts of the website may not work correctly.',
        ],
      },
      {
        heading: '4. Contact',
        paragraphs: ['For questions about cookies, contact Anai Support.', supportDetails.email],
      },
    ],
  },
  {
    slug: 'copyright-notice',
    title: 'Copyright Notice',
    subtitle: 'Read the Anai copyright notice and permitted use of website content.',
    metaTitle: 'Copyright Notice | Anai',
    metaDescription: 'Read the Anai copyright notice and permitted use of website content.',
    blocks: [
      {
        heading: '1. Ownership',
        paragraphs: [
          'All content on this website, including text, images, graphics, product names, designs, logos, icons, page layouts, and visual assets, belongs to Anai or its licensors.',
        ],
      },
      {
        heading: '2. Restrictions',
        paragraphs: [
          'You may not copy, reproduce, sell, republish, distribute, modify, scrape, or use Anai website content without written permission.',
        ],
      },
      {
        heading: '3. Permitted use',
        paragraphs: [
          'You may view the website and share links to Anai pages for personal, non-commercial use.',
        ],
      },
      {
        heading: '4. Third-party content',
        paragraphs: [
          'Some content, tools, fonts, images, plugins, payment services, or integrations may belong to third parties. Their own terms may apply.',
        ],
      },
      {
        heading: '5. Reporting infringement',
        paragraphs: [
          'If you believe content on this website infringes your rights, contact us with details of the content and proof of ownership.',
          supportDetails.email,
        ],
      },
    ],
  },
]

export const legalPaths = legalPolicies.map((policy) => `/legal/${policy.slug}`)

export const getLegalPolicy = (slug: string) =>
  legalPolicies.find((policy) => policy.slug === slug)
