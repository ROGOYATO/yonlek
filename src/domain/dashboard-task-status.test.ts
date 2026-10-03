import { describe, expect, it } from 'vitest'

import { deriveDashboardTaskStatusItems } from './dashboard'
import type { WorkspaceReportingSnapshot } from './reporting'

const reporting = {
  taskStatus: { todo: 1, doing: 1, done: 2, total: 4, completionPercent: 50 },
  taskPriority: { low: 0, normal: 4, high: 0, total: 4 },
  openTaskDueDates: { overdue: 0, dueToday: 0, upcoming: 2, unscheduled: 0, totalOpen: 2 },
  projects: [],
  goals: [],
} satisfies WorkspaceReportingSnapshot

describe('Dashboard Task status distribution', () => {
  it('returns a stable status order with percentages derived from the report total', () => {
    expect(deriveDashboardTaskStatusItems(reporting)).toEqual([
      { key: 'todo', label: 'To do', count: 1, percent: 25 },
      { key: 'doing', label: 'Doing', count: 1, percent: 25 },
      { key: 'done', label: 'Done', count: 2, percent: 50 },
    ])
  })
})
