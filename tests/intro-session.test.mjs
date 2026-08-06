import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('branded intro state survives hard refreshes for the browser session', async () => {
  const hero = await readProjectFile('app/components/home/HomeHero.vue')
  const header = await readProjectFile('app/components/layout/SiteHeader.vue')

  assert.match(hero, /useCookie<boolean>\('anai-logo-intro-played'/)
  assert.match(header, /useCookie<boolean>\('site-header-intro-played'/)
  assert.doesNotMatch(hero, /useState\('anai-logo-intro-played'/)
  assert.doesNotMatch(header, /useState\('site-header-intro-played'/)

  for (const component of [hero, header]) {
    assert.match(component, /path: '\/'/)
    assert.doesNotMatch(component, /maxAge|expires/)
  }
})

test('the full-screen branded loader remains scoped to the homepage hero', async () => {
  const app = await readProjectFile('app/app.vue')
  const homepage = await readProjectFile('app/pages/index.vue')

  assert.doesNotMatch(app, /<HomeHero/)
  assert.match(homepage, /<HomeHero\s*\/?>/)
})
