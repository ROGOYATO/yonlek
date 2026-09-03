import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

const task = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-03T16:10:00.000Z',
})

function getMoveTaskToProject() {
  return (
    taskDomain as typeof taskDomain & {
      moveTaskToProject?: (
        task: taskDomain.Task,
        projectId: string,
      ) => taskDomain.Task
    }
  ).moveTaskToProject
}

describe('moveTaskToProject', () => {
  it('moves a task to a trimmed project id without mutating the original', () => {
    const moved = getMoveTaskToProject()?.(task, '  project-2  ')

    expect(moved?.projectId).toBe('project-2')
    expect(task.projectId).toBe('project-1')
  })

  it('rejects a blank target project id', () => {
    expect(() => getMoveTaskToProject()?.(task, '   ')).toThrow(
      'Task project is required',
    )
  })
})
