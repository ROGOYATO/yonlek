import {
  summarizeGoalProgress,
  type GoalProgressSummary,
} from './goal-progress'
import type { Task } from './task'
import type { WorkspaceState } from './workspace'

export interface TaskStatusReport {
  todo: number
  doing: number
  done: number
  total: number
  completionPercent: number
}

export interface TaskPriorityReport {
  low: number
  normal: number
  high: number
  total: number
}

export interface OpenTaskDueDateReport {
  overdue: number
  dueToday: number
  upcoming: number
  unscheduled: number
  totalOpen: number
}

export interface ProjectCompletionReportRow {
  projectId: string
  projectName: string
  totalTasks: number
  doneTasks: number
  completionPercent: number
}

export interface GoalProgressReportRow extends GoalProgressSummary {
  goalId: string
  goalName: string
}

export interface WorkspaceReportingSnapshot {
  taskStatus: TaskStatusReport
  taskPriority: TaskPriorityReport
  openTaskDueDates: OpenTaskDueDateReport
  projects: ProjectCompletionReportRow[]
  goals: GoalProgressReportRow[]
}

function reportableTasks(workspace: WorkspaceState): Task[] {
  const archivedProjectIds = new Set(
    workspace.projects
      .filter((project) => project.archivedAt !== undefined)
      .map((project) => project.id),
  )

  return workspace.tasks.filter(
    (task) =>
      task.archivedAt === undefined &&
      !archivedProjectIds.has(task.projectId),
  )
}

export function deriveTaskStatusReport(
  workspace: WorkspaceState,
): TaskStatusReport {
  const report = reportableTasks(workspace).reduce<TaskStatusReport>(
    (current, task) => ({
      ...current,
      [task.status]: current[task.status] + 1,
      total: current.total + 1,
    }),
    {
      todo: 0,
      doing: 0,
      done: 0,
      total: 0,
      completionPercent: 0,
    },
  )

  return {
    ...report,
    completionPercent:
      report.total === 0 ? 0 : (report.done / report.total) * 100,
  }
}

export function deriveTaskPriorityReport(
  workspace: WorkspaceState,
): TaskPriorityReport {
  return reportableTasks(workspace).reduce<TaskPriorityReport>(
    (current, task) => ({
      ...current,
      [task.priority]: current[task.priority] + 1,
      total: current.total + 1,
    }),
    {
      low: 0,
      normal: 0,
      high: 0,
      total: 0,
    },
  )
}

export function deriveOpenTaskDueDateReport(
  workspace: WorkspaceState,
  reportDate: string,
): OpenTaskDueDateReport {
  return reportableTasks(workspace)
    .filter((task) => task.status !== 'done')
    .reduce<OpenTaskDueDateReport>(
      (current, task) => {
        if (task.dueDate === undefined) {
          return {
            ...current,
            unscheduled: current.unscheduled + 1,
            totalOpen: current.totalOpen + 1,
          }
        }

        if (task.dueDate < reportDate) {
          return {
            ...current,
            overdue: current.overdue + 1,
            totalOpen: current.totalOpen + 1,
          }
        }

        if (task.dueDate === reportDate) {
          return {
            ...current,
            dueToday: current.dueToday + 1,
            totalOpen: current.totalOpen + 1,
          }
        }

        return {
          ...current,
          upcoming: current.upcoming + 1,
          totalOpen: current.totalOpen + 1,
        }
      },
      {
        overdue: 0,
        dueToday: 0,
        upcoming: 0,
        unscheduled: 0,
        totalOpen: 0,
      },
    )
}

export function deriveProjectCompletionReport(
  workspace: WorkspaceState,
): ProjectCompletionReportRow[] {
  const tasks = reportableTasks(workspace)

  return workspace.projects
    .filter((project) => project.archivedAt === undefined)
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id)
      const doneTasks = projectTasks.filter((task) => task.status === 'done').length

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: projectTasks.length,
        doneTasks,
        completionPercent:
          projectTasks.length === 0
            ? 0
            : (doneTasks / projectTasks.length) * 100,
      }
    })
}

export function deriveGoalProgressReport(
  workspace: WorkspaceState,
): GoalProgressReportRow[] {
  return (workspace.goals ?? []).map((goal) => ({
    goalId: goal.id,
    goalName: goal.name,
    ...summarizeGoalProgress(goal, workspace.tasks),
  }))
}

export function deriveWorkspaceReportingSnapshot(
  workspace: WorkspaceState,
  reportDate: string,
): WorkspaceReportingSnapshot {
  return {
    taskStatus: deriveTaskStatusReport(workspace),
    taskPriority: deriveTaskPriorityReport(workspace),
    openTaskDueDates: deriveOpenTaskDueDateReport(workspace, reportDate),
    projects: deriveProjectCompletionReport(workspace),
    goals: deriveGoalProgressReport(workspace),
  }
}
