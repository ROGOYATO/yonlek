/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
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
  const ids = ['project-1', 'task-1', 'task-2', 'task-3']
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


describe('WorkspaceRoot project rename', () => {
  it('lets a user rename a project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText('Name for Robotics Research')
    await user.clear(input)
    await user.type(input, 'Autonomy Lab')
    await user.click(
      screen.getByRole('button', {
        name: 'Save project name for Robotics Research',
      }),
    )

    expect(store.getState().projects[0]?.name).toBe('Autonomy Lab')
    expect(
      screen.getByRole('heading', { name: 'Autonomy Lab' }),
    ).toBeTruthy()
  })

  it('shows a validation error for a blank project rename', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText('Name for Robotics Research')
    await user.clear(input)
    await user.click(
      screen.getByRole('button', {
        name: 'Save project name for Robotics Research',
      }),
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Project name is required',
    )
    expect(store.getState().projects[0]?.name).toBe('Robotics Research')
  })
})


describe('WorkspaceRoot task search', () => {
  it('filters visible tasks by title', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    commands.addTask(project.id, 'Review safety checklist')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Search tasks'), 'safety')

    expect(screen.getByText('Review safety checklist')).toBeTruthy()
    expect(screen.queryByText('Draft experiment plan')).toBeNull()
  })
})


describe('WorkspaceRoot status filter', () => {
  it('filters visible tasks by status', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    const todoTask = commands.addTask(project.id, 'Draft experiment plan')
    const doneTask = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskStatus(doneTask.id, 'done')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'done')

    expect(screen.getByText('Review safety checklist')).toBeTruthy()
    expect(screen.queryByText(todoTask.title)).toBeNull()
  })
})


describe('WorkspaceRoot priority filter', () => {
  it('filters visible tasks by priority', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    const normalTask = commands.addTask(project.id, 'Draft experiment plan')
    const highTask = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskPriority(highTask.id, 'high')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText('Filter by priority'),
      'high',
    )

    expect(screen.getByText('Review safety checklist')).toBeTruthy()
    expect(screen.queryByText(normalTask.title)).toBeNull()
  })
})


describe('WorkspaceRoot clear task filters', () => {
  it('clears search, status, and priority filters together', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    const review = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskStatus(review.id, 'done')
    commands.changeTaskPriority(review.id, 'high')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Search tasks'), 'safety')
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'done')
    await user.selectOptions(
      screen.getByLabelText('Filter by priority'),
      'high',
    )

    expect(screen.queryByText('Draft experiment plan')).toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Clear task filters' }),
    )

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(screen.getByText('Review safety checklist')).toBeTruthy()
    expect(
      (screen.getByLabelText('Search tasks') as HTMLInputElement).value,
    ).toBe('')
    expect(
      (screen.getByLabelText('Filter by status') as HTMLSelectElement).value,
    ).toBe('all')
    expect(
      (screen.getByLabelText('Filter by priority') as HTMLSelectElement).value,
    ).toBe('all')
  })
})


describe('WorkspaceRoot task due date', () => {
  it('lets a user set and clear a task due date', () => {
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText(
      'Due date for Draft experiment plan',
    ) as HTMLInputElement

    fireEvent.change(input, { target: { value: '2026-09-12' } })
    expect(store.getState().tasks[0]?.dueDate).toBe('2026-09-12')
    expect(input.value).toBe('2026-09-12')

    fireEvent.change(input, { target: { value: '' } })
    expect(store.getState().tasks[0]).not.toHaveProperty('dueDate')
    expect(input.value).toBe('')
  })
})


describe('WorkspaceRoot due date filter', () => {
  it('filters visible tasks by whether they have a due date', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    const unscheduled = commands.addTask(project.id, 'Draft experiment plan')
    const scheduled = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskDueDate(scheduled.id, '2026-09-12')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText('Filter by due date'),
      'withDueDate',
    )

    expect(screen.getByText(scheduled.title)).toBeTruthy()
    expect(screen.queryByText(unscheduled.title)).toBeNull()
  })
})


describe('WorkspaceRoot task sorting', () => {
  it('sorts visible tasks by title', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Zebra task')
    commands.addTask(project.id, 'Alpha task')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'title')

    const items = screen.getAllByRole('listitem')
    expect(items[0]?.textContent).toContain('Alpha task')
    expect(items[1]?.textContent).toContain('Zebra task')
  })
})
