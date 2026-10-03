/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DashboardPanel } from './DashboardPanel'
import type { DashboardViewModel } from './domain/dashboard'

const dashboard: DashboardViewModel = {
  kpis: {
    activeTasks: 6,
    completedTasks: 1,
    openTasks: 5,
    completionPercent: 16.6666666667,
    overdueTasks: 2,
  },
  taskStatus: [],
  taskPriority: [],
  attention: {
    overdue: 2,
    dueToday: 1,
    upcoming: 1,
    unscheduled: 1,
    totalOpen: 5,
    attentionNow: 3,
  },
  projects: [],
  goals: [],
}

afterEach(() => cleanup())

describe('DashboardPanel due-date attention', () => {
  it('renders immediate attention and every open Task due-date bucket', () => {
    render(<DashboardPanel dashboard={dashboard} />)

    const attention = within(screen.getByRole('region', { name: 'Due-date attention' }))
    expect(attention.getByText('Attention now: 3')).toBeTruthy()
    expect(attention.getByText('Overdue: 2')).toBeTruthy()
    expect(attention.getByText('Due today: 1')).toBeTruthy()
    expect(attention.getByText('Upcoming: 1')).toBeTruthy()
    expect(attention.getByText('Unscheduled: 1')).toBeTruthy()
    expect(attention.getByText('Total open: 5')).toBeTruthy()
  })
})
