import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import {
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState,
} from '../domain/workspace'
import { createWorkspaceCommands } from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: WorkspaceAction) {
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

describe('Workspace commands Gantt exact range translation', () => {
  it('moves schedules backward safely and schedules unscheduled Tasks only from two explicit dates', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-06T00:30:00.000Z',
    })
    const scheduled = {
      ...createTask({
        id: 'task-scheduled',
        projectId: project.id,
        title: 'Scheduled',
        now: '2026-10-06T00:31:00.000Z',
      }),
      startDate: '2026-10-20',
      dueDate: '2026-10-22',
    }
    const unscheduled = createTask({
      id: 'task-unscheduled',
      projectId: project.id,
      title: 'Unscheduled',
      now: '2026-10-06T00:32:00.000Z',
    })
    const store = new ReducerStore({
      projects: [project],
      tasks: [scheduled, unscheduled],
    })
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-10-06T00:33:00.000Z',
    })

    commands.changeTaskGanttSchedule(
      scheduled.id,
      '2026-10-01',
      '2026-10-03',
    )
    expect(store.getState().tasks[0]).toMatchObject({
      startDate: '2026-10-01',
      dueDate: '2026-10-03',
    })
    expect(
      store.getState().activity?.slice(-2).map((entry) => entry.event.kind),
    ).toEqual(['task.startDateChanged', 'task.dueDateChanged'])

    commands.changeTaskGanttSchedule(
      unscheduled.id,
      '2026-10-14',
      '2026-10-14',
    )
    expect(store.getState().tasks[1]).toMatchObject({
      startDate: '2026-10-14',
      dueDate: '2026-10-14',
    })

    expect(() =>
      commands.changeTaskGanttSchedule(
        unscheduled.id,
        '2026-10-16',
        '2026-10-15',
      ),
    ).toThrow('Task due date must not be before start date')
    expect(store.getState().tasks[1]).toMatchObject({
      startDate: '2026-10-14',
      dueDate: '2026-10-14',
    })
  })
})
