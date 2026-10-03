import type { WorkspaceReportingSnapshot } from './reporting'

export interface DashboardKpis {
  activeTasks: number
  completedTasks: number
  openTasks: number
  completionPercent: number
  overdueTasks: number
}

export function deriveDashboardKpis(
  reporting: WorkspaceReportingSnapshot,
): DashboardKpis {
  return {
    activeTasks: reporting.taskStatus.total,
    completedTasks: reporting.taskStatus.done,
    openTasks: reporting.openTaskDueDates.totalOpen,
    completionPercent: reporting.taskStatus.completionPercent,
    overdueTasks: reporting.openTaskDueDates.overdue,
  }
}


export type DashboardTaskStatusKey = 'todo' | 'doing' | 'done'

export interface DashboardDistributionItem<Key extends string> {
  key: Key
  label: string
  count: number
  percent: number
}

function distributionPercent(count: number, total: number): number {
  return total === 0 ? 0 : (count / total) * 100
}

export function deriveDashboardTaskStatusItems(
  reporting: WorkspaceReportingSnapshot,
): DashboardDistributionItem<DashboardTaskStatusKey>[] {
  const { taskStatus } = reporting

  return [
    {
      key: 'todo',
      label: 'To do',
      count: taskStatus.todo,
      percent: distributionPercent(taskStatus.todo, taskStatus.total),
    },
    {
      key: 'doing',
      label: 'Doing',
      count: taskStatus.doing,
      percent: distributionPercent(taskStatus.doing, taskStatus.total),
    },
    {
      key: 'done',
      label: 'Done',
      count: taskStatus.done,
      percent: distributionPercent(taskStatus.done, taskStatus.total),
    },
  ]
}


export type DashboardTaskPriorityKey = 'low' | 'normal' | 'high'

export function deriveDashboardTaskPriorityItems(
  reporting: WorkspaceReportingSnapshot,
): DashboardDistributionItem<DashboardTaskPriorityKey>[] {
  const { taskPriority } = reporting

  return [
    {
      key: 'low',
      label: 'Low',
      count: taskPriority.low,
      percent: distributionPercent(taskPriority.low, taskPriority.total),
    },
    {
      key: 'normal',
      label: 'Normal',
      count: taskPriority.normal,
      percent: distributionPercent(taskPriority.normal, taskPriority.total),
    },
    {
      key: 'high',
      label: 'High',
      count: taskPriority.high,
      percent: distributionPercent(taskPriority.high, taskPriority.total),
    },
  ]
}


export interface DashboardAttention {
  overdue: number
  dueToday: number
  upcoming: number
  unscheduled: number
  totalOpen: number
  attentionNow: number
}

export function deriveDashboardAttention(
  reporting: WorkspaceReportingSnapshot,
): DashboardAttention {
  const dueDates = reporting.openTaskDueDates

  return {
    overdue: dueDates.overdue,
    dueToday: dueDates.dueToday,
    upcoming: dueDates.upcoming,
    unscheduled: dueDates.unscheduled,
    totalOpen: dueDates.totalOpen,
    attentionNow: dueDates.overdue + dueDates.dueToday,
  }
}


export interface DashboardViewModel {
  kpis: DashboardKpis
  taskStatus: DashboardDistributionItem<DashboardTaskStatusKey>[]
  taskPriority: DashboardDistributionItem<DashboardTaskPriorityKey>[]
  attention: DashboardAttention
  projects: WorkspaceReportingSnapshot['projects']
  goals: WorkspaceReportingSnapshot['goals']
}

export function deriveDashboardViewModel(
  reporting: WorkspaceReportingSnapshot,
): DashboardViewModel {
  return {
    kpis: deriveDashboardKpis(reporting),
    taskStatus: deriveDashboardTaskStatusItems(reporting),
    taskPriority: deriveDashboardTaskPriorityItems(reporting),
    attention: deriveDashboardAttention(reporting),
    projects: reporting.projects.map((project) => ({ ...project })),
    goals: reporting.goals.map((goal) => ({ ...goal })),
  }
}
