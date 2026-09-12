import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type FilterSortState = Pick<
  ViewPreferences,
  'query' | 'status' | 'priority' | 'dueDate' | 'sort'
>
type FilterSortByView = Partial<
  Record<'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gantt', FilterSortState>
>
type UpdateTaskViewFilterSort = (
  current: ViewPreferences,
  patch: Partial<FilterSortState>,
) => ViewPreferences

function getUpdateTaskViewFilterSort(): UpdateTaskViewFilterSort | undefined {
  return (
    viewPreferenceDomain as typeof viewPreferenceDomain & {
      updateTaskViewFilterSort?: UpdateTaskViewFilterSort
    }
  ).updateTaskViewFilterSort
}

describe('per-view Task filters and sorts', () => {
  it('keeps legacy List-only shape until a view snapshot collection exists', () => {
    const updateTaskViewFilterSort = getUpdateTaskViewFilterSort()
    expect(updateTaskViewFilterSort).toBeTypeOf('function')

    const current = viewPreferenceDomain.createDefaultViewPreferences()
    const updated = updateTaskViewFilterSort?.(current, {
      query: 'camera',
      status: 'doing',
      sort: 'title',
    })

    expect(updated).toEqual({
      ...current,
      query: 'camera',
      status: 'doing',
      sort: 'title',
    })
    expect(current).toEqual(viewPreferenceDomain.createDefaultViewPreferences())
    expect(
      (updated as ViewPreferences & { filterSortByView?: FilterSortByView })
        ?.filterSortByView,
    ).toBeUndefined()
  })

  it('updates only the active view snapshot once snapshots exist', () => {
    const updateTaskViewFilterSort = getUpdateTaskViewFilterSort()
    expect(updateTaskViewFilterSort).toBeTypeOf('function')

    const list: FilterSortState = {
      query: 'list',
      status: 'todo',
      priority: 'normal',
      dueDate: 'all',
      sort: 'title',
    }
    const board: FilterSortState = {
      query: 'board',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'priority',
    }
    const current = {
      ...viewPreferenceDomain.createDefaultViewPreferences(),
      ...board,
      projectView: 'project-1',
      group: 'status' as const,
      viewMode: 'board' as const,
      filterSortByView: { list, board },
    } as ViewPreferences & { filterSortByView: FilterSortByView }

    const updated = updateTaskViewFilterSort?.(current, {
      query: 'review',
      dueDate: 'withoutDueDate',
    }) as (ViewPreferences & { filterSortByView: FilterSortByView }) | undefined

    expect(updated?.query).toBe('review')
    expect(updated?.dueDate).toBe('withoutDueDate')
    expect(updated?.filterSortByView.list).toEqual(list)
    expect(updated?.filterSortByView.board).toEqual({
      ...board,
      query: 'review',
      dueDate: 'withoutDueDate',
    })
    expect(updated?.projectView).toBe('project-1')
    expect(updated?.group).toBe('status')
    expect(current.filterSortByView.board).toEqual(board)
  })
})
