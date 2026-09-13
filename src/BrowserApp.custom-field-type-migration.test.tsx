/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createCustomField } from './domain/custom-field'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createDefaultViewPreferences } from './domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './persistence/view-preferences-storage'
import {
  loadWorkspace,
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

describe('BrowserApp Custom Field type migration', () => {
  it('explicitly clears Task values, preserves stale preferences, and reloads the migrated definition', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Research',
      now: '2026-09-13T12:00:00.000Z',
    })
    const score = createCustomField({
      id: 'field-score',
      name: 'Score',
      type: 'number',
      now: '2026-09-13T12:01:00.000Z',
    })
    const note = createCustomField({
      id: 'field-note',
      name: 'Note',
      type: 'text',
      now: '2026-09-13T12:02:00.000Z',
    })
    const task = {
      ...createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Task',
        now: '2026-09-13T12:03:00.000Z',
      }),
      customFieldValues: {
        [score.id]: 7,
        [note.id]: 'keep',
      },
    }

    saveWorkspace(storage, {
      projects: [project],
      tasks: [task],
      customFields: [score, note],
    })
    saveViewPreferences(storage, {
      ...createDefaultViewPreferences(),
      customFieldFilter: {
        fieldId: score.id,
        fieldType: 'number',
        value: 7,
      },
      customFieldSortFieldId: score.id,
    })

    const rendered = render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-13T12:05:00.000Z',
        }}
      />,
    )

    const typeSelect = screen.getByLabelText(
      'Type for custom field Score',
    ) as HTMLSelectElement
    const migrateButton = screen.getByRole('button', {
      name: 'Change type for Score and clear Task values',
    }) as HTMLButtonElement

    expect(typeSelect.value).toBe('number')
    expect(migrateButton.disabled).toBe(true)
    expect(
      (screen.getByLabelText('Custom field Score for Task') as HTMLInputElement)
        .value,
    ).toBe('7')

    await user.selectOptions(typeSelect, 'formula')
    expect(migrateButton.disabled).toBe(false)
    await user.click(migrateButton)

    const saved = loadWorkspace(storage)
    expect(saved.customFields?.find((field) => field.id === score.id)).toEqual({
      id: score.id,
      name: 'Score',
      type: 'formula',
      createdAt: '2026-09-13T12:01:00.000Z',
    })
    expect(saved.tasks[0]?.customFieldValues).toEqual({
      [note.id]: 'keep',
    })

    const formulaResult = screen.getByLabelText('Custom field Score for Task')
    expect(formulaResult.tagName).toBe('OUTPUT')
    expect(formulaResult.textContent).toBe('Unavailable')
    expect(
      (screen.getByLabelText('Custom field filter') as HTMLSelectElement).value,
    ).toBe('')
    expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
      'created',
    )
    expect(
      within(screen.getByLabelText('Sort tasks')).queryByRole('option', {
        name: 'Custom field: Score',
      }),
    ).toBeNull()
    expect(loadViewPreferences(storage)).toMatchObject({
      customFieldFilter: {
        fieldId: score.id,
        fieldType: 'number',
        value: 7,
      },
      customFieldSortFieldId: score.id,
    })

    rendered.unmount()
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-13T12:06:00.000Z',
        }}
      />,
    )

    expect(
      (screen.getByLabelText('Type for custom field Score') as HTMLSelectElement)
        .value,
    ).toBe('formula')
    expect(
      (screen.getByRole('button', {
        name: 'Change type for Score and clear Task values',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByLabelText('Custom field Score for Task').textContent).toBe(
      'Unavailable',
    )
  })
})
