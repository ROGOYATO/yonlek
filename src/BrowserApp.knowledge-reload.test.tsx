/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createProject } from './domain/project'
import { saveWorkspace, type KeyValueStore } from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const runtime = {
  nextId: () => 'knowledge-created',
  now: () => '2026-10-04T09:00:00.000Z',
}

afterEach(() => cleanup())

describe('Browser Knowledge reload', () => {
  it('creates a Project-linked Wiki document and reloads it from storage version 1', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({ id: 'project-1', name: 'Launch', now: '2026-10-04T08:00:00.000Z' })
    saveWorkspace(storage, { projects: [project], tasks: [] })

    const first = render(<BrowserApp storage={storage} runtime={runtime} />)
    await user.type(screen.getByLabelText('New document title'), 'Release handbook')
    await user.selectOptions(screen.getByLabelText('New document kind'), 'doc')
    await user.type(screen.getByLabelText('New document content'), 'Canonical release steps')
    await user.selectOptions(screen.getByLabelText('New document Project'), project.id)
    await user.click(screen.getByLabelText('New document is Wiki source of truth'))
    await user.click(screen.getByRole('button', { name: 'Add document' }))

    expect(within(screen.getByRole('region', { name: 'Wiki' })).getByRole('heading', { name: 'Release handbook' })).toBeTruthy()
    first.unmount()

    render(<BrowserApp storage={storage} runtime={runtime} />)

    const wiki = within(screen.getByRole('region', { name: 'Wiki' }))
    expect(wiki.getByRole('heading', { name: 'Release handbook' })).toBeTruthy()
    expect((screen.getByLabelText('Document content for Release handbook') as HTMLTextAreaElement).value).toBe('Canonical release steps')
    expect((screen.getByLabelText('Project for Release handbook') as HTMLSelectElement).value).toBe(project.id)
    expect((screen.getByLabelText('Source of truth for Release handbook') as HTMLInputElement).checked).toBe(true)
  })
})
