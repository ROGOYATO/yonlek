import { describe, expect, it } from 'vitest'
import { createTask } from './task'
import { createTaskGanttBaselineComparison } from './task-gantt'

const task = createTask({
  id: 'task-1', projectId: 'project-1', title: 'Review',
  now: '2026-10-08T07:30:00.000Z',
})
const baseline = {
  startDate: '2026-10-10', dueDate: '2026-10-12',
  capturedAt: '2026-10-08T07:31:00.000Z',
}

describe('Gantt baseline comparison', () => {
  it('distinguishes no snapshot, unchanged, changed, and unscheduled Tasks', () => {
    expect(createTaskGanttBaselineComparison(task)).toBe('none')
    expect(createTaskGanttBaselineComparison({
      ...task, startDate: '2026-10-10', dueDate: '2026-10-12',
      ganttBaseline: baseline,
    })).toBe('unchanged')
    expect(createTaskGanttBaselineComparison({
      ...task, startDate: '2026-10-11', dueDate: '2026-10-14',
      ganttBaseline: baseline,
    })).toBe('changed')
    expect(createTaskGanttBaselineComparison({
      ...task, dueDate: '2026-10-14', ganttBaseline: baseline,
    })).toBe('unscheduled')
    expect(baseline.startDate).toBe('2026-10-10')
  })
})
