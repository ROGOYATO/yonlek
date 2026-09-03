import { describe, expect, it } from 'vitest'

import { createTask } from './task'
import { filterTasks } from './task-filter'

const draft = createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-03T04:40:00.000Z',
})

const review = {
  ...createTask({
    id: 'task-2',
    projectId: 'project-1',
    title: 'Review safety checklist',
    now: '2026-09-03T04:45:00.000Z',
  }),
  status: 'done' as const,
  priority: 'high' as const,
}

describe('filterTasks', () => {
  it('searches task titles case-insensitively with a normalized query', () => {
    const result = filterTasks([draft, review], {
      query: '  SAFETY  ',
      status: 'all',
      priority: 'all',
    })

    expect(result).toEqual([review])
  })

  it('combines status and priority filters', () => {
    const result = filterTasks([draft, review], {
      query: '',
      status: 'done',
      priority: 'high',
    })

    expect(result).toEqual([review])
  })
})


it('filters tasks that have a due date', () => {
  const scheduled = { ...draft, dueDate: '2026-09-12' }
  const result = filterTasks([scheduled, review], {
    query: '',
    status: 'all',
    priority: 'all',
    dueDate: 'withDueDate',
  })

  expect(result).toEqual([scheduled])
})

it('filters tasks that do not have a due date', () => {
  const scheduled = { ...draft, dueDate: '2026-09-12' }
  const result = filterTasks([scheduled, review], {
    query: '',
    status: 'all',
    priority: 'all',
    dueDate: 'withoutDueDate',
  })

  expect(result).toEqual([review])
})
