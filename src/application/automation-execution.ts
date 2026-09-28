import {
  applyAutomationAction,
  createAutomationExecutionContext,
  workspaceActionForAutomationAction,
  type AutomationExecutionContext,
} from '../domain/automation-action'
import { matchesAutomationConditions } from '../domain/automation-condition'
import { matchAutomationTriggers } from '../domain/automation-trigger'
import { deriveTaskActivityEntries } from '../domain/task-activity'
import {
  workspaceReducer,
  type ActivityTrackableWorkspaceAction,
  type WorkspaceState,
} from '../domain/workspace'

export interface ExecuteAutomationTransactionInput {
  action: ActivityTrackableWorkspaceAction
  occurredAt: string
  maxActionApplications: number
}

export interface AutomationTransactionResult {
  workspace: WorkspaceState
  context: AutomationExecutionContext
}

function applyTrackedMutation(
  workspace: WorkspaceState,
  action: ActivityTrackableWorkspaceAction,
  occurredAt: string,
): { workspace: WorkspaceState; entries: ReturnType<typeof deriveTaskActivityEntries> } {
  const mutated = workspaceReducer(workspace, action)
  const entries = deriveTaskActivityEntries(
    workspace,
    mutated,
    action,
    occurredAt,
  )

  if (entries.length === 0) {
    return { workspace: mutated, entries }
  }

  return {
    workspace: {
      ...mutated,
      activity: [...(workspace.activity ?? []), ...entries],
    },
    entries,
  }
}

export function executeAutomationTransaction(
  workspace: WorkspaceState,
  input: ExecuteAutomationTransactionInput,
): AutomationTransactionResult {
  let context = createAutomationExecutionContext({
    occurredAt: input.occurredAt,
    maxActionApplications: input.maxActionApplications,
  })
  const initiating = applyTrackedMutation(
    workspace,
    input.action,
    input.occurredAt,
  )
  let nextWorkspace = initiating.workspace
  const pendingEntries = [...initiating.entries]

  for (let entryIndex = 0; entryIndex < pendingEntries.length; entryIndex += 1) {
    const entry = pendingEntries[entryIndex]
    if (!entry) continue

    const snapshot = nextWorkspace
    const automations = snapshot.automations ?? []
    const matches = matchAutomationTriggers(automations, [entry])
    const eligible = matches.flatMap((match) => {
      const automation = automations.find(
        (candidate) => candidate.id === match.automationId,
      )

      if (
        !automation ||
        !matchesAutomationConditions(automation, snapshot, match.taskId)
      ) {
        return []
      }

      return [{ automation, match }]
    })

    for (const { automation, match } of eligible) {
      for (const action of automation.actions) {
        const beforeAction = nextWorkspace
        const workspaceAction = workspaceActionForAutomationAction(
          action,
          match.taskId,
          context,
        )
        const applied = applyAutomationAction(
          action,
          beforeAction,
          match.taskId,
          context,
        )
        context = applied.context

        const generatedEntries = deriveTaskActivityEntries(
          beforeAction,
          applied.workspace,
          workspaceAction,
          context.occurredAt,
        )

        nextWorkspace =
          generatedEntries.length === 0
            ? applied.workspace
            : {
                ...applied.workspace,
                activity: [
                  ...(beforeAction.activity ?? []),
                  ...generatedEntries,
                ],
              }
        pendingEntries.push(...generatedEntries)
      }
    }
  }

  return { workspace: nextWorkspace, context }
}
