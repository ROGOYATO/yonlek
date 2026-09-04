import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

const task = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-04T03:30:00.000Z',
})

function setTaskList() {
  return (
    taskDomain as typeof taskDomain & {
      setTaskList?: (
        task: taskDomain.Task,
        listId: string | null,
      ) => taskDomain.Task
    }
  ).setTaskList
}

describe('setTaskList', () => {
  it('assigns a trimmed list id without mutating the original', () => {
    const next = setTaskList()?.(task, '  list-1  ')

    expect(next?.listId).toBe('list-1')
    expect(task).not.toHaveProperty('listId')
  })

  it('clears a list assignment with null', () => {
    const listed = { ...task, listId: 'list-1' }

    expect(setTaskList()?.(listed, null)).toEqual(task)
  })
})
