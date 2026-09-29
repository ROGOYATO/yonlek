import { describe, expect, it } from 'vitest'

import { createGoal } from './goal'
import { createProject } from './project'
import { createTask } from './task'
import { emptyWorkspace, workspaceReducer } from './workspace'

function workspace() {
  const project = createProject({ id: 'project-1', name: 'Launch', now: '2026-09-28T12:00:00.000Z' })
  const task = createTask({ id: 'task-1', projectId: project.id, title: 'Ship', now: '2026-09-28T12:00:00.000Z' })
  const goal = createGoal({ id: 'goal-1', name: 'Ship beta', targetType: 'linkedTasks', targetValue: 1, currentValue: 0 })
  return { ...emptyWorkspace, projects: [project], tasks: [task], goals: [goal] }
}

describe('Workspace Goal Task linkage', () => {
  it('links and unlinks an existing Task through Workspace actions', () => {
    const linked = workspaceReducer(workspace(), { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'task-1' } as never)
    expect(linked.goals?.[0]?.linkedTaskIds).toEqual(['task-1'])

    const unlinked = workspaceReducer(linked, { type: 'goal/taskUnlinked', goalId: 'goal-1', taskId: 'task-1' } as never)
    expect(unlinked.goals?.[0]).not.toHaveProperty('linkedTaskIds')
  })

  it('rejects linking through a missing Goal', () => {
    expect(() => workspaceReducer(workspace(), { type: 'goal/taskLinked', goalId: 'missing-goal', taskId: 'task-1' } as never)).toThrow('Cannot link a Task to a missing Goal')
  })

  it('rejects linking a missing Task', () => {
    expect(() => workspaceReducer(workspace(), { type: 'goal/taskLinked', goalId: 'goal-1', taskId: 'missing-task' } as never)).toThrow('Cannot link a missing Task to a Goal')
  })
})
