import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('browser entry', () => {
  it('provides a root element and loads the React entry module', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>')
  })
})
