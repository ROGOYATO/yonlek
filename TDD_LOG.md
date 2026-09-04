# TDD log

## Current verified behavior checkpoint

The latest user-confirmed behavior commit is:

```text
d976d0d  TDD 145-147: add task duplication
```

Verified on Windows from `C:\Users\yavuz\git\yonlek`:

```text
Tests: 305 passed
Lint: 0 warnings, 0 errors
Build: passed
Working tree: clean after commit
Push: origin/main updated
```

The repository folder was renamed from `workspace-app` to `yonlek` before this
batch. The first rename attempt failed because the interactive PowerShell shell
was still inside the directory. After moving to `C:\Users\yavuz\git`, the
rename succeeded without changing Git history or repository contents.

A later documentation-only commit can advance repository HEAD without changing
this behavior checkpoint.

This log records completed behavior cycles. RED was observed before the
corresponding production implementation unless a row is explicitly marked as
workflow or configuration work.

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

The runner enforces the same RED/GREEN order. It automates patch application and
verification, but it does not weaken the test-first requirement.

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

Operational rule: an expected RED failure is part of the cycle. An unexpected
RED, failed GREEN, failed diff check, lint failure, test failure, or build
failure stops the batch. Preserve that stopped state and resume from the exact
Git state instead of resetting it.

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

## Cycles 101-107

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 101 | Subtask creation domain behavior | GREEN |
| 102 | Parent validation and descendant deletion | GREEN |
| 103 | Subtask application command | GREEN |
| 104 | Bare-bone Subtask creation/relationship UI | GREEN |
| 105 | Parent persistence validation, cycle rejection, browser reload | GREEN |
| 106 | Parent/descendant Project-move integrity | GREEN |
| 107 | Immediate Subtask counts | GREEN |

Expected successful checkpoint:

```text
Tests: 189 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Subtasks reuse Task behavior and remain backward-compatible through optional
`parentTaskId`.

## TDD 107 GREEN title/count correction

The first TDD 107 GREEN implementation rendered Task titles and immediate
Subtask counts as one text string, for example:

```text
Draft experiment plan (1 subtask)
```

The new TDD 107 count test passed, but 10 established WorkspaceRoot tests
failed because exact Task titles are stable semantic locators.

No existing test was changed.

With explicit user approval, the new TDD 107 test was corrected to preserve the
established title contract and assert the count through a separate labeled
element:

```text
Draft experiment plan
1 subtask
```

The implementation was changed accordingly. The full WorkspaceRoot suite must
pass before post-107 documentation and final checks run.

## Cycles 108-113

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 108 | Checklist item domain behavior | GREEN |
| 109 | Task-local Checklist reducer lifecycle | GREEN |
| 110 | Checklist application commands | GREEN |
| 111 | Bare-bone Checklist interaction UI | GREEN |
| 112 | Checklist persistence validation and browser reload | GREEN |
| 113 | Checklist completed/total progress summary | GREEN |

Expected successful checkpoint:

```text
Tests: 206 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Checklist data is optional and nested under Task, so existing stored Tasks remain
backward-compatible without a storage-version migration.

## Cycles 114-118

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 114 | Generic immutable sibling-order helper | GREEN |
| 115 | Area/Project/List/Task/Checklist sibling-order reducer behavior | GREEN |
| 116 | Manual-order application commands | GREEN |
| 117 | Manual Task sort and view-preference persistence | GREEN |
| 118 | Bare-bone Move up/down UI controls | GREEN |

Expected successful checkpoint:

```text
Tests: 220 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Manual ordering reuses persisted array order and does not change workspace
storage version 1.

## Cycles 119-124

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 119 | Tag create/rename domain behavior | GREEN |
| 120 | Workspace Tag lifecycle and delete cleanup | GREEN |
| 121 | Task-to-Tag assignment integrity | GREEN |
| 122 | Tag application commands | GREEN |
| 123 | Bare-bone Tag management and Task assignment UI | GREEN |
| 124 | Tag persistence validation and browser reload | GREEN |

Expected successful checkpoint:

```text
Tests: 238 passed
Build: passed
Lint: 0 warnings, 0 errors
```

Tags are additive optional data in workspace storage version 1, so existing
saved workspaces remain valid without migration.

## Cycles 125-130

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 125 | Person create/rename domain behavior | GREEN |
| 126 | Workspace Person lifecycle and delete cleanup | GREEN |
| 127 | Task-to-Person assignee integrity | GREEN |
| 128 | Person / assignee application commands | GREEN |
| 129 | Bare-bone People management and Task assignment UI | GREEN |
| 130 | Person persistence validation and browser reload | GREEN |

Expected successful checkpoint:

```text
Tests: 253 passed
Build: passed
Lint: 0 warnings, 0 errors
```

People and assignee references are additive optional data in workspace storage
version 1, so existing saved workspaces remain valid without migration.

## Cycles 131-136

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 131 | Typed Custom Field definition/value domain | GREEN |
| 132 | Workspace definition lifecycle and delete cleanup | GREEN |
| 133 | Task typed Custom Field value integrity | GREEN |
| 134 | Custom Field application commands | GREEN |
| 135 | Bare-bone definition/value UI | GREEN |
| 136 | Custom Field persistence validation and browser reload | GREEN |

Prepared successful checkpoint:

```text
Expected tests: 280
Build: passed
Lint: 0 warnings, 0 errors
Push: origin/main after local commit
```

The test count is an estimate; the actual runner count is authoritative.

Workflow change beginning with this bundle: after a successful local commit and
clean-tree check, the runner verifies `origin` and performs a non-force push to
`main`. Push failure leaves the local commit intact.

### TDD 135 controlled text-input draft correction

The first GREEN implementation normalized a Text Custom Field on every
`onChange`. Because normalization trims leading/trailing whitespace, a
controlled input could erase the space while the user was still typing
`Inspect mount`, producing `Inspectmount`.

The behavior test was correct and unchanged. The implementation now keeps a
local text draft while the input is focused and commits the normalized value on
blur. Number and Checkbox values remain typed at their existing boundaries.

## Post-TDD 136 lint and push maintenance

TDD 131-136 completed locally at commit `8fc915a` with 280/280 tests and a
passing production build. The final lint invocation still emitted two warnings:

- unnecessary empty fallback in a Custom Field value object spread;
- an unused local variable in the new Custom Field UI test.

The previous `oxlint .` command returned success despite warnings, so the runner
continued to commit. Remote delivery then failed because the HTTPS remote helper
aborted.

Maintenance:

- remove both lint warnings without changing behavior assertions;
- change the lint script to `oxlint . --deny-warnings`;
- rerun the complete check and diff gates;
- create a small maintenance commit;
- retry non-force push only after a clean local commit.

## Cycles 137-144

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 137 | Project deletion preserves newer workspace metadata | GREEN |
| 138 | Task relationship domain and Related canonicalization | GREEN |
| 139 | Relationship lifecycle, duplicates, and deletion cleanup | GREEN |
| 140 | Dependency cycle and self-link rejection | GREEN |
| 141 | Relationship application commands | GREEN |
| 142 | Bare-bone relationship UI | GREEN |
| 143 | Persistence validation and browser reload | GREEN |
| 144 | Blocks / Blocked-by / Related summaries | GREEN |

Confirmed checkpoint:

```text
44a1087  TDD 137-144: add task relationships
Tests: 302 passed
Lint: 0 warnings, 0 errors
Build: passed
Working tree: clean after commit
Push: origin/main updated
```

Runner workflow from this batch forward pins Git for Windows at
`C:\Program Files\Git\cmd\git.exe` for every Git operation.

### TDD 141 GREEN compatibility correction

The new relationship command passed, but the full command suite found an older
Project-deletion shape regression:

```text
expected: { projects: [], tasks: [] }
received: { areas: [], lists: [], projects: [], tasks: [] }
```

Cause: the TDD 137 metadata-preservation implementation spread the entire
workspace state and therefore preserved already-empty optional `areas` and
`lists`.

No test changed. The reducer now preserves newer workspace metadata while
retaining the established optional-shape behavior for Areas and Lists.

### TDD 142 GREEN title-semantic correction

The first relationship UI GREEN implementation rendered every candidate Task
title as bare `<option>` text. Filtered-out Task titles therefore remained in
the DOM, and exact-title queries became ambiguous.

Relationship behavior itself was working: the Related relationship test passed,
and the Blocks test reached its correct relationship summaries. No test changed.

Relationship target option text is now `Target: <task title>` while the option
value remains the Task ID.

## Cycles 145-147

| Cycle | Behavior / boundary | Result |
| --- | --- | --- |
| 145 | Task duplication domain copy semantics | GREEN |
| 146 | Persisted Task duplication command through existing `task/added` path | GREEN |
| 147 | Bare-bone Duplicate Task UI control | GREEN |

Confirmed checkpoint:

```text
d976d0d  TDD 145-147: add task duplication
Tests: 305 passed
Lint: 0 warnings, 0 errors
Build: passed
Working tree: clean after commit
Push: origin/main updated
```

### TDD 145

The domain RED failed because `duplicateTask` did not exist. GREEN added a pure
Task copy operation that accepts the new ID and timestamp as inputs.

The duplicate keeps the source Task's Project, List, parent, status, priority,
due date, description, Checklist, Tag IDs, assignee IDs, and Custom Field
values. Task-owned arrays and records are copied into separate containers.

### TDD 146

The application RED failed because `WorkspaceCommands.duplicateTask` did not
exist. GREEN made the command obtain a new ID and timestamp from the injected
runtime, call the Task domain function, and persist the result through the
existing `task/added` action.

This reuses the established Task-add validation and transactional persistence
path instead of introducing a second way to insert Tasks.

### TDD 147

The UI RED failed because no accessible `Duplicate task <title>` button existed.
GREEN added that Task control and wired it to the command boundary.

The full WorkspaceRoot suite then passed with 58 tests.

### Duplication boundary

Duplicating a Task copies one Task entity only.

It does not copy child Tasks because they are separate Task records with
`parentTaskId` references. It does not copy `blocks` or `related` relationships
because those edges are workspace-level records. Copying either would modify the
workspace graph rather than duplicate one Task.

### Repository rename before TDD 145

The local folder rename was intentionally separate from product behavior.

The first Windows rename attempt failed while PowerShell was still located in:

```text
C:\Users\yavuz\git\workspace-app
```

After `cd ..`, the same guarded rename succeeded:

```text
C:\Users\yavuz\git\workspace-app
→ C:\Users\yavuz\git\yonlek
```

The branch remained `main`, HEAD remained `44a1087`, and `origin` remained
`https://github.com/ROGOYATO/yonlek.git`.

## Documentation refresh after TDD 147

This maintenance pass updates all seven tracked root Markdown files from the confirmed
`d976d0d` behavior baseline.

The purpose is documentation consistency, not product behavior:

- make the `yonlek` repository and local-folder rename explicit;
- replace prepared TDD 137-147 checkpoints with the user-confirmed commits and
  actual test counts;
- explain Task duplication across domain, command, and UI boundaries;
- explain why `workspace-app.*` browser storage keys remain unchanged;
- separate current product state from competitor research and future work;
- keep naming research preliminary until formal trademark clearance;
- retain the historical TDD and regression lessons instead of rewriting them as
  if they were new behavior.

No application or test file is part of this documentation change. The docs-only
bundle still runs the normal lint, full test, production build, and diff gates
before it can commit.

The first prepared docs bundle had a PowerShell parser error and never executed.
The corrected r2 runner passed syntax preflight, then stopped before writing. Its
reconstructed handoff snapshot incorrectly treated `YONLEK_NAME_RESEARCH.md` as
a tracked repository file. The seven real docs had already passed existence and
baseline-hash checks when the missing-file guard stopped the run. The corrected
workflow now verifies Git's tracked Markdown set before any write and uses
`BRAND_NAME_RESEARCH.md` as the single naming record.

The r2 invocation also exposed a separate PSReadLine rendering failure while a
long multi-line command was being pasted. The bundle had not started during
those console exceptions. Future bundles should ship a standalone launcher so
the operator can use one short PowerShell command instead of an interactive
continuation block.

### Docs refresh r3 warning-capture stop

The r3 docs runner started from clean `d976d0d`, verified the exact seven-file
tracked Markdown set, and wrote all seven guarded documentation targets. It then
stopped at the first documentation-consistency Git query before staging.

The repository was left in a known dirty state with those seven Markdown files
modified and nothing staged, committed, or pushed.

The failure was in the runner's Git-output helper, not in Git or the docs. The
helper used `2>&1` while `$ErrorActionPreference = 'Stop'`. Git emitted the
normal Windows warning that LF would be replaced by CRLF the next time Git
touched `BRAND_NAME_RESEARCH.md`. Windows PowerShell 5.1 promoted that stderr
line to `NativeCommandError` even though the Git command itself had not reported
a failing exit code.

The resume runner keeps stderr visible instead of merging it into parsed stdout
and uses `$LASTEXITCODE` as the native-command result. It also pins the exact
seven-file dirty status and normalized hashes before continuing, so the resume
cannot overwrite unrelated work.
### Docs refresh r4 source-encoding stop

The r4 resume runner correctly recognized the exact seven-file dirty state left
by r3, applied the guarded documentation target, and reached documentation
consistency checks. It then stopped before staging because one runner assertion
contained the literal product name in UTF-8 source.

The Markdown payload was valid UTF-8. The failure was in Windows PowerShell 5.1
source decoding: a UTF-8-without-BOM `.ps1` file can be read through legacy
code-page rules, so the assertion string became mojibake before `ReadAllText`
compared it with the correctly decoded Markdown file.

The next resume keeps executable PowerShell source ASCII-only. Its preflight
checks raw script bytes for values above `0x7F` and then runs the normal parser
check. Unicode documentation assertions use ASCII substrings unless the exact
code point is itself part of the contract.
