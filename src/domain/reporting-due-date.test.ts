import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { deriveOpenTaskDueDateReport } from './reporting'
import { createTask } from './task'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-03T09:00:00.000Z',
})

function task(
  id: string,
  dueDate: string | undefined,
  status: 'todo' | 'doing' | 'done' = 'todo',
) {
  return {
    ...createTask({
      id,
      projectId: project.id,
      title: id,
      now: '2026-10-03T09:01:00.000Z',
    }),
    ...(dueDate === undefined ? {} : { dueDate }),
    status,
  }
}

describe('Open Task due-date reporting', () => {
  it('classifies active incomplete Tasks against an explicit report date', () => {
    expect(
      deriveOpenTaskDueDateReport(
        {
          projects: [project],
          tasks: [
            task('overdue', '2026-10-02'),
            task('today', '2026-10-03', 'doing'),
            task('upcoming', '2026-10-04'),
            task('unscheduled', undefined),
            task('completed-overdue', '2026-10-01', 'done'),
          ],
        },
        '2026-10-03',
      ),
    ).toEqual({
      overdue: 1,
      dueToday: 1,
      upcoming: 1,
      unscheduled: 1,
      totalOpen: 4,
    })
  })
})
