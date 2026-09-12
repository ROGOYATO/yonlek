import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getTaskViewMode,
  isTaskViewMode,
  updateViewPreferences,
} from './view-preferences'

describe('view preference Timeline Task view mode', () => {
  it('recognizes Timeline as a supported mode and still defaults missing mode to List', () => {
    const current = createDefaultViewPreferences()

    expect(isTaskViewMode('list')).toBe(true)
    expect(isTaskViewMode('board')).toBe(true)
    expect(isTaskViewMode('calendar')).toBe(true)
    expect(isTaskViewMode('table')).toBe(true)
    expect(isTaskViewMode('timeline')).toBe(true)
    expect(isTaskViewMode('gantt')).toBe(true)
    expect(isTaskViewMode('matrix')).toBe(false)
    expect(getTaskViewMode(current)).toBe('list')

    const timeline = updateViewPreferences(current, {
      viewMode: 'timeline' as never,
    })

    expect(getTaskViewMode(timeline)).toBe('timeline')
    expect(getTaskViewMode(current)).toBe('list')
  })
})
