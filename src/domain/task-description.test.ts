import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

const task = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-03T05:20:00.000Z',
})

function getSetTaskDescription() {
  return (
    taskDomain as typeof taskDomain & {
      setTaskDescription?: (
        task: taskDomain.Task,
        description: string | null,
      ) => taskDomain.Task
    }
  ).setTaskDescription
}

describe('setTaskDescription', () => {
  it('stores a trimmed description without mutating the original task', () => {
    const updated = getSetTaskDescription()?.(
      task,
      '  Prepare the camera calibration procedure.  ',
    )

    expect(updated?.description).toBe(
      'Prepare the camera calibration procedure.',
    )
    expect(task).not.toHaveProperty('description')
  })

  it('clears an existing description with null', () => {
    const described = {
      ...task,
      description: 'Prepare the camera calibration procedure.',
    }

    expect(getSetTaskDescription()?.(described, null)).toEqual(task)
  })

  it('treats a blank description as cleared', () => {
    const described = {
      ...task,
      description: 'Prepare the camera calibration procedure.',
    }

    expect(getSetTaskDescription()?.(described, '   ')).toEqual(task)
  })
})
