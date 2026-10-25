import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { applyTheme, readStoredTheme, resolveTheme, writeStoredTheme } from './theme.ts'

const originals = {
  document: globalThis.document,
  localStorage: globalThis.localStorage,
  window: globalThis.window,
}

afterEach(() => {
  restore('document')
  restore('localStorage')
  restore('window')
})

function restore(key) {
  if (originals[key] === undefined) delete globalThis[key]
  else globalThis[key] = originals[key]
}

function installDom({
  cookieGet,
  cookieSet,
  storageGet,
  storageSet,
} = {}) {
  const store = new Map()
  let jar = ''
  globalThis.localStorage = {
    getItem(key) {
      if (storageGet) storageGet()
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      if (storageSet) storageSet()
      store.set(key, value)
    },
  }
  globalThis.document = { documentElement: { dataset: {} } }
  Object.defineProperty(globalThis.document, 'cookie', {
    configurable: true,
    get() {
      if (cookieGet) return cookieGet()
      return jar
    },
    set(value) {
      if (cookieSet) cookieSet(value)
      else jar = String(value)
    },
  })
  globalThis.window = {}
}

function blocked() {
  throw new DOMException('storage blocked', 'SecurityError')
}

test('a throwing cookie write still lets the in-memory theme win', () => {
  installDom({
    storageSet: blocked,
    cookieGet: blocked,
    cookieSet: blocked,
  })

  assert.doesNotThrow(() => writeStoredTheme('admin'))
  assert.doesNotThrow(() => applyTheme('admin'))
  assert.equal(document.documentElement.dataset.theme, 'admin')
  assert.equal(window.__BLOG_THEME__, 'admin')
  assert.equal(resolveTheme(''), 'admin')
  assert.equal(resolveTheme('theme=classic'), 'classic')
})

test('a throwing cookie read does not escape when nothing is stored', () => {
  installDom({
    storageGet: blocked,
    cookieGet: blocked,
  })

  assert.equal(readStoredTheme(), 'classic')
  assert.equal(resolveTheme(''), 'classic')
  assert.equal(resolveTheme('?theme=admin'), 'admin')
})
