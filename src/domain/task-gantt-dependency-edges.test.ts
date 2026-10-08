import { describe, expect, it } from 'vitest'

import { createTask, type Task } from './task'
import { createTaskGanttDependencyEdges } from './task-gantt'
import { createTaskRelationship } from './task-relationship'

function makeTask(id: string, title: string): Task {
  return createTask({
    id,
    projectId: 'project-1',
    title,
    now: '2026-10-06T18:00:00.000Z',
  })
}

describe('Task Gantt dependency edges', () => {
  it('preserves Blocks relationship direction and exposes a readable direction label', () => {
    const plan = makeTask('task-plan', 'Plan experiment')
    const run = makeTask('task-run', 'Run experiment')
    const relationship = createTaskRelationship({
      id: 'relationship-1',
      type: 'blocks',
      sourceTaskId: plan.id,
      targetTaskId: run.id,
      now: '2026-10-06T18:01:00.000Z',
    })

    expect(
      createTaskGanttDependencyEdges([plan, run], [relationship]),
    ).toEqual([
      {
        relationshipId: relationship.id,
        sourceTaskId: plan.id,
        targetTaskId: run.id,
        sourceTitle: plan.title,
        targetTitle: run.title,
        directionLabel: 'Plan experiment blocks Run experiment',
      },
    ])
  })
})
