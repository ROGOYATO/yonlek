import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getTaskViewMode,
  isTaskViewMode,
  updateViewPreferences,
} from './view-preferences'

describe('view preference Gantt Task view mode', () => {
  it('recognizes Gantt as supported while keeping unrelated modes invalid', () => {
    const current = createDefaultViewPreferences()

    expect(isTaskViewMode('gantt')).toBe(true)
    expect(isTaskViewMode('matrix')).toBe(false)
    expect(getTaskViewMode(current)).toBe('list')

    const gantt = updateViewPreferences(current, {
      viewMode: 'gantt' as never,
    })

    expect(getTaskViewMode(gantt)).toBe('gantt')
    expect(getTaskViewMode(current)).toBe('list')
  })
})
