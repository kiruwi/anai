import assert from 'node:assert/strict'
import { generateKeyPairSync, createVerify } from 'node:crypto'
import { test } from 'node:test'
import { sortProductsByViews } from '../shared/lib/productPopularity.ts'
import { aggregateProductViews, createProductPopularityReader, fetchGoogleProductViews } from '../server/utils/productPopularity.ts'

const row = (path, views) => ({ dimensionValues: [{ value: path }], metricValues: [{ value: String(views) }] })
const config = { propertyId: '540220862', clientEmail: 'test@example.iam.gserviceaccount.com', privateKey: 'test', siteUrl: 'https://anaibymurda.com' }

test('the most viewed eligible product comes first, combining public and legacy views without mutating catalogue order', () => {
  const products = [{ slug: 'first' }, { slug: 'legacy', urlSlug: 'public' }, { slug: 'third' }, { slug: 'last' }]
  const sorted = sortProductsByViews(products, { first: 20, legacy: 12, public: 15, third: 20, removed: 1000 })
  assert.deepEqual(sorted.map(p => p.slug), ['legacy', 'first', 'third', 'last'])
  assert.deepEqual(products.map(p => p.slug), ['first', 'legacy', 'third', 'last'])
  assert.deepEqual(sortProductsByViews(products, {}), products)
  assert.deepEqual(sortProductsByViews(products, { last: NaN, third: -5, legacy: Infinity }), products)
  assert.equal(sortProductsByViews([{ slug: 'same', urlSlug: 'same' }, { slug: 'other' }], { same: 5, other: 8 })[0].slug, 'other')
})

test('report rows aggregate URL variants and reject unrelated or malformed product URLs/counts', () => {
  assert.deepEqual(aggregateProductViews([
    row('/product/lela-set', 4), row('/product/lela-set/', 5), row('/product/lela-set?utm_source=email', 6),
    row('/product/%6cela-set', 2), row('/shop/new-in', 999), row('/product/lela-set/reviews', 999),
    row('/product/%zz', 999), row('/product/bad%2Fslug', 999), row('/product/negative', -2), row('/product/invalid', 'bad'),
  ]), { 'lela-set': 17 })
})

test('GA4 reader uses read-only signed authentication and queries only production product pages, with pagination', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const calls = []
  const request = async (url, options) => {
    calls.push({ url, options })
    if (calls.length === 1) return Response.json({ access_token: 'fake-access-token' })
    return Response.json({ rows: [row('/product/lela-set', calls.length)], rowCount: 10001 })
  }
  const result = await fetchGoogleProductViews({ ...config, privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).replaceAll('\n', '\\n') }, request)
  assert.deepEqual(result, { 'lela-set': 5 })
  const assertion = calls[0].options.body.get('assertion')
  const [header, payload, signature] = assertion.split('.')
  assert.equal(createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, signature, 'base64url'), true)
  const claims = JSON.parse(Buffer.from(payload, 'base64url'))
  assert.equal(claims.scope, 'https://www.googleapis.com/auth/analytics.readonly')
  assert.equal(claims.iss, config.clientEmail)
  const report = JSON.parse(calls[1].options.body)
  assert.equal(calls[1].url, `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`)
  assert.deepEqual(report.metrics, [{ name: 'screenPageViews' }])
  assert.deepEqual(report.dateRanges, [{ startDate: '30daysAgo', endDate: 'yesterday' }])
  assert.deepEqual(report.dimensionFilter.andGroup.expressions[0].filter.inListFilter.values, ['anaibymurda.com', 'www.anaibymurda.com'])
  assert.equal(report.dimensionFilter.andGroup.expressions[1].filter.stringFilter.value, '/product/')
  assert.equal(JSON.parse(calls[2].options.body).offset, '10000')
  assert.equal(calls[0].options.signal, calls[2].options.signal)
})

test('cache coalesces refreshes, refreshes hourly, preserves stale results on failure, and expires them', async () => {
  let now = Date.parse('2026-09-09T12:00:00Z')
  let calls = 0
  let fail = false
  const read = createProductPopularityReader(async () => {
    calls++
    if (fail) throw new Error('unavailable')
    return { popular: 10 }
  }, () => now, () => {})
  const [first, concurrent] = await Promise.all([read(config), read(config)])
  assert.equal(calls, 1)
  assert.deepEqual(first, concurrent)
  assert.equal(first.source, 'google-analytics')
  now += 3_599_000
  assert.deepEqual(await read(config), first)
  assert.equal(calls, 1)
  now += 1000
  fail = true
  assert.deepEqual(await read(config), first)
  assert.equal(calls, 2)
  await read(config)
  assert.equal(calls, 2)
  now += 86_400_000
  assert.deepEqual(await read(config), { viewsBySlug: {}, source: 'fallback', updatedAt: null })
  now += 60_000
  fail = false
  assert.equal((await read(config)).source, 'google-analytics')
})

test('missing credentials make no upstream requests and empty reports remain valid', async () => {
  let calls = 0
  const read = createProductPopularityReader(async () => { calls++; return {} })
  assert.equal((await read({ ...config, privateKey: '' })).source, 'fallback')
  assert.equal(calls, 0)
  assert.equal((await read(config)).source, 'google-analytics')
  assert.equal(calls, 1)
})

test('authentication and reporting failures are rejected for cache fallback', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const validConfig = { ...config, privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }) }
  await assert.rejects(fetchGoogleProductViews(validConfig, async () => new Response('', { status: 403 })), /authentication failed/)
  await assert.rejects(fetchGoogleProductViews(validConfig, async url => url.includes('/token')
    ? Response.json({ access_token: 'fake' }) : new Response('', { status: 429 })), /report failed/)
})
