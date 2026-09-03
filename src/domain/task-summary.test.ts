import { describe, expect, it } from 'vitest'

import { createTask } from './task'
import { summarizeTasks } from './task-summary'

const todo = createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-03T05:50:00.000Z',
})
const doing = { ...todo, id: 'task-2', status: 'doing' as const }
const done = { ...todo, id: 'task-3', status: 'done' as const }

describe('summarizeTasks', () => {
  it('counts total tasks and each status', () => {
    expect(summarizeTasks([todo, doing, done])).toEqual({
      total: 3,
      todo: 1,
      doing: 1,
      done: 1,
    })
  })

  it('returns zero counts for an empty task list', () => {
    expect(summarizeTasks([])).toEqual({
      total: 0,
      todo: 0,
      doing: 0,
      done: 0,
    })
  })
})
