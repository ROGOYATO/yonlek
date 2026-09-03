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
