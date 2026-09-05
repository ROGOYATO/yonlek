import { describe, expect, it } from 'vitest'

import { createTaskFilterSet } from './task-filter-set'

describe('task filter set value', () => {
  it('normalizes the preset name while preserving only Task filter values', () => {
    expect(
      createTaskFilterSet({
        name: '  Lab review  ',
        query: 'camera ',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
      }),
    ).toEqual({
      name: 'Lab review',
      query: 'camera ',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
    })

    expect(() =>
      createTaskFilterSet({
        name: '   ',
        query: '',
        status: 'all',
        priority: 'all',
        dueDate: 'all',
      }),
    ).toThrow('Filter set name is required')
  })
})
