import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type FilterSetDomain = typeof viewPreferenceDomain & {
  saveTaskFilterSet: (
    current: ViewPreferences,
    name: string,
  ) => ViewPreferences
  applyTaskFilterSet: (
    current: ViewPreferences,
    name: string,
  ) => ViewPreferences
  deleteTaskFilterSet: (
    current: ViewPreferences,
    name: string,
  ) => ViewPreferences
  getTaskFilterSets: (current: ViewPreferences) => Array<{
    name: string
    query: string
    status: string
    priority: string
    dueDate: string
  }>
}

describe('saved Task filter sets in view preferences', () => {
  it('saves or updates a named filter snapshot, applies it without changing view state, and deletes it immutably', () => {
    const domain = viewPreferenceDomain as FilterSetDomain
    const current: ViewPreferences = {
      projectView: 'project-source',
      query: 'camera',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'title',
      group: 'status',
    }

    const saved = domain.saveTaskFilterSet(current, '  Lab review  ')

    expect(domain.getTaskFilterSets(saved)).toEqual([
      {
        name: 'Lab review',
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
      },
    ])
    expect(current).toEqual({
      projectView: 'project-source',
      query: 'camera',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'title',
      group: 'status',
    })

    const changed = viewPreferenceDomain.updateViewPreferences(saved, {
      projectView: 'project-target',
      query: '',
      status: 'all',
      priority: 'low',
      dueDate: 'all',
      sort: 'priority',
      group: 'list',
    })
    const applied = domain.applyTaskFilterSet(changed, 'Lab review')

    expect(applied).toEqual({
      ...changed,
      query: 'camera',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
    })
    expect(applied.projectView).toBe('project-target')
    expect(applied.sort).toBe('priority')
    expect(viewPreferenceDomain.getTaskGroup(applied)).toBe('list')

    const updated = domain.saveTaskFilterSet(
      viewPreferenceDomain.updateViewPreferences(applied, {
        query: 'sensor',
        status: 'done',
        priority: 'normal',
        dueDate: 'withoutDueDate',
      }),
      'Lab review',
    )
    expect(domain.getTaskFilterSets(updated)).toEqual([
      {
        name: 'Lab review',
        query: 'sensor',
        status: 'done',
        priority: 'normal',
        dueDate: 'withoutDueDate',
      },
    ])

    const deleted = domain.deleteTaskFilterSet(updated, 'Lab review')
    expect(domain.getTaskFilterSets(deleted)).toEqual([])
    expect(domain.getTaskFilterSets(updated)).toHaveLength(1)
  })
})
