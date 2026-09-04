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


## Cycles 022-030

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 022 | Rename a project with normalization and blank-name validation | GREEN |
| 023 | Workspace reducer project-name change without mutation | GREEN |
| 024 | Project rename application command | GREEN |
| 025 | Project rename UI and blank-rename feedback | GREEN |
| 026 | Pure task filtering by query, status, and priority | GREEN |
| 027 | Task-title search UI | GREEN |
| 028 | Task status filter UI | GREEN |
| 029 | Task priority filter UI | GREEN |
| 030 | Clear task search/status/priority filters together | GREEN |

Expected successful checkpoint:

```text
Tests: 46 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Workflow maintenance 003 adds exact partial-state validation for safe resume
bundles. Cycle 022 was moved to a new test file so the historical BOM in
`src/domain/project.test.ts` remains untouched.


## Cycles 031-038

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 031 | Optional task due date domain behavior and calendar-date validation | GREEN |
| 032 | Workspace reducer task due-date change | GREEN |
| 033 | Task due-date application command | GREEN |
| 034 | Set and clear task due date through the UI | GREEN |
| 035 | Pure due-date-presence filtering | GREEN |
| 036 | Due-date filter UI | GREEN |
| 037 | Pure immutable task sorting | GREEN |
| 038 | Task sort UI | GREEN |

User-confirmed behavior checkpoint before the build-boundary correction:

```text
Tests: 59 passed
TDD 031-038 focused GREENs: passed
Lint: passed
Build: stopped with TS2882 on the new ./styles.css side-effect import
Commit: not created
```

Configuration correction after cycle 038:

- add `src/vite-env.d.ts` with the Vite client type reference;
- do not change a behavior test;
- rerun the production build, full `npm run check`, and `git diff --check`;
- commit only after those gates pass.

The post-step adds presentation-only CSS and imports it from the browser entrypoint. No dependency is added.


## Bundle workflow corrections recorded through cycle 038

| Maintenance | Correction |
| --- | --- |
| runner v2 | UTF-8 console output and post-cycle maintenance support |
| runner v3 | exact dirty-state and checksum validation for resume bundles |
| runner v4 | expected RED stderr/non-zero exits no longer abort PowerShell before RED validation |
| runner v5 | guarded content transforms replace BOM/CRLF-sensitive source patches |
| runner v6 | normalized-content resume hashes and canonical LF guarded writes |
| runner v7 | optional manifest collections are null-safe; clean bundles use explicit empty checksum arrays |
| build fix after 038 | Vite client type declaration added for the CSS side-effect import |

Important operational rule: a failed RED is expected; an unexpected RED, failed GREEN, failed diff check, lint failure, test failure, or build failure stops the batch. Stopped state is preserved and resumed from exact Git state rather than reset.


## Cycles 039-045

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 039 | Optional task description normalization and clearing | GREEN |
| 040 | Workspace reducer task-description change without mutation | GREEN |
| 041 | Task-description application command | GREEN |
| 042 | Set and clear task descriptions through the UI | GREEN |
| 043 | Search task titles and descriptions at domain and UI seams | GREEN |
| 044 | Immutable priority sorting: high, normal, low | GREEN |
| 045 | Priority sort UI | GREEN |

Expected successful checkpoint:

```text
Tests: 69 passed
Build: passed
Lint: 0 warnings, 0 errors
```

TDD 043 intentionally places the domain and browser description-search
expectations in one RED cycle because one filter implementation satisfies both.
A separate later browser RED would already have been GREEN and would violate the
test-first sequencing rule.


## Cycles 046-053

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 046 | Failed persistence writes leave store state and subscribers unchanged | GREEN |
| 047 | Malformed JSON produces a stable invalid-storage error | GREEN |
| 048 | Versioned workspace document requires project/task arrays | GREEN |
| 049 | Persisted project records are validated | GREEN |
| 050 | Persisted task core fields, status, and priority are validated | GREEN |
| 051 | Optional task metadata and project relationships are validated | GREEN |
| 052 | BrowserApp renders a readable invalid-storage recovery state | GREEN |
| 053 | User can reset invalid saved data and re-enter an empty workspace | GREEN |

Expected successful checkpoint:

```text
Tests: 82 passed
Build: passed
Lint: 0 warnings, 0 errors
```

The persistence parser deliberately distinguishes an unsupported version from
invalid data. BrowserApp does not parse storage independently; it catches the
storage boundary's stable error and owns the user-facing recovery action.


## Confirmed checkpoint after cycle 053

User-confirmed at commit `ab244c6`:

```text
Tests: 82 passed
Build: passed
Lint: 0 warnings, 0 errors
git diff --check: passed
Working tree: clean after commit
```


## Cycles 054-060

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 054 | Task summary counts total/todo/doing/done | GREEN |
| 055 | Per-project completed-task summary updates with task status | GREEN |
| 056 | Focus one project by ID; rename preserves focus | GREEN |
| 057 | Deleting the focused project falls back to all projects | GREEN |
| 058 | Project selector includes task counts | GREEN |
| 059 | Project view reports visible vs total tasks after filters | GREEN |
| 060 | Workspace aggregate project/task/done summary | GREEN |

Expected successful checkpoint:

```text
Tests: 90 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Project focus remains UI state only. It stores project IDs rather than names and
uses a derived fallback when the selected project disappears.

Documentation/handoff maintenance is a living-project rule from the confirmed
TDD 053 checkpoint onward.


## TDD 056 test synchronization correction

The first TDD 056 GREEN verification exposed a React test synchronization issue,
not a product-behavior defect. The project selector retained the selected
project ID, but the test called `commands.renameProject(...)` directly after
render and asserted the renamed heading before React flushed the
`useSyncExternalStore` update.

With user approval, only that mutation was wrapped in `act(...)`. Behavioral
assertions were left unchanged. The corrected focused GREEN must pass before
TDD 057 begins.


## Cycles 061-068

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 061 | View-preference defaults and immutable updates | GREEN |
| 062 | Separate versioned view-preference storage round-trip | GREEN |
| 063 | Invalid/unsupported preferences fall back to defaults | GREEN |
| 064 | Workspace UI initializes from supplied preferences | GREEN |
| 065 | Workspace UI reports preference changes without changing domain state | GREEN |
| 066 | BrowserApp restores saved preferences | GREEN |
| 067 | BrowserApp persists preference changes separately from workspace data | GREEN |
| 068 | Deleting focused project repairs saved focus to All projects | GREEN |

Expected successful checkpoint:

```text
Tests: 102 passed
Build: passed
Lint: 0 warnings, 0 errors
```

The preference document is intentionally separate from `workspace-app.workspace`.
Invalid workspace data remains a recovery/error condition; invalid view
preferences are disposable and fall back to defaults.


## TDD 068 production-build correction

All TDD 061-068 focused GREENs completed and the final test suite reached
102/102 with clean lint. The production TypeScript build then stopped with
TS2724 because `BrowserApp.tsx` imported the `ViewPreferences` type from
`persistence/view-preferences-storage.ts`, which consumes but does not export
that type.

No behavior test was changed. The build-boundary correction imports
`ViewPreferences` from its defining module, `domain/view-preferences.ts`, then
reruns the production build, full `npm run check`, and diff gates before commit.

Durable rule: type ownership follows the defining module unless another
boundary intentionally re-exports the type as public API.


## Cycles 069-075

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 069 | Preference storage read failure falls back to defaults | GREEN |
| 070 | Preference write failure does not block UI view changes | GREEN |
| 071 | Missing saved project focus is repaired to All projects at startup | GREEN |
| 072 | Resetting invalid workspace data also resets view preferences | GREEN |
| 073 | Duplicate persisted project IDs are rejected | GREEN |
| 074 | Duplicate persisted task IDs are rejected | GREEN |
| 075 | Persisted project/task creation timestamps must be canonical ISO instants | GREEN |

Expected successful checkpoint:

```text
Tests: 110 passed
Build: passed
Lint: 0 warnings, 0 errors
```

The persistence policy is intentionally asymmetric: view preferences degrade to
defaults or best-effort saves, while durable workspace data fails closed when
identity or timestamp invariants are invalid.


## Cycles 076-084

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 076 | Task project reassignment domain mutation | GREEN |
| 077 | Reducer moves tasks only to existing projects | GREEN |
| 078 | Application command moves a task between projects | GREEN |
| 079 | Task-move UI, focused-project behavior, and browser persistence | GREEN |
| 080 | Optional project-description domain behavior | GREEN |
| 081 | Reducer project-description action | GREEN |
| 082 | Project-description application command | GREEN |
| 083 | Set and clear project descriptions through the UI | GREEN |
| 084 | Persisted project descriptions are validated | GREEN |

Expected successful checkpoint:

```text
Tests: 126 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Product sequencing decision: continue building bare-bone features before a
dedicated styling/UI-polish phase. `FEATURES.md` is the checklist for that
sequence and must remain aligned with confirmed implementation state.


## Product-direction research after TDD 075

Public ClickUp documentation was reviewed for feature breadth and architecture.

Durable decisions:

- pursue broad functional capability, not visual cloning;
- keep an independent hierarchy: Workspace → Area → Project → List → Task →
  Subtask;
- prioritize hierarchy, richer task entities, multiple views, relationships,
  automation, and knowledge features before final styling;
- defer multi-user permissions/backend collaboration until the local domain
  model is broader and stable;
- keep `FEATURES.md` as the roadmap;
- use `CLICKUP_REFERENCE.md` as a legal-safe capability reference;
- keep `Yönlek` as a preliminary working name only until trademark clearance.


## Cycles 085-092

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 085 | Product-facing Yönlek identity while preserving storage keys | GREEN |
| 086 | Area create/rename domain behavior | GREEN |
| 087 | Workspace Area add/rename/delete actions | GREEN |
| 088 | Project-to-Area assignment and Area-delete cleanup | GREEN |
| 089 | Area and Project-Area application commands | GREEN |
| 090 | Area management and Project-Area UI | GREEN |
| 091 | Area persistence validation and browser reload composition | GREEN |
| 092 | Per-Area Project summaries | GREEN |

Expected successful checkpoint:

```text
Tests: 148 passed
Build: passed
Lint: 0 warnings, 0 errors
```

No styling-system or visual redesign is part of this batch.


## TDD 085 test-harness correction

The first TDD 085 GREEN verification stopped after the product-facing Yönlek
changes were applied. `App.test.tsx` and the recovery-screen identity assertion
passed, but the repository-file identity test crashed before checking
`index.html` or `package.json`.

Cause:

```text
TypeError: The URL must be of scheme file
```

The test used `readFileSync(new URL(..., import.meta.url))` under a jsdom
environment. With user approval, only the file-location mechanism was changed
to `resolve(process.cwd(), ...)`. No product assertion was weakened or removed.

The corrected TDD 085 focused GREEN must pass before TDD 086 begins.


## TDD 086 RED-marker correction

The first TDD 086 run stopped even though the new Area test failed for the
intended reason: `./area` did not exist yet. Vitest failed while collecting the
suite, so no individual test names were emitted. The runner had incorrectly
required those test-name strings.

The test was not changed. The exact stopped RED state was preserved, TDD 086 was
resumed with `redAlreadyApplied`, and RED validation was corrected to require
stable file/module markers:

```text
src/domain/area.test.ts
Cannot find module './area'
```

Durable rule: collection-time REDs use collection/file/module evidence rather
than assertions that cannot run before import succeeds.


## Cycles 093-100

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 093 | List create/rename domain behavior | GREEN |
| 094 | Workspace List lifecycle and Project-delete cleanup | GREEN |
| 095 | Task-to-List invariants and Project-move cleanup | GREEN |
| 096 | List application commands | GREEN |
| 097 | List management and Task-List UI | GREEN |
| 098 | List persistence validation and browser reload | GREEN |
| 099 | Per-List Task counts | GREEN |
| 100 | Create Tasks directly in a selected List | GREEN |

Expected successful checkpoint:

```text
Tests: 171 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Lists remain optional in storage version 1 so existing saved workspaces continue
to load without migration.


## TDD 096 GREEN compatibility correction

TDD 096's new List command behavior passed, but GREEN verification also exposed
an older exact-state assertion after deleting the final Project.

Observed state:

```text
{ areas: [], lists: [], projects: [], tasks: [] }
```

Existing expected state:

```text
{ projects: [], tasks: [] }
```

The test was not changed or weakened.

Cause: TDD 094's Project-delete implementation spread the entire state to
preserve Areas and Lists, which also introduced empty optional collections into
the historical state shape.

Implementation correction:

- preserve non-empty Areas;
- filter and preserve Lists when Lists existed;
- avoid introducing empty optional collections when there is no unrelated data
  to preserve.

The corrected reducer must satisfy both the existing command test and the new
Project-delete hierarchy test before TDD 097 begins.
