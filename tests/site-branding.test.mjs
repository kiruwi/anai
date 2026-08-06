import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const projectUrl = (path) => new URL(`../${path}`, import.meta.url)
const readProjectFile = (path) => readFile(projectUrl(path), 'utf8')

test('favicon assets are installed and declared in the document head', async () => {
  const config = await readProjectFile('nuxt.config.ts')
  const assets = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest',
  ]

  for (const asset of assets) {
    assert.equal((await stat(projectUrl(`public/${asset}`))).isFile(), true)
  }

  assert.match(config, /href: '\/favicon\.ico'/)
  assert.match(config, /href: '\/favicon-32x32\.png'/)
  assert.match(config, /href: '\/favicon-16x16\.png'/)
  assert.match(config, /href: '\/apple-touch-icon\.png'/)
  assert.match(config, /href: '\/site\.webmanifest'/)

  const manifest = JSON.parse(await readProjectFile('public/site.webmanifest'))
  assert.equal(manifest.name, 'AÑAI Activewear & Athleisure')
  assert.equal(manifest.short_name, 'AÑAI')
})

test('footer description naturally supports the homepage title and H1 language', async () => {
  const footer = await readProjectFile('app/components/layout/SiteFooter.vue')

  assert.match(footer, /AÑAI activewear and athleisure designed in Kenya for training, errands, and everyday comfort\./)
})
