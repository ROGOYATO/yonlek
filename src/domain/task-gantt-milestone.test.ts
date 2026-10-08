import { describe, expect, it } from 'vitest'
import { createTask, setTaskMilestone } from './task'

describe('explicit Task milestone semantics', () => {
  it('sets and clears a milestone without changing dates or the source Task', () => {
    const task = {
      ...createTask({
        id: 'task-1', projectId: 'project-1', title: 'Gate review',
        now: '2026-10-08T07:00:00.000Z',
      }),
      startDate: '2026-10-20', dueDate: '2026-10-20',
    }
    const marked = setTaskMilestone(task, true)
    expect(marked).toMatchObject({
      isMilestone: true, startDate: '2026-10-20', dueDate: '2026-10-20',
    })
    expect(task).not.toHaveProperty('isMilestone')
    expect(setTaskMilestone(marked, false)).not.toHaveProperty('isMilestone')
    expect(() => setTaskMilestone(task, 'yes' as unknown as boolean)).toThrow(
      'Task milestone flag must be boolean',
    )
  })
})
