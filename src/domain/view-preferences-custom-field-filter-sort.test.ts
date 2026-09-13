import { describe, expect, it } from 'vitest'

import { createCustomField } from './custom-field'
import { createCustomFieldTaskFilter } from './task-filter'
import {
  applyTaskFilterSet,
  applyTaskView,
  createDefaultViewPreferences,
  getSavedTaskViews,
  getTaskFilterSets,
  saveTaskFilterSet,
  saveTaskView,
  switchTaskViewMode,
  updateTaskViewFilterSort,
  updateViewPreferences,
} from './view-preferences'

const textField = createCustomField({
  id: 'field-text',
  name: 'Notes',
  type: 'text',
  now: '2026-09-13T08:20:00.000Z',
})
const numberField = createCustomField({
  id: 'field-number',
  name: 'Score',
  type: 'number',
  now: '2026-09-13T08:20:01.000Z',
})
const listFilter = createCustomFieldTaskFilter(textField, 'camera')
const boardFilter = createCustomFieldTaskFilter(numberField, 4)

describe('Custom Field filter/sort view preferences', () => {
  it('inherits then restores Custom Field filter and sort state per Task view', () => {
    const list = updateTaskViewFilterSort(createDefaultViewPreferences(), {
      query: 'list',
      customFieldFilter: listFilter,
      customFieldSortFieldId: numberField.id,
    })

    const inheritedBoard = switchTaskViewMode(list, 'board')
    expect(inheritedBoard.customFieldFilter).toEqual(listFilter)
    expect(inheritedBoard.customFieldSortFieldId).toBe(numberField.id)

    const board = updateTaskViewFilterSort(inheritedBoard, {
      query: 'board',
      customFieldFilter: boardFilter,
      customFieldSortFieldId: textField.id,
    })
    const restoredList = switchTaskViewMode(board, 'list')

    expect(restoredList.query).toBe('list')
    expect(restoredList.customFieldFilter).toEqual(listFilter)
    expect(restoredList.customFieldSortFieldId).toBe(numberField.id)
    expect(restoredList.filterSortByView?.board).toMatchObject({
      query: 'board',
      customFieldFilter: boardFilter,
      customFieldSortFieldId: textField.id,
    })
  })

  it('stores Custom Field filters in filter sets and filter plus sort in saved views', () => {
    const board = updateTaskViewFilterSort(
      switchTaskViewMode(
        updateTaskViewFilterSort(createDefaultViewPreferences(), {
          customFieldFilter: listFilter,
          customFieldSortFieldId: numberField.id,
        }),
        'board',
      ),
      {
        query: 'board',
        customFieldFilter: boardFilter,
        customFieldSortFieldId: textField.id,
      },
    )
    const withFilterSet = saveTaskFilterSet(board, 'Field filter')
    const withSavedView = saveTaskView(
      updateViewPreferences(withFilterSet, {
        projectView: 'project-saved',
        group: 'priority',
      }),
      'Field view',
    )

    expect(getTaskFilterSets(withSavedView)).toEqual([
      expect.objectContaining({
        name: 'Field filter',
        customFieldFilter: boardFilter,
      }),
    ])
    expect(
      (getTaskFilterSets(withSavedView)[0] as { customFieldSortFieldId?: string })
        .customFieldSortFieldId,
    ).toBeUndefined()
    expect(getSavedTaskViews(withSavedView)).toEqual([
      expect.objectContaining({
        name: 'Field view',
        customFieldFilter: boardFilter,
        customFieldSortFieldId: textField.id,
      }),
    ])

    const current = updateTaskViewFilterSort(
      updateViewPreferences(withSavedView, {
        projectView: 'project-current',
        group: 'status',
      }),
      {
        customFieldFilter: listFilter,
        customFieldSortFieldId: numberField.id,
      },
    )
    const listBefore = current.filterSortByView?.list

    const filtered = applyTaskFilterSet(current, 'Field filter')
    expect(filtered.customFieldFilter).toEqual(boardFilter)
    expect(filtered.customFieldSortFieldId).toBe(numberField.id)
    expect(filtered.filterSortByView?.list).toEqual(listBefore)

    const appliedView = applyTaskView(filtered, 'Field view')
    expect(appliedView.projectView).toBe('project-saved')
    expect(appliedView.group).toBe('priority')
    expect(appliedView.customFieldFilter).toEqual(boardFilter)
    expect(appliedView.customFieldSortFieldId).toBe(textField.id)
    expect(appliedView.filterSortByView?.list).toEqual(listBefore)
  })
})
