import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type SavedViewDomain = typeof viewPreferenceDomain & {
  saveTaskView: (current: ViewPreferences, name: string) => ViewPreferences
  applyTaskView: (current: ViewPreferences, name: string) => ViewPreferences
  deleteTaskView: (current: ViewPreferences, name: string) => ViewPreferences
  getSavedTaskViews: (current: ViewPreferences) => Array<{
    name: string
    projectView: string
    query: string
    status: string
    priority: string
    dueDate: string
    sort: string
    group: string
  }>
}

describe('saved Task views in view preferences', () => {
  it('saves or updates a complete list-view snapshot, applies it, and deletes it immutably', () => {
    const domain = viewPreferenceDomain as SavedViewDomain
    const current: ViewPreferences = {
      projectView: 'project-source',
      query: 'camera',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'title',
      group: 'status',
      savedFilterSets: [
        {
          name: 'Urgent',
          query: '',
          status: 'doing',
          priority: 'high',
          dueDate: 'all',
        },
      ],
    }

    const saved = domain.saveTaskView(current, '  Camera review  ')

    expect(domain.getSavedTaskViews(saved)).toEqual([
      {
        name: 'Camera review',
        projectView: 'project-source',
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'title',
        group: 'status',
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
      savedFilterSets: [
        {
          name: 'Urgent',
          query: '',
          status: 'doing',
          priority: 'high',
          dueDate: 'all',
        },
      ],
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
    const applied = domain.applyTaskView(changed, 'Camera review')

    expect(applied).toEqual({
      ...changed,
      projectView: 'project-source',
      query: 'camera',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'title',
      group: 'status',
    })
    expect(applied.savedFilterSets).toEqual(current.savedFilterSets)

    const updated = domain.saveTaskView(
      viewPreferenceDomain.updateViewPreferences(applied, {
        projectView: 'all',
        query: 'sensor',
        status: 'done',
        priority: 'normal',
        dueDate: 'withoutDueDate',
        sort: 'dueDate',
        group: 'priority',
      }),
      'Camera review',
    )
    expect(domain.getSavedTaskViews(updated)).toEqual([
      {
        name: 'Camera review',
        projectView: 'all',
        query: 'sensor',
        status: 'done',
        priority: 'normal',
        dueDate: 'withoutDueDate',
        sort: 'dueDate',
        group: 'priority',
      },
    ])

    const deleted = domain.deleteTaskView(updated, 'Camera review')
    expect(domain.getSavedTaskViews(deleted)).toEqual([])
    expect(domain.getSavedTaskViews(updated)).toHaveLength(1)
    expect(deleted.savedFilterSets).toEqual(current.savedFilterSets)
  })
})
