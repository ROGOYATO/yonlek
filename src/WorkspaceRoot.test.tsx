/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import type { KeyValueStore } from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function createTestApplication() {
  const storage = new MemoryStore()
  const store = createWorkspaceStore(storage)
  const ids = ['project-1', 'task-1']
  const commands = createWorkspaceCommands(store, {
    nextId: () => ids.shift() ?? 'unexpected-id',
    now: () => '2026-09-03T02:00:00.000Z',
  })

  return { store, commands }
}

describe('WorkspaceRoot', () => {
  it('lets a user create a project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Project name'), 'Robotics Research')
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
    expect(store.getState().projects[0]?.name).toBe('Robotics Research')
  })
  it('lets a user add a task to an existing project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText('Task title for Robotics Research'),
      'Draft experiment plan',
    )
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(store.getState().tasks[0]?.title).toBe('Draft experiment plan')
  })
})


describe('WorkspaceRoot task fields', () => {
  it('lets a user change task status and priority', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText('Status for Draft experiment plan'),
      'doing',
    )
    await user.selectOptions(
      screen.getByLabelText('Priority for Draft experiment plan'),
      'high',
    )

    expect(store.getState().tasks[0]?.status).toBe('doing')
    expect(store.getState().tasks[0]?.priority).toBe('high')
  })
})


describe('WorkspaceRoot task rename', () => {
  it('lets a user rename a task', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText('Title for Draft experiment plan')
    await user.clear(input)
    await user.type(input, 'Review experiment plan')
    await user.click(
      screen.getByRole('button', {
        name: 'Save title for Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]?.title).toBe('Review experiment plan')
    expect(screen.getByText('Review experiment plan')).toBeTruthy()
  })
})


describe('WorkspaceRoot task deletion', () => {
  it('lets a user delete a task without deleting its project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Delete task Draft experiment plan',
      }),
    )

    expect(screen.queryByText('Draft experiment plan')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
    expect(store.getState().tasks).toEqual([])
  })
})


describe('WorkspaceRoot project deletion', () => {
  it('lets a user delete a project and its tasks', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Delete project Robotics Research',
      }),
    )

    expect(
      screen.queryByRole('heading', { name: 'Robotics Research' }),
    ).toBeNull()
    expect(store.getState()).toEqual({ projects: [], tasks: [] })
  })
})


describe('WorkspaceRoot validation feedback', () => {
  it('shows project validation errors without changing workspace state', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(screen.getByRole('alert').textContent).toContain(
      'Project name is required',
    )
    expect(store.getState().projects).toEqual([])
  })

  it('shows task validation errors without adding a task', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(screen.getByRole('alert').textContent).toContain(
      'Task title is required',
    )
    expect(store.getState().tasks).toEqual([])
  })
})
