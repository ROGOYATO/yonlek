/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { emptyWorkspace } from './domain/workspace'
import { loadViewPreferences } from './persistence/view-preferences-storage'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'
import { BrowserApp } from './BrowserApp'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function expectActiveFilters(
  query: string,
  status: string,
  priority: string,
  dueDate: string,
  sort: string,
) {
  expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe(
    query,
  )
  expect(
    (screen.getByLabelText('Filter by status') as HTMLSelectElement).value,
  ).toBe(status)
  expect(
    (screen.getByLabelText('Filter by priority') as HTMLSelectElement).value,
  ).toBe(priority)
  expect(
    (screen.getByLabelText('Filter by due date') as HTMLSelectElement).value,
  ).toBe(dueDate)
  expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
    sort,
  )
}

describe('BrowserApp per-view Task filters and sorts', () => {
  it('restores per-view filters and sorts across switches and reloads', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    saveWorkspace(storage, emptyWorkspace)

    const firstRender = render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-12T06:30:00.000Z',
        }}
      />,
    )

    await user.type(screen.getByLabelText('Search tasks'), 'list')
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'doing')
    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'high')
    await user.selectOptions(
      screen.getByLabelText('Filter by due date'),
      'withDueDate',
    )
    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'title')

    await user.selectOptions(screen.getByLabelText('Task view'), 'board')
    expectActiveFilters('list', 'doing', 'high', 'withDueDate', 'title')

    await user.clear(screen.getByLabelText('Search tasks'))
    await user.type(screen.getByLabelText('Search tasks'), 'board')
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'done')
    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'low')
    await user.selectOptions(
      screen.getByLabelText('Filter by due date'),
      'withoutDueDate',
    )
    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'priority')

    await user.selectOptions(screen.getByLabelText('Task view'), 'list')
    expectActiveFilters('list', 'doing', 'high', 'withDueDate', 'title')

    const persisted = loadViewPreferences(storage)
    expect(persisted.viewMode).toBe('list')
    expect(persisted.filterSortByView?.list).toMatchObject({
      query: 'list',
      sort: 'title',
    })
    expect(persisted.filterSortByView?.board).toMatchObject({
      query: 'board',
      sort: 'priority',
    })
    expect(loadWorkspace(storage)).toEqual(emptyWorkspace)

    firstRender.unmount()

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-12T06:31:00.000Z',
        }}
      />,
    )

    expectActiveFilters('list', 'doing', 'high', 'withDueDate', 'title')
    await user.selectOptions(screen.getByLabelText('Task view'), 'board')
    expectActiveFilters('board', 'done', 'low', 'withoutDueDate', 'priority')
    expect(loadWorkspace(storage)).toEqual(emptyWorkspace)
  })
})
