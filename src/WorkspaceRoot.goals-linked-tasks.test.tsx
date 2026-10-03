/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import { createGoal, linkGoalTask } from './domain/goal'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { WorkspaceRoot } from './WorkspaceRoot'
import { saveWorkspace, type KeyValueStore } from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-29T10:00:00.000Z',
})
const doneTask = {
  ...createTask({
    id: 'task-done',
    projectId: project.id,
    title: 'Done task',
    now: '2026-09-29T10:01:00.000Z',
  }),
  status: 'done' as const,
}
const todoTask = createTask({
  id: 'task-todo',
  projectId: project.id,
  title: 'Todo task',
  now: '2026-09-29T10:02:00.000Z',
})

function setup(goal = createGoal({
  id: 'goal-1',
  name: 'Launch goal',
  targetType: 'linkedTasks',
  targetValue: 0,
  currentValue: 0,
})) {
  const storage = new MemoryStore()
  saveWorkspace(storage, {
    projects: [project],
    tasks: [doneTask, todoTask],
    goals: [goal],
  })
  const store = createWorkspaceStore(storage)
  const commands = createWorkspaceCommands(store, {
    nextId: () => 'unused-id',
    now: () => '2026-09-29T10:30:00.000Z',
  })

  render(<WorkspaceRoot store={store} commands={commands} />)
  return { store }
}

afterEach(() => cleanup())

describe('WorkspaceRoot linked-Task Goals', () => {
  it('renders the linked Task completion summary', () => {
    const goal = linkGoalTask(
      linkGoalTask(
        createGoal({
          id: 'goal-1',
          name: 'Launch goal',
          targetType: 'linkedTasks',
          targetValue: 0,
          currentValue: 0,
        }),
        doneTask.id,
      ),
      todoTask.id,
    )

    setup(goal)

    expect(screen.getByText('Linked Tasks: 1 of 2 done')).toBeTruthy()
  })

  it('links and unlinks Tasks with Goal checkboxes', async () => {
    const user = userEvent.setup()
    const { store } = setup()
    const checkbox = screen.getByLabelText('Link Done task to Launch goal')

    expect((checkbox as HTMLInputElement).checked).toBe(false)
    await user.click(checkbox)
    expect(store.getState().goals?.[0]?.linkedTaskIds).toEqual([doneTask.id])
    expect(screen.getByText('Linked Tasks: 1 of 1 done')).toBeTruthy()

    await user.click(checkbox)
    expect(store.getState().goals?.[0]?.linkedTaskIds).toBeUndefined()
    expect(screen.getByText('Linked Tasks: 0 of 0 done')).toBeTruthy()
  })
})
