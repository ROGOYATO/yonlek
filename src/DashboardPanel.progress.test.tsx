/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DashboardPanel } from './DashboardPanel'
import type { DashboardViewModel } from './domain/dashboard'

const dashboard: DashboardViewModel = {
  kpis: {
    activeTasks: 3,
    completedTasks: 1,
    openTasks: 2,
    completionPercent: 33.3333333333,
    overdueTasks: 0,
  },
  taskStatus: [],
  taskPriority: [],
  attention: {
    overdue: 0,
    dueToday: 0,
    upcoming: 2,
    unscheduled: 0,
    totalOpen: 2,
    attentionNow: 0,
  },
  projects: [
    {
      projectId: 'project-1',
      projectName: 'Launch',
      totalTasks: 3,
      doneTasks: 1,
      completionPercent: 33.3333333333,
    },
  ],
  goals: [
    {
      goalId: 'goal-1',
      goalName: 'Adoption',
      targetType: 'manual',
      currentValue: 40,
      targetValue: 100,
      percent: 40,
    },
  ],
}

afterEach(() => cleanup())

describe('DashboardPanel Project and Goal progress', () => {
  it('renders derived Project and Goal progress rows', () => {
    const { rerender } = render(<DashboardPanel dashboard={dashboard} />)

    const projects = within(screen.getByRole('region', { name: 'Project progress' }))
    expect(projects.getByText('Launch: 1 / 3 (33.3%)')).toBeTruthy()

    const goals = within(screen.getByRole('region', { name: 'Goal progress' }))
    expect(goals.getByText('Adoption: 40 / 100 (40%)')).toBeTruthy()

    rerender(
      <DashboardPanel
        dashboard={{ ...dashboard, projects: [], goals: [] }}
      />,
    )
    expect(screen.getByText('No active Projects')).toBeTruthy()
    expect(screen.getByText('No Goals')).toBeTruthy()
  })
})
