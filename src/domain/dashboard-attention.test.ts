import { describe, expect, it } from 'vitest'

import { deriveDashboardAttention } from './dashboard'
import type { WorkspaceReportingSnapshot } from './reporting'

const reporting = {
  taskStatus: { todo: 5, doing: 5, done: 2, total: 12, completionPercent: 100 / 6 },
  taskPriority: { low: 2, normal: 7, high: 3, total: 12 },
  openTaskDueDates: {
    overdue: 2,
    dueToday: 1,
    upcoming: 3,
    unscheduled: 4,
    totalOpen: 10,
  },
  projects: [],
  goals: [],
} satisfies WorkspaceReportingSnapshot

describe('Dashboard attention summary', () => {
  it('keeps due-date buckets and derives the immediate attention count', () => {
    expect(deriveDashboardAttention(reporting)).toEqual({
      overdue: 2,
      dueToday: 1,
      upcoming: 3,
      unscheduled: 4,
      totalOpen: 10,
      attentionNow: 3,
    })
  })
})
