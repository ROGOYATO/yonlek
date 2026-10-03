/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DashboardPanel } from './DashboardPanel'
import type { DashboardViewModel } from './domain/dashboard'

const dashboard: DashboardViewModel = {
  kpis: {
    activeTasks: 4,
    completedTasks: 1,
    openTasks: 3,
    completionPercent: 25,
    overdueTasks: 0,
  },
  taskStatus: [
    { key: 'todo', label: 'To do', count: 1, percent: 25 },
    { key: 'doing', label: 'Doing', count: 2, percent: 50 },
    { key: 'done', label: 'Done', count: 1, percent: 25 },
  ],
  taskPriority: [
    { key: 'low', label: 'Low', count: 1, percent: 25 },
    { key: 'normal', label: 'Normal', count: 2, percent: 50 },
    { key: 'high', label: 'High', count: 1, percent: 25 },
  ],
  attention: {
    overdue: 0,
    dueToday: 0,
    upcoming: 3,
    unscheduled: 0,
    totalOpen: 3,
    attentionNow: 0,
  },
  projects: [],
  goals: [],
}

afterEach(() => cleanup())

describe('DashboardPanel distributions', () => {
  it('renders stable Task status and priority distributions', () => {
    render(<DashboardPanel dashboard={dashboard} />)

    const status = within(screen.getByRole('region', { name: 'Task status' }))
    expect(status.getByText('To do: 1 (25%)')).toBeTruthy()
    expect(status.getByText('Doing: 2 (50%)')).toBeTruthy()
    expect(status.getByText('Done: 1 (25%)')).toBeTruthy()

    const priority = within(screen.getByRole('region', { name: 'Task priority' }))
    expect(priority.getByText('Low: 1 (25%)')).toBeTruthy()
    expect(priority.getByText('Normal: 2 (50%)')).toBeTruthy()
    expect(priority.getByText('High: 1 (25%)')).toBeTruthy()
  })
})
