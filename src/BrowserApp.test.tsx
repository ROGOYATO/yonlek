/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createArea } from './domain/area'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createTaskList } from './domain/task-list'
import { createDefaultViewPreferences } from './domain/view-preferences'
import { emptyWorkspace } from './domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './persistence/view-preferences-storage'
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


class PreferenceWriteFailingStore extends MemoryStore {
  setItem(key: string, value: string) {
    if (key === 'workspace-app.view-preferences') {
      throw new Error('Preference write failed')
    }

    super.setItem(key, value)
  }
}

describe('BrowserApp', () => {
  it('renders workspace state loaded from browser storage', () => {
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T03:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-03T03:05:00.000Z',
    })

    saveWorkspace(storage, {
      projects: [project],
      tasks: [task],
    })

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-03T03:10:00.000Z',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
  })
})


it('shows a readable error when saved workspace data is invalid', () => {
  const storage: KeyValueStore = {
    getItem: () => '{not-json',
    setItem: () => undefined,
  }

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T05:40:00.000Z',
      }}
    />,
  )

  expect(screen.getByRole('alert').textContent).toContain(
    'Saved workspace could not be loaded.',
  )
})


it('lets a user reset invalid saved workspace data', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  storage.setItem('workspace-app.workspace', '{not-json')

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T05:45:00.000Z',
      }}
    />,
  )

  await user.click(
    screen.getByRole('button', { name: 'Reset saved workspace' }),
  )

  expect(screen.getByText('No projects yet.')).toBeTruthy()
  expect(loadWorkspace(storage)).toEqual(emptyWorkspace)
})


it('restores saved view preferences without changing workspace data', () => {
  const storage = new MemoryStore()
  const robotics = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-03T06:00:00.000Z',
  })
  const field = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-03T06:01:00.000Z',
  })
  const inspect = createTask({
    id: 'task-1',
    projectId: field.id,
    title: 'Inspect test site',
    now: '2026-09-03T06:02:00.000Z',
  })

  saveWorkspace(storage, {
    projects: [robotics, field],
    tasks: [inspect],
  })
  saveViewPreferences(storage, {
    ...createDefaultViewPreferences(),
    projectView: field.id,
    query: 'inspect',
    sort: 'title',
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T06:03:00.000Z',
      }}
    />,
  )

  expect(
    (screen.getByLabelText('View project') as HTMLSelectElement).value,
  ).toBe(field.id)
  expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe(
    'inspect',
  )
  expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
    'title',
  )
  expect(screen.getByRole('heading', { name: 'Field Tests' })).toBeTruthy()
  expect(
    screen.queryByRole('heading', { name: 'Robotics Research' }),
  ).toBeNull()
  expect(loadWorkspace(storage).projects).toHaveLength(2)
})


it('persists view preference changes separately from workspace data', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  const robotics = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-03T06:10:00.000Z',
  })
  const field = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-03T06:11:00.000Z',
  })

  saveWorkspace(storage, {
    projects: [robotics, field],
    tasks: [],
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T06:12:00.000Z',
      }}
    />,
  )

  await user.selectOptions(screen.getByLabelText('View project'), field.id)
  await user.type(screen.getByLabelText('Search tasks'), 'site')
  await user.selectOptions(screen.getByLabelText('Filter by status'), 'done')
  await user.selectOptions(screen.getByLabelText('Sort tasks'), 'priority')

  expect(loadViewPreferences(storage)).toEqual({
    ...createDefaultViewPreferences(),
    projectView: field.id,
    query: 'site',
    status: 'done',
    sort: 'priority',
  })
  expect(loadWorkspace(storage).projects).toEqual([robotics, field])
})


it('repairs persisted project focus when the focused project is deleted', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  const robotics = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-03T06:20:00.000Z',
  })
  const field = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-03T06:21:00.000Z',
  })

  saveWorkspace(storage, {
    projects: [robotics, field],
    tasks: [],
  })
  saveViewPreferences(storage, {
    ...createDefaultViewPreferences(),
    projectView: field.id,
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T06:22:00.000Z',
      }}
    />,
  )

  await user.click(
    screen.getByRole('button', { name: 'Delete project Field Tests' }),
  )

  expect(loadViewPreferences(storage).projectView).toBe('all')
  expect(
    (screen.getByLabelText('View project') as HTMLSelectElement).value,
  ).toBe('all')
  expect(
    screen.getByRole('heading', { name: 'Robotics Research' }),
  ).toBeTruthy()
})


it('keeps view changes usable when preference persistence fails', async () => {
  const user = userEvent.setup()
  const storage = new PreferenceWriteFailingStore()

  saveWorkspace(storage, emptyWorkspace)

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T15:10:00.000Z',
      }}
    />,
  )

  await user.selectOptions(screen.getByLabelText('Sort tasks'), 'priority')

  expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
    'priority',
  )
  expect(screen.queryByRole('alert')).toBeNull()
})


it('repairs a saved project focus that no longer exists', () => {
  const storage = new MemoryStore()
  const robotics = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-03T15:20:00.000Z',
  })

  saveWorkspace(storage, {
    projects: [robotics],
    tasks: [],
  })
  saveViewPreferences(storage, {
    ...createDefaultViewPreferences(),
    projectView: 'missing-project',
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T15:21:00.000Z',
      }}
    />,
  )

  expect(
    (screen.getByLabelText('View project') as HTMLSelectElement).value,
  ).toBe('all')
  expect(loadViewPreferences(storage).projectView).toBe('all')
  expect(
    screen.getByRole('heading', { name: 'Robotics Research' }),
  ).toBeTruthy()
})


it('resets view preferences when invalid workspace data is reset', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  storage.setItem('workspace-app.workspace', '{not-json')
  saveViewPreferences(storage, {
    ...createDefaultViewPreferences(),
    query: 'stale query',
    status: 'done',
    sort: 'priority',
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T15:30:00.000Z',
      }}
    />,
  )

  await user.click(
    screen.getByRole('button', { name: 'Reset saved workspace' }),
  )

  expect(loadViewPreferences(storage)).toEqual(createDefaultViewPreferences())
  expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe(
    '',
  )
  expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
    'created',
  )
})


it('persists a task project move across browser composition reloads', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  const robotics = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-03T16:40:00.000Z',
  })
  const field = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-03T16:41:00.000Z',
  })
  const task = createTask({
    id: 'task-1',
    projectId: robotics.id,
    title: 'Draft experiment plan',
    now: '2026-09-03T16:42:00.000Z',
  })

  saveWorkspace(storage, {
    projects: [robotics, field],
    tasks: [task],
  })

  const firstRender = render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T16:43:00.000Z',
      }}
    />,
  )

  await user.selectOptions(
    screen.getByLabelText('Project for Draft experiment plan'),
    field.id,
  )

  expect(loadWorkspace(storage).tasks[0]?.projectId).toBe(field.id)

  firstRender.unmount()

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T16:44:00.000Z',
      }}
    />,
  )

  expect(
    (
      screen.getByLabelText(
        'Project for Draft experiment plan',
      ) as HTMLSelectElement
    ).value,
  ).toBe(field.id)
})


it('restores areas and project area assignments from browser storage', () => {
  const storage = new MemoryStore()
  const area = createArea({
    id: 'area-1',
    name: 'Engineering',
    now: '2026-09-03T19:45:00.000Z',
  })
  const project = {
    ...createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T19:46:00.000Z',
    }),
    areaId: area.id,
  }

  saveWorkspace(storage, {
    areas: [area],
    projects: [project],
    tasks: [],
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T19:47:00.000Z',
      }}
    />,
  )

  expect(
    (screen.getByLabelText('Area for Robotics Research') as HTMLSelectElement)
      .value,
  ).toBe(area.id)
})


it('restores lists and task list assignments from browser storage', () => {
  const storage = new MemoryStore()
  const project = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-04T04:05:00.000Z',
  })
  const list = createTaskList({
    id: 'list-1',
    projectId: project.id,
    name: 'Backlog',
    now: '2026-09-04T04:06:00.000Z',
  })
  const task = {
    ...createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-04T04:07:00.000Z',
    }),
    listId: list.id,
  }

  saveWorkspace(storage, {
    lists: [list],
    projects: [project],
    tasks: [task],
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-04T04:08:00.000Z',
      }}
    />,
  )

  expect(
    (screen.getByLabelText('List for Draft experiment plan') as HTMLSelectElement)
      .value,
  ).toBe(list.id)
})


it('restores a persisted subtask relationship', () => {
  const storage = new MemoryStore()
  const project = createProject({
    id: 'project-1',
    name: 'Robotics Research',
    now: '2026-09-04T05:15:00.000Z',
  })
  const parent = createTask({
    id: 'task-1',
    projectId: project.id,
    title: 'Draft experiment plan',
    now: '2026-09-04T05:16:00.000Z',
  })
  const child = {
    ...createTask({
      id: 'task-2',
      projectId: project.id,
      title: 'Calibrate camera',
      now: '2026-09-04T05:17:00.000Z',
    }),
    parentTaskId: parent.id,
  }

  saveWorkspace(storage, {
    projects: [project],
    tasks: [parent, child],
  })

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-04T05:18:00.000Z',
      }}
    />,
  )

  expect(screen.getByText('Subtask of Draft experiment plan')).toBeTruthy()
})
