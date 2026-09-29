import { describe, expect, it } from 'vitest'

import { createGoal } from './goal'
import { createProject } from './project'
import { createTask } from './task'
import { emptyWorkspace, workspaceReducer, type WorkspaceState } from './workspace'

function link(state: WorkspaceState, goalId: string, taskId: string): WorkspaceState {
  return workspaceReducer(state, { type: 'goal/taskLinked', goalId, taskId } as never)
}

function workspaceState(): WorkspaceState {
  const project1 = createProject({ id: 'project-1', name: 'Launch', now: '2026-09-28T12:00:00.000Z' })
  const project2 = createProject({ id: 'project-2', name: 'Keep', now: '2026-09-28T12:00:00.000Z' })
  const parent = createTask({ id: 'task-parent', projectId: project1.id, title: 'Parent', now: '2026-09-28T12:00:00.000Z' })
  const child = { ...createTask({ id: 'task-child', projectId: project1.id, title: 'Child', now: '2026-09-28T12:00:00.000Z' }), parentTaskId: parent.id }
  const kept = createTask({ id: 'task-kept', projectId: project2.id, title: 'Kept', now: '2026-09-28T12:00:00.000Z' })
  const goal = createGoal({ id: 'goal-1', name: 'Ship beta', targetType: 'linkedTasks', targetValue: 3, currentValue: 0 })
  return { ...emptyWorkspace, projects: [project1, project2], tasks: [parent, child, kept], goals: [goal] }
}

describe('Goal linkage cleanup on Task deletion', () => {
  it('removes links for every Task deleted with a subtree', () => {
    let state = workspaceState()
    state = link(state, 'goal-1', 'task-parent')
    state = link(state, 'goal-1', 'task-child')
    const next = workspaceReducer(state, { type: 'task/deleted', taskId: 'task-parent' })
    expect(next.goals?.[0]?.linkedTaskIds).toBeUndefined()
  })

  it('removes only links for Tasks deleted with a Project', () => {
    let state = workspaceState()
    state = link(state, 'goal-1', 'task-child')
    state = link(state, 'goal-1', 'task-kept')
    const next = workspaceReducer(state, { type: 'project/deleted', projectId: 'project-1' })
    expect(next.goals?.[0]?.linkedTaskIds).toEqual(['task-kept'])
  })
})
