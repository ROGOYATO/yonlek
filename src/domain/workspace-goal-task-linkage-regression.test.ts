import { describe, expect, it } from 'vitest'

import { createGoal, validateGoal } from './goal'
import { createProject } from './project'
import { createTask } from './task'
import { emptyWorkspace, workspaceReducer, type WorkspaceState } from './workspace'

function initialWorkspace(): WorkspaceState {
  const project = createProject({ id: 'project-1', name: 'Launch', now: '2026-09-28T12:00:00.000Z' })
  const task1 = createTask({ id: 'task-1', projectId: project.id, title: 'Original', now: '2026-09-28T12:00:00.000Z' })
  const task2 = createTask({ id: 'task-2', projectId: project.id, title: 'Second', now: '2026-09-28T12:00:00.000Z' })
  const goal = createGoal({ id: 'goal-1', name: 'Ship beta', targetType: 'linkedTasks', targetValue: 2, currentValue: 0 })
  return { ...emptyWorkspace, projects: [project], tasks: [task1, task2], goals: [goal] }
}

describe('Goal Task linkage deterministic regression boundary', () => {
  it('deduplicates repeated links and preserves insertion order through Goal updates', () => {
    let state = initialWorkspace()
    state = workspaceReducer(state, { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'task-2' } as never)
    state = workspaceReducer(state, { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'task-1' } as never)
    state = workspaceReducer(state, { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'task-2' } as never)
    state = workspaceReducer(state, { type: 'goal/nameChanged', goalId: 'goal-1', name: 'Ship public beta' })
    state = workspaceReducer(state, { type: 'goal/valuesChanged', goalId: 'goal-1', targetValue: 4, currentValue: 1 })
    expect(state.goals?.[0]?.linkedTaskIds).toHaveLength(2)
    expect(state.goals?.[0]?.linkedTaskIds).toEqual(['task-2', 'task-1'])
  })

  it('rejects malformed persisted linkage IDs at the Goal validation boundary', () => {
    expect(() => validateGoal({ ...createGoal({ id: 'goal-1', name: 'Ship', targetType: 'linkedTasks', targetValue: 1, currentValue: 0 }), linkedTaskIds: ['task-1', 'task-1'] })).toThrow('Goal linked Task ids must be unique')
    expect(() => validateGoal({ ...createGoal({ id: 'goal-1', name: 'Ship', targetType: 'linkedTasks', targetValue: 1, currentValue: 0 }), linkedTaskIds: ['   '] })).toThrow('Goal linked Task id is required')
  })

  it('rejects adding a prelinked Goal when the linked Task is missing', () => {
    const state = initialWorkspace()
    const goal = { ...createGoal({ id: 'goal-prelinked', name: 'Prelinked', targetType: 'linkedTasks', targetValue: 1, currentValue: 0 }), linkedTaskIds: ['missing-task'] }
    expect(() => workspaceReducer(state, { type: 'goal/added', goal })).toThrow('Cannot add a Goal linked to a missing Task')
  })

  it('does not copy Goal links to duplicated or template-instantiated Tasks', () => {
    let state = initialWorkspace()
    state = workspaceReducer(state, { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'task-1' } as never)

    const duplicate = createTask({ id: 'task-copy', projectId: 'project-1', title: 'Original copy', now: '2026-09-28T12:01:00.000Z' })
    state = workspaceReducer(state, { type: 'task/added', task: duplicate })

    const templated = createTask({ id: 'task-template-copy', projectId: 'project-1', title: 'Template copy', now: '2026-09-28T12:02:00.000Z' })
    state = workspaceReducer(state, { type: 'taskTemplate/instantiated', tasks: [templated] })

    const project2 = createProject({ id: 'project-2', name: 'From template', now: '2026-09-28T12:03:00.000Z' })
    const projectTask = createTask({ id: 'project-template-copy', projectId: project2.id, title: 'Project copy', now: '2026-09-28T12:03:00.000Z' })
    state = workspaceReducer(state, { type: 'projectTemplate/instantiated', project: project2, lists: [], tasks: [projectTask] })

    expect(state.goals?.[0]?.linkedTaskIds).toEqual(['task-1'])
  })
})
