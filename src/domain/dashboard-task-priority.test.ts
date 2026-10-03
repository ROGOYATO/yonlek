import { describe, expect, it } from 'vitest'

import { deriveDashboardTaskPriorityItems } from './dashboard'
import type { WorkspaceReportingSnapshot } from './reporting'

const reporting = {
  taskStatus: { todo: 2, doing: 1, done: 1, total: 4, completionPercent: 25 },
  taskPriority: { low: 1, normal: 2, high: 1, total: 4 },
  openTaskDueDates: { overdue: 0, dueToday: 1, upcoming: 2, unscheduled: 0, totalOpen: 3 },
  projects: [],
  goals: [],
} satisfies WorkspaceReportingSnapshot

describe('Dashboard Task priority distribution', () => {
  it('returns a stable priority order with percentages derived from the report total', () => {
    expect(deriveDashboardTaskPriorityItems(reporting)).toEqual([
      { key: 'low', label: 'Low', count: 1, percent: 25 },
      { key: 'normal', label: 'Normal', count: 2, percent: 50 },
      { key: 'high', label: 'High', count: 1, percent: 25 },
    ])
  })
})
