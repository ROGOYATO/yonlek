/** @vitest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import type { KeyValueStore } from './persistence/workspace-storage'
import { createDefaultViewPreferences } from './domain/view-preferences'
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
    expect(store.getState().projects).toEqual([])
    expect(store.getState().tasks).toEqual([])
    expect(
      store.getState().activity?.map((entry) => ({
        taskId: entry.taskId,
        kind: entry.event.kind,
      })),
    ).toEqual([
      { taskId: 'task-1', kind: 'task.created' },
      { taskId: 'task-1', kind: 'task.deleted' },
    ])
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


describe('WorkspaceRoot task description', () => {
  it('lets a user set and clear a task description', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText(
      'Description for Draft experiment plan',
    )
    await user.type(input, 'Prepare the camera calibration procedure.')
    await user.click(
      screen.getByRole('button', {
        name: 'Save description for Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]?.description).toBe(
      'Prepare the camera calibration procedure.',
    )
    expect(
      screen.getByText('Prepare the camera calibration procedure.'),
    ).toBeTruthy()

    await user.clear(
      screen.getByLabelText('Description for Draft experiment plan'),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Save description for Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]).not.toHaveProperty('description')
  })
})


describe('WorkspaceRoot description search', () => {
  it('finds a task when the query only appears in its description', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    commands.changeTaskDescription(
      task.id,
      'Prepare the camera calibration procedure.',
    )
    commands.addTask(project.id, 'Review safety checklist')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Search tasks'), 'calibration')

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(screen.queryByText('Review safety checklist')).toBeNull()
  })
})


describe('WorkspaceRoot priority sorting', () => {
  it('sorts visible tasks by priority', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    const low = commands.addTask(project.id, 'Low priority task')
    commands.changeTaskPriority(low.id, 'low')
    const high = commands.addTask(project.id, 'High priority task')
    commands.changeTaskPriority(high.id, 'high')
    const normal = commands.addTask(project.id, 'Normal priority task')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'priority')

    const items = screen.getAllByRole('listitem')
    expect(items[0]?.textContent).toContain('High priority task')
    expect(items[1]?.textContent).toContain('Normal priority task')
    expect(items[2]?.textContent).toContain('Low priority task')
    expect(store.getState().tasks.map((task) => task.id)).toEqual([
      low.id,
      high.id,
      normal.id,
    ])
  })
})


describe('WorkspaceRoot project task summary', () => {
  it('shows project completion counts and updates them with task status', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    const doing = commands.addTask(project.id, 'Run camera calibration')
    const done = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskStatus(doing.id, 'doing')
    commands.changeTaskStatus(done.id, 'done')

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('1 of 3 tasks done')).toBeTruthy()

    await user.selectOptions(
      screen.getByLabelText('Status for Run camera calibration'),
      'done',
    )

    expect(screen.getByText('2 of 3 tasks done')).toBeTruthy()
  })
})


describe('WorkspaceRoot project focus', () => {
  it('shows one selected project and keeps focus when that project is renamed', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    commands.addTask(robotics.id, 'Draft experiment plan')
    commands.addTask(field.id, 'Inspect test site')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('View project'), field.id)

    expect(
      screen.queryByRole('heading', { name: 'Robotics Research' }),
    ).toBeNull()
    expect(screen.getByRole('heading', { name: 'Field Tests' })).toBeTruthy()

    await act(async () => {
      commands.renameProject(field.id, 'Outdoor Trials')
    })

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe(field.id)
    expect(screen.getByRole('heading', { name: 'Outdoor Trials' })).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Robotics Research' }),
    ).toBeNull()
  })
})


describe('WorkspaceRoot project focus deletion', () => {
  it('falls back to all projects when the selected project is deleted', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('View project'), field.id)
    await user.click(
      screen.getByRole('button', { name: 'Delete project Field Tests' }),
    )

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe('all')
    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
  })
})


describe('WorkspaceRoot project selector counts', () => {
  it('shows task counts in project choices', () => {
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    commands.addProject('Field Tests')
    commands.addTask(robotics.id, 'Draft experiment plan')
    commands.addTask(robotics.id, 'Review safety checklist')

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(
      screen.getByRole('option', { name: 'Robotics Research (2 tasks)' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Field Tests (0 tasks)' }),
    ).toBeTruthy()
  })
})


describe('WorkspaceRoot visible task count', () => {
  it('shows how many project tasks remain visible after filtering', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    const high = commands.addTask(project.id, 'Review safety checklist')
    commands.changeTaskPriority(high.id, 'high')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'high')

    expect(screen.getByText('Showing 1 of 2 tasks')).toBeTruthy()
  })
})


describe('WorkspaceRoot workspace summary', () => {
  it('shows aggregate project, task, and completed-task counts', () => {
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    const done = commands.addTask(robotics.id, 'Review safety checklist')
    commands.addTask(field.id, 'Inspect test site')
    commands.changeTaskStatus(done.id, 'done')

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('2 projects · 2 tasks · 1 done')).toBeTruthy()
  })
})


describe('WorkspaceRoot initial view preferences', () => {
  it('starts with the supplied project focus, filters, query, and sort', () => {
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    commands.addTask(robotics.id, 'Draft experiment plan')
    commands.addTask(field.id, 'Inspect test site')

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={{
          ...createDefaultViewPreferences(),
          projectView: field.id,
          query: 'inspect',
          status: 'todo',
          priority: 'normal',
          dueDate: 'withoutDueDate',
          sort: 'title',
        }}
      />,
    )

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe(field.id)
    expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe(
      'inspect',
    )
    expect(
      (screen.getByLabelText('Filter by status') as HTMLSelectElement).value,
    ).toBe('todo')
    expect(
      (screen.getByLabelText('Filter by priority') as HTMLSelectElement).value,
    ).toBe('normal')
    expect(
      (screen.getByLabelText('Filter by due date') as HTMLSelectElement).value,
    ).toBe('withoutDueDate')
    expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
      'title',
    )
    expect(screen.getByRole('heading', { name: 'Field Tests' })).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Robotics Research' }),
    ).toBeNull()
    expect(screen.getByText('Inspect test site')).toBeTruthy()
  })
})


describe('WorkspaceRoot view preference changes', () => {
  it('reports updated view preferences without changing workspace state', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const onViewPreferencesChange = vi.fn()
    const initialState = store.getState()

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        onViewPreferencesChange={onViewPreferencesChange}
      />,
    )

    await user.type(screen.getByLabelText('Search tasks'), 'safety')
    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'priority')

    expect(onViewPreferencesChange).toHaveBeenLastCalledWith({
      ...createDefaultViewPreferences(),
      query: 'safety',
      sort: 'priority',
    })
    expect(store.getState()).toBe(initialState)
  })
})


describe('WorkspaceRoot task project movement', () => {
  it('lets a user move a task between project sections', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    const task = commands.addTask(robotics.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText('Project for Draft experiment plan'),
      field.id,
    )

    expect(store.getState().tasks[0]?.projectId).toBe(field.id)

    const roboticsSection = screen
      .getByRole('heading', { name: 'Robotics Research' })
      .closest('section')
    const fieldSection = screen
      .getByRole('heading', { name: 'Field Tests' })
      .closest('section')

    expect(roboticsSection).not.toBeNull()
    expect(fieldSection).not.toBeNull()
    expect(within(roboticsSection!).queryByText(task.title)).toBeNull()
    expect(within(fieldSection!).getByText(task.title)).toBeTruthy()
  })

  it('keeps project focus while a moved task leaves that project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    commands.addTask(robotics.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('View project'), robotics.id)
    await user.selectOptions(
      screen.getByLabelText('Project for Draft experiment plan'),
      field.id,
    )

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe(robotics.id)
    expect(screen.queryByText('Draft experiment plan')).toBeNull()
    expect(screen.getByText('Showing 0 of 0 tasks')).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Robotics Research (0 tasks)' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Field Tests (1 tasks)' }),
    ).toBeTruthy()
  })
})


describe('WorkspaceRoot project description', () => {
  it('lets a user set and clear a project description', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText('Description for Robotics Research')
    await user.type(input, 'Camera-guided robotics experiments.')
    await user.click(
      screen.getByRole('button', {
        name: 'Save project description for Robotics Research',
      }),
    )

    expect(store.getState().projects[0]?.description).toBe(
      'Camera-guided robotics experiments.',
    )
    expect(
      (screen.getByLabelText(
        'Description for Robotics Research',
      ) as HTMLTextAreaElement).value,
    ).toBe('Camera-guided robotics experiments.')

    await user.clear(
      screen.getByLabelText('Description for Robotics Research'),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Save project description for Robotics Research',
      }),
    )

    expect(store.getState().projects[0]).not.toHaveProperty('description')
  })
})


describe('WorkspaceRoot areas', () => {
  function createAreaApplication() {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['area-1', 'project-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T19:30:00.000Z',
    })

    return { store, commands }
  }

  it('lets a user create, rename, and delete an area', async () => {
    const user = userEvent.setup()
    const { store, commands } = createAreaApplication()

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Area name'), 'Engineering')
    await user.click(screen.getByRole('button', { name: 'Add area' }))

    expect(store.getState().areas?.[0]?.name).toBe('Engineering')

    const input = screen.getByLabelText('Name for area Engineering')
    await user.clear(input)
    await user.type(input, 'Robotics')
    await user.click(
      screen.getByRole('button', { name: 'Save area name for Engineering' }),
    )

    expect(store.getState().areas?.[0]?.name).toBe('Robotics')

    await user.click(
      screen.getByRole('button', { name: 'Delete area Robotics' }),
    )

    expect(store.getState().areas).toEqual([])
  })

  it('lets a user assign and unassign a project from an area', async () => {
    const user = userEvent.setup()
    const { store, commands } = createAreaApplication()
    const area = commands.addArea('Engineering')
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const select = screen.getByLabelText('Area for Robotics Research')

    await user.selectOptions(select, area.id)
    expect(store.getState().projects[0]?.areaId).toBe(area.id)

    await user.selectOptions(select, '')
    expect(store.getState().projects[0]).not.toHaveProperty('areaId')
  })
})


describe('WorkspaceRoot area summaries', () => {
  it('shows how many projects belong to each area', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['area-1', 'area-2', 'project-1', 'project-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T19:50:00.000Z',
    })
    const engineering = commands.addArea('Engineering')
    commands.addArea('Operations')
    const robotics = commands.addProject('Robotics Research')
    commands.addProject('Field Tests')
    commands.changeProjectArea(robotics.id, engineering.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Engineering (1 project)')).toBeTruthy()
    expect(screen.getByText('Operations (0 projects)')).toBeTruthy()
  })
})


describe('WorkspaceRoot lists', () => {
  it('lets a user create, rename, and delete a list inside a project', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'list-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T03:50:00.000Z',
    })
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText('List name for Robotics Research'),
      'Backlog',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add list to Robotics Research' }),
    )

    expect(store.getState().lists?.[0]?.name).toBe('Backlog')

    const input = screen.getByLabelText('Name for list Backlog')
    await user.clear(input)
    await user.type(input, 'Sprint 1')
    await user.click(
      screen.getByRole('button', { name: 'Save list name for Backlog' }),
    )

    expect(store.getState().lists?.[0]?.name).toBe('Sprint 1')

    await user.click(
      screen.getByRole('button', { name: 'Delete list Sprint 1' }),
    )
    expect(store.getState().lists).toEqual([])
  })

  it('assigns tasks only to lists from their own project', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'project-2',
      'list-1',
      'list-2',
      'task-1',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T03:51:00.000Z',
    })
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    const backlog = commands.addTaskList(robotics.id, 'Backlog')
    commands.addTaskList(field.id, 'Field Queue')
    const task = commands.addTask(robotics.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const select = screen.getByLabelText('List for Draft experiment plan')

    expect(within(select).getByRole('option', { name: 'Backlog' })).toBeTruthy()
    expect(
      within(select).queryByRole('option', { name: 'Field Queue' }),
    ).toBeNull()

    await user.selectOptions(select, backlog.id)
    expect(store.getState().tasks[0]?.listId).toBe(backlog.id)

    await user.selectOptions(select, '')
    expect(store.getState().tasks[0]).not.toHaveProperty('listId')
    expect(task.projectId).toBe(robotics.id)
  })
})


describe('WorkspaceRoot list summaries', () => {
  it('shows how many tasks belong to each list', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'list-1', 'list-2', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T04:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const backlog = commands.addTaskList(project.id, 'Backlog')
    commands.addTaskList(project.id, 'Sprint 1')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    commands.changeTaskList(task.id, backlog.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Backlog (1 task)')).toBeTruthy()
    expect(screen.getByText('Sprint 1 (0 tasks)')).toBeTruthy()
  })
})


it('lets a user create a task directly in a selected list', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  const store = createWorkspaceStore(storage)
  const ids = ['project-1', 'list-1', 'task-1']
  const commands = createWorkspaceCommands(store, {
    nextId: () => ids.shift() ?? 'unexpected-id',
    now: () => '2026-09-04T04:21:00.000Z',
  })
  const project = commands.addProject('Robotics Research')
  const list = commands.addTaskList(project.id, 'Backlog')

  render(<WorkspaceRoot store={store} commands={commands} />)

  await user.selectOptions(
    screen.getByLabelText('List for new task in Robotics Research'),
    list.id,
  )
  await user.type(
    screen.getByLabelText('Task title for Robotics Research'),
    'Draft experiment plan',
  )
  await user.click(screen.getByRole('button', { name: 'Add task' }))

  expect(store.getState().tasks[0]?.listId).toBe(list.id)
})


describe('WorkspaceRoot subtasks', () => {
  it('lets a user create a subtask from an existing task', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'list-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:00:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const list = commands.addTaskList(project.id, 'Backlog')
    const parent = commands.addTask(
      project.id,
      'Draft experiment plan',
      list.id,
    )

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText('Subtask title for Draft experiment plan'),
      'Calibrate camera',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add subtask to Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[1]).toMatchObject({
      parentTaskId: parent.id,
      projectId: project.id,
      listId: list.id,
      title: 'Calibrate camera',
    })
  })

  it('shows the parent relationship while keeping normal task controls', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:01:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const parent = commands.addTask(project.id, 'Draft experiment plan')
    commands.addSubtask(parent.id, 'Calibrate camera')

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Subtask of Draft experiment plan')).toBeTruthy()
    expect(screen.getByLabelText('Status for Calibrate camera')).toBeTruthy()
    expect(screen.getByLabelText('Priority for Calibrate camera')).toBeTruthy()
  })
})


describe('WorkspaceRoot subtask summaries', () => {
  it('shows immediate subtask counts for each task', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const parent = commands.addTask(project.id, 'Draft experiment plan')
    commands.addSubtask(parent.id, 'Calibrate camera')

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(
      screen.getByLabelText('Subtask count for Draft experiment plan').textContent,
    ).toBe('1 subtask')
    expect(screen.getByText('Calibrate camera')).toBeTruthy()
    expect(
      screen.getByLabelText('Subtask count for Calibrate camera').textContent,
    ).toBe('0 subtasks')
  })
})


describe('WorkspaceRoot checklists', () => {
  it('lets a user add, complete, and delete a checklist item', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'check-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:50:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText('Checklist item for Draft experiment plan'),
      'Review safety notes',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add checklist item to Draft experiment plan',
      }),
    )

    expect(screen.getByText('Review safety notes')).toBeTruthy()

    const checkbox = screen.getByLabelText(
      'Checklist item Review safety notes complete',
    )
    await user.click(checkbox)

    expect(store.getState().tasks[0]?.checklist?.[0]?.completed).toBe(true)

    await user.click(
      screen.getByRole('button', {
        name: 'Delete checklist item Review safety notes from Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]).not.toHaveProperty('checklist')
  })

  it('lets a user rename a checklist item', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'check-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:51:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    commands.addChecklistItem(task.id, 'Review safety notes')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText(
      'Checklist text for Review safety notes in Draft experiment plan',
    )
    await user.clear(input)
    await user.type(input, 'Confirm camera mount')
    await user.click(
      screen.getByRole('button', {
        name: 'Save checklist item Review safety notes',
      }),
    )

    expect(store.getState().tasks[0]?.checklist?.[0]?.text).toBe(
      'Confirm camera mount',
    )
    expect(screen.getByText('Confirm camera mount')).toBeTruthy()
  })
})


describe('WorkspaceRoot checklist progress', () => {
  it('shows completed and total checklist item counts without changing the task title', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'check-1', 'check-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T06:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    const first = commands.addChecklistItem(task.id, 'Review safety notes')
    commands.addChecklistItem(task.id, 'Confirm camera mount')
    commands.changeChecklistItemCompleted(task.id, first.id, true)

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(
      screen.getByLabelText('Checklist progress for Draft experiment plan')
        .textContent,
    ).toBe('1/2 checklist items complete')
  })
})


describe('WorkspaceRoot manual ordering', () => {
  it('lets a user reorder areas and projects within their sibling scopes', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'area-1',
      'area-2',
      'project-1',
      'project-2',
      'project-3',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:00:00.000Z',
    })
    const engineering = commands.addArea('Engineering')
    const operations = commands.addArea('Operations')
    const first = commands.addProject('Robotics Research')
    commands.addProject('Unassigned')
    const second = commands.addProject('Controls')
    commands.changeProjectArea(first.id, engineering.id)
    commands.changeProjectArea(second.id, engineering.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', { name: 'Move area Operations up' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Move project Controls up' }),
    )

    expect(store.getState().areas?.map((area) => area.id)).toEqual([
      operations.id,
      engineering.id,
    ])
    expect(store.getState().projects.map((project) => project.id)).toEqual([
      second.id,
      'project-2',
      first.id,
    ])
  })

  it('lets a user choose Manual task sort and reorder lists and sibling tasks', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'list-1',
      'list-2',
      'task-1',
      'task-2',
      'task-3',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:01:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const firstList = commands.addTaskList(project.id, 'Backlog')
    const secondList = commands.addTaskList(project.id, 'Sprint 1')
    const firstTask = commands.addTask(
      project.id,
      'Draft experiment plan',
      firstList.id,
    )
    const secondTask = commands.addTask(
      project.id,
      'Calibrate camera',
      firstList.id,
    )
    commands.addTask(project.id, 'Unrelated', secondList.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'manual')
    await user.click(
      screen.getByRole('button', { name: 'Move list Sprint 1 up' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Move task Calibrate camera up' }),
    )

    expect(store.getState().lists?.map((list) => list.id)).toEqual([
      secondList.id,
      firstList.id,
    ])
    expect(store.getState().tasks.map((task) => task.id)).toEqual([
      secondTask.id,
      firstTask.id,
      'task-3',
    ])
  })

  it('lets a user reorder checklist items without changing the task title', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'check-1',
      'check-2',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:02:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    const first = commands.addChecklistItem(
      task.id,
      'Review safety notes',
    )
    const second = commands.addChecklistItem(
      task.id,
      'Confirm camera mount',
    )

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Move checklist item Confirm camera mount up in Draft experiment plan',
      }),
    )

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(
      store.getState().tasks[0]?.checklist?.map((item) => item.id),
    ).toEqual([second.id, first.id])
  })
})


describe('WorkspaceRoot tags', () => {
  it('lets a user create rename and delete a workspace tag', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['tag-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:50:00.000Z',
    })

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Tag name'), 'Safety')
    await user.click(screen.getByRole('button', { name: 'Add tag' }))

    expect(store.getState().tags?.[0]?.name).toBe('Safety')

    const input = screen.getByLabelText('Name for tag Safety')
    await user.clear(input)
    await user.type(input, 'Camera')
    await user.click(
      screen.getByRole('button', { name: 'Save tag name for Safety' }),
    )

    expect(store.getState().tags?.[0]?.name).toBe('Camera')

    await user.click(
      screen.getByRole('button', { name: 'Delete tag Camera' }),
    )
    expect(store.getState()).not.toHaveProperty('tags')
  })

  it('lets a user assign and remove a tag without changing the task title', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['tag-1', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:51:00.000Z',
    })
    const tag = commands.addTag('Safety')
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const checkbox = screen.getByLabelText(
      'Tag Safety for Draft experiment plan',
    )

    await user.click(checkbox)

    expect(store.getState().tasks[0]?.tagIds).toEqual([tag.id])
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()

    await user.click(checkbox)

    expect(store.getState().tasks[0]).not.toHaveProperty('tagIds')
    expect(task.title).toBe('Draft experiment plan')
  })
})


describe('WorkspaceRoot people and assignees', () => {
  it('lets a user create rename and delete a local person', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['person-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T08:50:00.000Z',
    })

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Person name'), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: 'Add person' }))

    expect(store.getState().people?.[0]?.name).toBe('Ada Lovelace')

    const input = screen.getByLabelText('Name for person Ada Lovelace')
    await user.clear(input)
    await user.type(input, 'Grace Hopper')
    await user.click(
      screen.getByRole('button', {
        name: 'Save person name for Ada Lovelace',
      }),
    )

    expect(store.getState().people?.[0]?.name).toBe('Grace Hopper')

    await user.click(
      screen.getByRole('button', { name: 'Delete person Grace Hopper' }),
    )

    expect(store.getState()).not.toHaveProperty('people')
  })

  it('lets a user assign and remove people without changing the task title', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['person-1', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T08:51:00.000Z',
    })
    const person = commands.addPerson('Ada Lovelace')
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const checkbox = screen.getByLabelText(
      'Assignee Ada Lovelace for Draft experiment plan',
    )

    await user.click(checkbox)

    expect(store.getState().tasks[0]?.assigneeIds).toEqual([person.id])
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()

    await user.click(checkbox)

    expect(store.getState().tasks[0]).not.toHaveProperty('assigneeIds')
  })
})


describe('WorkspaceRoot custom fields', () => {
  it('lets a user create rename and delete a custom field definition', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['field-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T09:50:00.000Z',
    })

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Custom field name'), 'Notes')
    await user.selectOptions(
      screen.getByLabelText('Custom field type'),
      'text',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add custom field' }),
    )

    expect(store.getState().customFields?.[0]).toMatchObject({
      name: 'Notes',
      type: 'text',
    })

    const input = screen.getByLabelText('Name for custom field Notes')
    await user.clear(input)
    await user.type(input, 'Findings')
    await user.click(
      screen.getByRole('button', {
        name: 'Save custom field name for Notes',
      }),
    )

    expect(store.getState().customFields?.[0]?.name).toBe('Findings')

    await user.click(
      screen.getByRole('button', {
        name: 'Delete custom field Findings',
      }),
    )

    expect(store.getState()).not.toHaveProperty('customFields')
  })

  it('lets a user edit text number and checkbox values without changing the task title', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'field-text',
      'field-number',
      'field-checkbox',
      'project-1',
      'task-1',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T09:51:00.000Z',
    })
    const notes = commands.addCustomField('Notes', 'text')
    const estimate = commands.addCustomField('Estimate', 'number')
    const reviewed = commands.addCustomField('Reviewed', 'checkbox')
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText(
        'Custom field Notes for Draft experiment plan',
      ),
      'Inspect mount',
    )
    await user.type(
      screen.getByLabelText(
        'Custom field Estimate for Draft experiment plan',
      ),
      '3.5',
    )
    await user.click(
      screen.getByLabelText(
        'Custom field Reviewed for Draft experiment plan',
      ),
    )

    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      [notes.id]: 'Inspect mount',
      [estimate.id]: 3.5,
      [reviewed.id]: true,
    })
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
  })

  it('clears text and number custom field values from the task', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['field-text', 'field-number', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T09:52:00.000Z',
    })
    const notes = commands.addCustomField('Notes', 'text')
    const estimate = commands.addCustomField('Estimate', 'number')
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    commands.changeTaskCustomFieldValue(task.id, notes.id, 'Inspect')
    commands.changeTaskCustomFieldValue(task.id, estimate.id, 2)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.clear(
      screen.getByLabelText(
        'Custom field Notes for Draft experiment plan',
      ),
    )
    await user.clear(
      screen.getByLabelText(
        'Custom field Estimate for Draft experiment plan',
      ),
    )

    expect(store.getState().tasks[0]).not.toHaveProperty(
      'customFieldValues',
    )
  })
})

describe('WorkspaceRoot task relationships', () => {
  it('lets a user create a Blocks relationship from one task to another', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2', 'relationship-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T11:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    commands.addTask(project.id, 'Calibrate camera')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText(
        'Relationship target from Draft experiment plan',
      ),
      'task-2',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add relationship from Draft experiment plan',
      }),
    )

    expect(screen.getByText('Blocks Calibrate camera')).toBeTruthy()
    expect(screen.getByText('Blocked by Draft experiment plan')).toBeTruthy()
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
  })

  it('lets a user create and delete a Related relationship', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2', 'relationship-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T11:11:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    commands.addTask(project.id, 'Calibrate camera')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(
      screen.getByLabelText(
        'Relationship type from Draft experiment plan',
      ),
      'related',
    )
    await user.selectOptions(
      screen.getByLabelText(
        'Relationship target from Draft experiment plan',
      ),
      'task-2',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add relationship from Draft experiment plan',
      }),
    )

    expect(screen.getAllByText(/Related to/)).toHaveLength(2)

    await user.click(
      screen.getByRole('button', {
        name: 'Delete relationship relationship-1',
      }),
    )

    expect(store.getState()).not.toHaveProperty('relationships')
  })
})

describe('WorkspaceRoot relationship summaries', () => {
  it('shows Blocks Blocked-by and Related counts separately from the task title', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'task-2',
      'task-3',
      'relationship-1',
      'relationship-2',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T11:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const first = commands.addTask(project.id, 'Draft experiment plan')
    const second = commands.addTask(project.id, 'Calibrate camera')
    const third = commands.addTask(project.id, 'Run experiment')
    commands.addTaskRelationship('blocks', first.id, second.id)
    commands.addTaskRelationship('related', first.id, third.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(
      screen.getByLabelText(
        'Relationship summary for Draft experiment plan',
      ).textContent,
    ).toBe('Blocks 1; Blocked by 0; Related 1')
  })
})


describe('WorkspaceRoot task duplication', () => {
  it('lets a user duplicate a task from its task controls', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2']
    const timestamps = [
      '2026-09-04T12:50:00.000Z',
      '2026-09-04T12:51:00.000Z',
      '2026-09-04T12:52:00.000Z',
      '2026-09-04T12:53:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })
    const project = commands.addProject('Robotics Research')
    const source = commands.addTask(project.id, 'Draft experiment plan')
    commands.changeTaskPriority(source.id, 'high')
    commands.changeTaskDescription(source.id, 'Inspect the camera mount.')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Duplicate task Draft experiment plan',
      }),
    )

    expect(store.getState().tasks).toHaveLength(2)
    expect(store.getState().tasks[1]).toMatchObject({
      id: 'task-2',
      title: 'Draft experiment plan',
      priority: 'high',
      description: 'Inspect the camera mount.',
    })
    expect(screen.getAllByText('Draft experiment plan')).toHaveLength(2)
  })
})


describe('WorkspaceRoot task archive lifecycle', () => {
  it('hides an archived task from active counts and restores it from the archive', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const timestamps = [
      '2026-09-04T18:40:00.000Z',
      '2026-09-04T18:41:00.000Z',
      '2026-09-04T18:42:00.000Z',
      '2026-09-04T18:43:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Archive task Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]?.archivedAt).toBe(
      '2026-09-04T18:42:00.000Z',
    )
    expect(screen.getByText('1 project · 0 tasks · 0 done')).toBeTruthy()
    expect(
      screen.queryByRole('button', {
        name: 'Archive task Draft experiment plan',
      }),
    ).toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Restore task Draft experiment plan',
      }),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Restore task Draft experiment plan',
      }),
    )

    expect(store.getState().tasks[0]).not.toHaveProperty('archivedAt')
    expect(screen.getByText('1 project · 1 task · 0 done')).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: 'Archive task Draft experiment plan',
      }),
    ).toBeTruthy()
  })
})
