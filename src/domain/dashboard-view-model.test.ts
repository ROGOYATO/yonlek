import { describe, expect, it } from 'vitest'

import { deriveDashboardViewModel } from './dashboard'
import type { WorkspaceReportingSnapshot } from './reporting'

const reporting: WorkspaceReportingSnapshot = {
  taskStatus: { todo: 1, doing: 1, done: 2, total: 4, completionPercent: 50 },
  taskPriority: { low: 1, normal: 2, high: 1, total: 4 },
  openTaskDueDates: { overdue: 1, dueToday: 0, upcoming: 1, unscheduled: 0, totalOpen: 2 },
  projects: [
    { projectId: 'alpha', projectName: 'Alpha', totalTasks: 3, doneTasks: 2, completionPercent: 200 / 3 },
    { projectId: 'beta', projectName: 'Beta', totalTasks: 0, doneTasks: 0, completionPercent: 0 },
  ],
  goals: [
    { goalId: 'goal-1', goalName: 'Launch', targetType: 'manual', currentValue: 4, targetValue: 8, percent: 50 },
  ],
}

describe('Dashboard view-model composition', () => {
  it('composes all dashboard sections without mutating or aliasing reporting rows', () => {
    const before = structuredClone(reporting)
    const dashboard = deriveDashboardViewModel(reporting)

    expect(dashboard).toEqual({
      kpis: {
        activeTasks: 4,
        completedTasks: 2,
        openTasks: 2,
        completionPercent: 50,
        overdueTasks: 1,
      },
      taskStatus: [
        { key: 'todo', label: 'To do', count: 1, percent: 25 },
        { key: 'doing', label: 'Doing', count: 1, percent: 25 },
        { key: 'done', label: 'Done', count: 2, percent: 50 },
      ],
      taskPriority: [
        { key: 'low', label: 'Low', count: 1, percent: 25 },
        { key: 'normal', label: 'Normal', count: 2, percent: 50 },
        { key: 'high', label: 'High', count: 1, percent: 25 },
      ],
      attention: {
        overdue: 1,
        dueToday: 0,
        upcoming: 1,
        unscheduled: 0,
        totalOpen: 2,
        attentionNow: 1,
      },
      projects: reporting.projects,
      goals: reporting.goals,
    })

    expect(reporting).toEqual(before)
    expect(dashboard.projects).not.toBe(reporting.projects)
    expect(dashboard.projects[0]).not.toBe(reporting.projects[0])
    expect(dashboard.goals).not.toBe(reporting.goals)
    expect(dashboard.goals[0]).not.toBe(reporting.goals[0])
  })
})
