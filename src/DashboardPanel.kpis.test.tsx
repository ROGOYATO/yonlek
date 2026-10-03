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
    overdueTasks: 2,
  },
  taskStatus: [],
  taskPriority: [],
  attention: {
    overdue: 2,
    dueToday: 1,
    upcoming: 0,
    unscheduled: 0,
    totalOpen: 3,
    attentionNow: 3,
  },
  projects: [],
  goals: [],
}

afterEach(() => cleanup())

describe('DashboardPanel KPIs', () => {
  it('renders the headline Dashboard metrics', () => {
    render(<DashboardPanel dashboard={dashboard} />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Active Tasks' })).getByText('4')).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Completed Tasks' })).getByText('1')).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Open Tasks' })).getByText('3')).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Completion' })).getByText('25%')).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Overdue Tasks' })).getByText('2')).toBeTruthy()
  })
})
