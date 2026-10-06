/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  addCustomFieldOption,
  createCustomField,
} from './domain/custom-field'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createDefaultViewPreferences } from './domain/view-preferences'
import { loadViewPreferences, saveViewPreferences } from './persistence/view-preferences-storage'
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

function buildWorkspace() {
  const project = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-13T08:40:00.000Z',
  })
  const team = createCustomField({
    id: 'field-team',
    name: 'Team',
    type: 'text',
    now: '2026-09-13T08:40:01.000Z',
  })
  const score = createCustomField({
    id: 'field-score',
    name: 'Score',
    type: 'number',
    now: '2026-09-13T08:40:02.000Z',
  })
  const phase = addCustomFieldOption(
    addCustomFieldOption(
      createCustomField({
        id: 'field-phase',
        name: 'Phase',
        type: 'select',
        now: '2026-09-13T08:40:03.000Z',
      }),
      { id: 'option-draft', name: 'Draft' },
    ),
    { id: 'option-review', name: 'Review' },
  )
  const alpha = {
    ...createTask({
      id: 'task-alpha',
      projectId: project.id,
      title: 'Alpha task',
      now: '2026-09-13T08:41:00.000Z',
    }),
    customFieldValues: {
      [team.id]: 'Camera team',
      [score.id]: 2,
      [phase.id]: 'option-review',
    },
  }
  const beta = {
    ...createTask({
      id: 'task-beta',
      projectId: project.id,
      title: 'Beta task',
      now: '2026-09-13T08:42:00.000Z',
    }),
    customFieldValues: {
      [team.id]: 'Lidar team',
      [score.id]: 1,
      [phase.id]: 'option-draft',
    },
  }

  return {
    project,
    team,
    score,
    phase,
    workspace: {
      projects: [project],
      tasks: [alpha, beta],
      customFields: [team, score, phase],
    },
  }
}

describe('BrowserApp Custom Field filtering and sorting', () => {
  it('filters visible Tasks, sorts them by Custom Field, and persists the active preference state', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const { workspace, team, score, phase } = buildWorkspace()
    saveWorkspace(storage, workspace)

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-13T08:50:00.000Z',
        }}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Sort tasks'), `custom:${score.id}`)
    expect(
      screen.getAllByLabelText(/^Select task /).map((input) =>
        input.getAttribute('aria-label'),
      ),
    ).toEqual(['Select task Beta task', 'Select task Alpha task'])

    await user.selectOptions(screen.getByLabelText('Custom field filter'), team.id)
    await user.type(screen.getByLabelText('Filter custom field Team'), 'camera')
    expect(screen.getByLabelText('Select task Alpha task')).toBeTruthy()
    expect(screen.queryByLabelText('Select task Beta task')).toBeNull()

    await user.selectOptions(screen.getByLabelText('Custom field filter'), phase.id)
    await user.selectOptions(
      screen.getByLabelText('Filter custom field Phase'),
      'option-review',
    )
    await user.click(screen.getByLabelText('Select all visible tasks'))
    expect(screen.getByText('1 task selected')).toBeTruthy()
    expect(
      (screen.getByLabelText('Select task Alpha task') as HTMLInputElement)
        .checked,
    ).toBe(true)

    await user.selectOptions(screen.getByLabelText('Task view'), 'table')
    expect(screen.getByLabelText('Table task details Alpha task')).toBeTruthy()
    expect(screen.queryByLabelText('Table task details Beta task')).toBeNull()

    const persisted = loadViewPreferences(storage)
    expect(persisted.customFieldFilter).toEqual({
      fieldId: phase.id,
      fieldType: 'select',
      value: 'option-review',
    })
    expect(persisted.customFieldSortFieldId).toBe(score.id)
    expect(loadWorkspace(storage)).toEqual(workspace)

  })

  it('restores persisted Custom Field filter and sort state after reload', () => {
    const storage = new MemoryStore()
    const { workspace, score, phase } = buildWorkspace()
    saveWorkspace(storage, workspace)
    saveViewPreferences(storage, {
      ...createDefaultViewPreferences(),
      customFieldFilter: {
        fieldId: phase.id,
        fieldType: 'select',
        value: 'option-review',
      },
      customFieldSortFieldId: score.id,
    })

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-13T08:51:00.000Z',
        }}
      />,
    )

    expect(
      (screen.getByLabelText('Custom field filter') as HTMLSelectElement).value,
    ).toBe(phase.id)
    expect(
      (screen.getByLabelText('Filter custom field Phase') as HTMLSelectElement)
        .value,
    ).toBe('option-review')
    expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
      `custom:${score.id}`,
    )
  })

  it('treats deleted Custom Field preference references as inactive', () => {
    const storage = new MemoryStore()
    const { workspace } = buildWorkspace()
    saveWorkspace(storage, workspace)
    saveViewPreferences(storage, {
      ...createDefaultViewPreferences(),
      customFieldFilter: {
        fieldId: 'deleted-field',
        fieldType: 'text',
        value: 'camera',
      },
      customFieldSortFieldId: 'deleted-field',
    })

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-13T08:52:00.000Z',
        }}
      />,
    )

    expect(screen.getByLabelText('Select task Alpha task')).toBeTruthy()
    expect(screen.getByLabelText('Select task Beta task')).toBeTruthy()
    expect(
      (screen.getByLabelText('Custom field filter') as HTMLSelectElement).value,
    ).toBe('')
    expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
      'created',
    )
  })
})
