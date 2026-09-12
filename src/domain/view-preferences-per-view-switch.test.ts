import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type SwitchTaskViewMode = (
  current: ViewPreferences,
  nextMode: 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gantt',
) => ViewPreferences

function getSwitchTaskViewMode(): SwitchTaskViewMode | undefined {
  return (
    viewPreferenceDomain as typeof viewPreferenceDomain & {
      switchTaskViewMode?: SwitchTaskViewMode
    }
  ).switchTaskViewMode
}

describe('Task view filter/sort switching', () => {
  it('snapshots the outgoing view, inherits unseen targets, and restores known views', () => {
    const switchTaskViewMode = getSwitchTaskViewMode()
    expect(switchTaskViewMode).toBeTypeOf('function')

    const list = viewPreferenceDomain.updateTaskViewFilterSort(
      viewPreferenceDomain.updateViewPreferences(
        viewPreferenceDomain.createDefaultViewPreferences(),
        {
          projectView: 'project-1',
          group: 'status',
        },
      ),
      {
        query: 'camera',
        status: 'todo',
        priority: 'normal',
        dueDate: 'all',
        sort: 'title',
      },
    )

    const boardInherited = switchTaskViewMode?.(list, 'board')
    expect(boardInherited?.viewMode).toBe('board')
    expect(boardInherited?.query).toBe('camera')
    expect(boardInherited?.sort).toBe('title')
    expect(boardInherited?.projectView).toBe('project-1')
    expect(boardInherited?.group).toBe('status')

    const board = viewPreferenceDomain.updateTaskViewFilterSort(
      boardInherited as ViewPreferences,
      {
        query: 'review',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'priority',
      },
    )
    const restoredList = switchTaskViewMode?.(board, 'list')

    expect(restoredList).toMatchObject({
      viewMode: 'list',
      query: 'camera',
      status: 'todo',
      priority: 'normal',
      dueDate: 'all',
      sort: 'title',
      projectView: 'project-1',
      group: 'status',
    })

    const restoredBoard = switchTaskViewMode?.(
      restoredList as ViewPreferences,
      'board',
    )
    expect(restoredBoard).toMatchObject({
      viewMode: 'board',
      query: 'review',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'priority',
      projectView: 'project-1',
      group: 'status',
    })

    expect(list).not.toHaveProperty('filterSortByView')
  })
})
