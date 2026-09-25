import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createSubtask, createTask } from '../domain/task'
import {
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState,
} from '../domain/workspace'
import { createWorkspaceCommands } from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState
  dispatches = 0

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: WorkspaceAction) {
    this.dispatches += 1
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-23T08:00:00.000Z',
})

function runtime(nextId = 'task-next') {
  return {
    nextId: () => nextId,
    now: () => '2026-09-23T10:00:00.000Z',
  }
}

describe('Workspace commands multi-Task Activity', () => {
  it('records every changed Task in pre-mutation Workspace order for subtree archive', () => {
    const parent = createTask({
      id: 'task-parent',
      projectId: project.id,
      title: 'Parent',
      now: '2026-09-23T08:05:00.000Z',
    })
    const child = createSubtask({
      id: 'task-child',
      parent,
      title: 'Child',
      now: '2026-09-23T08:06:00.000Z',
    })
    const store = new ReducerStore({ projects: [project], tasks: [parent, child] })
    const commands = createWorkspaceCommands(store, runtime())

    commands.archiveTask(parent.id)

    expect(store.dispatches).toBe(1)
    expect(store.getState().activity?.map((entry) => ({
      taskId: entry.taskId,
      kind: entry.event.kind,
      sequence: entry.sequence,
    }))).toEqual([
      { taskId: parent.id, kind: 'task.archived', sequence: 1 },
      { taskId: child.id, kind: 'task.archived', sequence: 2 },
    ])
  })

  it('deduplicates bulk caller ids while keeping Workspace Task order', () => {
    const first = createTask({
      id: 'task-a', projectId: project.id, title: 'First', now: '2026-09-23T08:05:00.000Z',
    })
    const second = createTask({
      id: 'task-b', projectId: project.id, title: 'Second', now: '2026-09-23T08:06:00.000Z',
    })
    const store = new ReducerStore({ projects: [project], tasks: [first, second] })
    const commands = createWorkspaceCommands(store, runtime())

    commands.changeTasksStatus([second.id, first.id, second.id], 'done')

    expect(store.dispatches).toBe(1)
    expect(store.getState().activity?.map((entry) => entry.taskId)).toEqual([first.id, second.id])
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.statusChanged',
    ])
  })

  it('records recurring completion before the generated occurrence with one timestamp', () => {
    const recurring = {
      ...createTask({
        id: 'task-recurring',
        projectId: project.id,
        title: 'Daily check',
        now: '2026-09-23T08:05:00.000Z',
      }),
      dueDate: '2026-09-24',
      recurrence: { unit: 'day' as const, interval: 1 },
    }
    const store = new ReducerStore({ projects: [project], tasks: [recurring] })
    const commands = createWorkspaceCommands(store, runtime('task-next'))

    commands.changeTaskStatus(recurring.id, 'done')

    expect(store.dispatches).toBe(1)
    expect(store.getState().tasks.map((task) => task.id)).toEqual([
      recurring.id,
      'task-next',
    ])
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.created',
    ])
    expect(new Set(store.getState().activity?.map((entry) => entry.occurredAt))).toEqual(
      new Set(['2026-09-23T10:00:00.000Z']),
    )
  })

  it('keeps deletion history when deleting a Project removes its Tasks', () => {
    const first = createTask({
      id: 'task-a', projectId: project.id, title: 'First', now: '2026-09-23T08:05:00.000Z',
    })
    const second = createTask({
      id: 'task-b', projectId: project.id, title: 'Second', now: '2026-09-23T08:06:00.000Z',
    })
    const store = new ReducerStore({ projects: [project], tasks: [first, second] })
    const commands = createWorkspaceCommands(store, runtime())

    commands.deleteProject(project.id)

    expect(store.getState().projects).toEqual([])
    expect(store.getState().tasks).toEqual([])
    expect(store.getState().activity?.map((entry) => ({
      taskId: entry.taskId,
      taskTitle: entry.taskTitle,
      kind: entry.event.kind,
    }))).toEqual([
      { taskId: first.id, taskTitle: 'First', kind: 'task.deleted' },
      { taskId: second.id, taskTitle: 'Second', kind: 'task.deleted' },
    ])
  })
})
