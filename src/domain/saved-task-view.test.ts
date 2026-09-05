import { describe, expect, it } from 'vitest'

import { createSavedTaskView } from './saved-task-view'

describe('saved Task view value', () => {
  it('normalizes the view name while preserving the complete list-view configuration', () => {
    expect(
      createSavedTaskView({
        name: '  Camera review  ',
        projectView: 'project-1',
        query: 'camera ',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'title',
        group: 'status',
      }),
    ).toEqual({
      name: 'Camera review',
      projectView: 'project-1',
      query: 'camera ',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'title',
      group: 'status',
    })

    expect(() =>
      createSavedTaskView({
        name: '   ',
        projectView: 'all',
        query: '',
        status: 'all',
        priority: 'all',
        dueDate: 'all',
        sort: 'created',
        group: 'none',
      }),
    ).toThrow('Saved view name is required')
  })
})
