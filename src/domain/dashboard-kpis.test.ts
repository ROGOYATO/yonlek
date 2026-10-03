import { describe, expect, it } from 'vitest'

import { deriveDashboardKpis } from './dashboard'
import type { WorkspaceReportingSnapshot } from './reporting'

const reporting: WorkspaceReportingSnapshot = {
  taskStatus: {
    todo: 2,
    doing: 1,
    done: 3,
    total: 6,
    completionPercent: 50,
  },
  taskPriority: { low: 1, normal: 3, high: 2, total: 6 },
  openTaskDueDates: {
    overdue: 1,
    dueToday: 1,
    upcoming: 1,
    unscheduled: 0,
    totalOpen: 3,
  },
  projects: [],
  goals: [],
}

describe('Dashboard KPI composition', () => {
  it('derives headline Task and overdue metrics from one reporting snapshot', () => {
    expect(deriveDashboardKpis(reporting)).toEqual({
      activeTasks: 6,
      completedTasks: 3,
      openTasks: 3,
      completionPercent: 50,
      overdueTasks: 1,
    })
  })
})
