import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { deriveProjectCompletionReport } from './reporting'
import { createTask } from './task'

const alpha = createProject({
  id: 'project-alpha',
  name: 'Alpha',
  now: '2026-10-03T09:00:00.000Z',
})
const beta = createProject({
  id: 'project-beta',
  name: 'Beta',
  now: '2026-10-03T09:01:00.000Z',
})
const archived = {
  ...createProject({
    id: 'project-archived',
    name: 'Archived',
    now: '2026-10-03T09:02:00.000Z',
  }),
  archivedAt: '2026-10-03T10:00:00.000Z',
}

function task(id: string, projectId: string, status: 'todo' | 'doing' | 'done') {
  return {
    ...createTask({
      id,
      projectId,
      title: id,
      now: '2026-10-03T09:03:00.000Z',
    }),
    status,
  }
}

describe('Project completion reporting', () => {
  it('preserves active Project order and reports zero-task Projects explicitly', () => {
    expect(
      deriveProjectCompletionReport({
        projects: [alpha, beta, archived],
        tasks: [
          task('alpha-done', alpha.id, 'done'),
          task('alpha-todo', alpha.id, 'todo'),
          task('archived-done', archived.id, 'done'),
        ],
      }),
    ).toEqual([
      {
        projectId: alpha.id,
        projectName: 'Alpha',
        totalTasks: 2,
        doneTasks: 1,
        completionPercent: 50,
      },
      {
        projectId: beta.id,
        projectName: 'Beta',
        totalTasks: 0,
        doneTasks: 0,
        completionPercent: 0,
      },
    ])
  })
})
