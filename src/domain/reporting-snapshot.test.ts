import { describe, expect, it } from 'vitest'

import { createGoal } from './goal'
import { createProject } from './project'
import { deriveWorkspaceReportingSnapshot } from './reporting'
import { createTask } from './task'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-03T09:00:00.000Z',
})
const task = createTask({
  id: 'task-1',
  projectId: project.id,
  title: 'Ship',
  now: '2026-10-03T09:01:00.000Z',
})
const goal = createGoal({
  id: 'goal-1',
  name: 'Adoption',
  targetType: 'manual',
  targetValue: 100,
  currentValue: 25,
})

describe('Workspace reporting snapshot', () => {
  it('composes Task, Project, and Goal reporting without persisting derived state', () => {
    const workspace = {
      projects: [project],
      tasks: [{ ...task, priority: 'high' as const, dueDate: '2026-10-03' }],
      goals: [goal],
    }
    const before = structuredClone(workspace)

    expect(deriveWorkspaceReportingSnapshot(workspace, '2026-10-03')).toEqual({
      taskStatus: {
        todo: 1,
        doing: 0,
        done: 0,
        total: 1,
        completionPercent: 0,
      },
      taskPriority: {
        low: 0,
        normal: 0,
        high: 1,
        total: 1,
      },
      openTaskDueDates: {
        overdue: 0,
        dueToday: 1,
        upcoming: 0,
        unscheduled: 0,
        totalOpen: 1,
      },
      projects: [
        {
          projectId: project.id,
          projectName: 'Launch',
          totalTasks: 1,
          doneTasks: 0,
          completionPercent: 0,
        },
      ],
      goals: [
        {
          goalId: goal.id,
          goalName: 'Adoption',
          targetType: 'manual',
          currentValue: 25,
          targetValue: 100,
          percent: 25,
        },
      ],
    })
    expect(workspace).toEqual(before)
  })
})
