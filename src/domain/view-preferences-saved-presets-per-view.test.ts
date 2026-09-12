import { describe, expect, it } from 'vitest'

import {
  applyTaskFilterSet,
  applyTaskView,
  createDefaultViewPreferences,
  saveTaskFilterSet,
  saveTaskView,
  switchTaskViewMode,
  updateTaskViewFilterSort,
  updateViewPreferences,
} from './view-preferences'

describe('Saved presets with per-view filters and sorts', () => {
  it('updates only the active view snapshot when applying saved filters or views', () => {
    const list = updateTaskViewFilterSort(createDefaultViewPreferences(), {
      query: 'list',
      status: 'todo',
      priority: 'normal',
      dueDate: 'all',
      sort: 'title',
    })
    const board = updateTaskViewFilterSort(
      switchTaskViewMode(list, 'board'),
      {
        query: 'board',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'priority',
      },
    )

    const withFilterSet = saveTaskFilterSet(
      {
        ...board,
        query: 'saved-filter',
        status: 'done',
        priority: 'low',
        dueDate: 'withoutDueDate',
      },
      'Review filter',
    )
    const withSavedView = saveTaskView(
      updateViewPreferences(withFilterSet, {
        projectView: 'project-saved',
        query: 'saved-view',
        status: 'todo',
        priority: 'normal',
        dueDate: 'all',
        sort: 'dueDate',
        group: 'priority',
      }),
      'Review view',
    )
    const current = updateViewPreferences(withSavedView, {
      projectView: 'project-current',
      query: 'board',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'priority',
      group: 'status',
    })
    const listBefore = current.filterSortByView?.list

    const filtered = applyTaskFilterSet(current, 'Review filter')
    expect(filtered.viewMode).toBe('board')
    expect(filtered.filterSortByView?.list).toEqual(listBefore)
    expect(filtered.filterSortByView?.board).toMatchObject({
      query: 'saved-filter',
      status: 'done',
      priority: 'low',
      dueDate: 'withoutDueDate',
      sort: 'priority',
    })
    expect(filtered.projectView).toBe('project-current')
    expect(filtered.group).toBe('status')

    const appliedView = applyTaskView(filtered, 'Review view')
    expect(appliedView.viewMode).toBe('board')
    expect(appliedView.filterSortByView?.list).toEqual(listBefore)
    expect(appliedView.filterSortByView?.board).toMatchObject({
      query: 'saved-view',
      status: 'todo',
      priority: 'normal',
      dueDate: 'all',
      sort: 'dueDate',
    })
    expect(appliedView.projectView).toBe('project-saved')
    expect(appliedView.group).toBe('priority')
  })
})
