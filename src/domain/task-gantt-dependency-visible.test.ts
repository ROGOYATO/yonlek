import { describe, expect, it } from 'vitest'

import { createTask, type Task } from './task'
import { createTaskGanttDependencyEdges } from './task-gantt'
import { createTaskRelationship } from './task-relationship'

function makeTask(id: string, title: string): Task {
  return createTask({
    id,
    projectId: 'project-1',
    title,
    now: '2026-10-06T18:10:00.000Z',
  })
}

describe('Task Gantt dependency visibility', () => {
  it('ignores relationships whose source or target Task is missing from the visible Task set', () => {
    const visibleSource = makeTask('task-source', 'Visible source')
    const visibleTarget = makeTask('task-target', 'Visible target')
    const filteredOut = makeTask('task-filtered', 'Filtered out')
    const visibleRelationship = createTaskRelationship({
      id: 'relationship-visible',
      type: 'blocks',
      sourceTaskId: visibleSource.id,
      targetTaskId: visibleTarget.id,
      now: '2026-10-06T18:11:00.000Z',
    })
    const filteredRelationship = createTaskRelationship({
      id: 'relationship-filtered',
      type: 'blocks',
      sourceTaskId: visibleSource.id,
      targetTaskId: filteredOut.id,
      now: '2026-10-06T18:12:00.000Z',
    })
    const missingRelationship = createTaskRelationship({
      id: 'relationship-missing',
      type: 'blocks',
      sourceTaskId: 'missing-task',
      targetTaskId: visibleTarget.id,
      now: '2026-10-06T18:13:00.000Z',
    })

    expect(
      createTaskGanttDependencyEdges(
        [visibleSource, visibleTarget],
        [visibleRelationship, filteredRelationship, missingRelationship],
      ),
    ).toEqual([
      {
        relationshipId: visibleRelationship.id,
        sourceTaskId: visibleSource.id,
        targetTaskId: visibleTarget.id,
        sourceTitle: visibleSource.title,
        targetTitle: visibleTarget.title,
        directionLabel: 'Visible source blocks Visible target',
      },
    ])
  })
})
