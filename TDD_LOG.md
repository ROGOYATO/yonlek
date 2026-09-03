# TDD Log

This log records completed behavior cycles. RED was observed before the corresponding production implementation unless a row is explicitly marked as workflow/configuration work.

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 001 | Create a project; normalize name; reject blank name | GREEN |
| 002 | Create a task with default status/priority; reject blank title | GREEN |
| 003 | Workspace reducer: project/task membership, status change, cascading project deletion | GREEN |
| 004 | Initial React workspace shell | GREEN |
| 005 | Browser entry contract and Vite entrypoint | GREEN |
| 005b | Production TypeScript build excludes test-only files | configuration fix |
| 006 | Rename a task without mutating the original task | GREEN |
| 007 | Workspace task title, priority, and deletion actions | GREEN |
| 008 | Render supplied workspace projects and tasks | GREEN |
| 009 | Versioned workspace persistence boundary | GREEN |
| 010 | Workspace store loads and persists reducer state | GREEN |
| 011 | Workspace-store subscriptions and unsubscribe | GREEN |
| 012 | Application commands with injected IDs and timestamps | GREEN |
| 013 | Create a project through the React interaction boundary | GREEN |
| 014 | Add a task through the React interaction boundary | GREEN |
| 014b | Testing Library DOM cleanup between Vitest tests | test-harness fix |
| 015 | Browser app loads persisted workspace state | GREEN |
| 016 | Application mutation commands for rename/status/priority/delete | GREEN |
| 017 | Change task status and priority through the UI | GREEN |
| 018 | Rename a task through the UI | GREEN |
| 019 | Delete a task through the UI without deleting its project | GREEN |
| 020 | Delete a project and its tasks through the UI | GREEN |
| 021 | Show project/task validation errors without mutating state | GREEN |

## Checkpoint after cycle 021

Live commit:

```text
470ee43  TDD 015-021: add persisted task management interactions
```

Verified on Windows:

```text
Tests: 34 passed
Build: passed
Lint: 0 warnings, 0 errors
Working tree: clean after commit
```

## Workflow after cycle 021

Beginning with the next batch, multi-cycle TDD work uses the fail-fast bundle runner documented in `CONTRIBUTING.md`.

The runner enforces the same RED/GREEN order; it automates the repetitive patch application and verification steps. It does not weaken the test-first requirement.
