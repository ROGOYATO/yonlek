/** @vitest-environment jsdom */

import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import { createGoal } from './domain/goal'
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

afterEach(() => cleanup())

describe('WorkspaceRoot Dashboard integration', () => {
  it('renders one report-date snapshot and reacts to accepted Workspace changes', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-03T08:00:00.000Z',
    })
    const overdue = {
      ...createTask({
        id: 'task-overdue',
        projectId: project.id,
        title: 'Overdue task',
        now: '2026-10-03T08:01:00.000Z',
      }),
      dueDate: '2026-10-03',
    }
    const done = {
      ...createTask({
        id: 'task-done',
        projectId: project.id,
        title: 'Done task',
        now: '2026-10-03T08:02:00.000Z',
      }),
      status: 'done' as const,
    }
    const goal = createGoal({
      id: 'goal-1',
      name: 'Adoption',
      targetType: 'manual',
      targetValue: 100,
      currentValue: 40,
    })

    const storage = new MemoryStore()
    saveWorkspace(storage, {
      projects: [project],
      tasks: [overdue, done],
      goals: [goal],
    })
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-10-04T09:00:00.000Z',
    })

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        dashboardReportDate="2026-10-04"
      />,
    )

    const completed = within(screen.getByRole('article', { name: 'Completed Tasks' }))
    const overdueKpi = within(screen.getByRole('article', { name: 'Overdue Tasks' }))
    expect(completed.getByText('1')).toBeTruthy()
    expect(overdueKpi.getByText('1')).toBeTruthy()
    expect(screen.getByText('Launch: 1 / 2 (50%)')).toBeTruthy()
    expect(screen.getByText('Adoption: 40 / 100 (40%)')).toBeTruthy()

    act(() => {
      commands.changeTaskStatus(overdue.id, 'done')
    })

    expect(completed.getByText('2')).toBeTruthy()
    expect(overdueKpi.getByText('0')).toBeTruthy()
    expect(screen.getByText('Launch: 2 / 2 (100%)')).toBeTruthy()
  })
})
