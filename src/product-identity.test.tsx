/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { emptyWorkspace } from './domain/workspace'
import {
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('Yönlek product identity', () => {
  it('uses Yönlek on the browser recovery screen', () => {
    render(
      <BrowserApp
        storage={{
          getItem: () => '{not-json',
          setItem: () => undefined,
        }}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-03T18:40:00.000Z',
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Yönlek' })).toBeTruthy()
  })

  it('uses the Yönlek web/package identity without changing storage keys', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const packageDocument = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { name: string }
    const storage = new MemoryStore()

    saveWorkspace(storage, emptyWorkspace)

    expect(html).toContain('<title>Yönlek</title>')
    expect(packageDocument.name).toBe('yonlek')
    expect(storage.getItem('workspace-app.workspace')).not.toBeNull()
    expect(storage.getItem('yonlek.workspace')).toBeNull()
  })
})
