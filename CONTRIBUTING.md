# Contributing

## Test-first rule

Behavioral production code must not be written before its failing test.

For each behavior:

1. define one observable behavior at a stable public seam;
2. add the test before implementation;
3. run the focused test and confirm RED for the expected reason;
4. add only the implementation needed to satisfy that behavior;
5. rerun the focused test and require GREEN;
6. refactor only while the suite stays green;
7. run the broader verification gate appropriate to the batch.

Do not create tests that merely assert comments, formatting, private function structure, or temporary configuration values.

## Tests are not changed to rescue implementation

Do not weaken, rewrite, delete, or bypass a test merely because the implementation fails it.

If a test appears incorrect, malformed, outdated, or underspecified:

1. stop the TDD sequence;
2. explain exactly what is wrong with the test;
3. explain the proposed test change and its effect on the requirement;
4. wait for user approval before changing that test.

Test-harness corrections such as DOM cleanup or build-boundary configuration may be made without changing behavior assertions, but they must be described explicitly.

## Fail-fast bundle workflow

Multi-cycle work should be delivered as a patch bundle with a fail-fast PowerShell runner.

A normal bundle contains:

```text
workspace-app-tdd-NNN-NNN/
  run-tdd.ps1
  manifest.json
  SHA256SUMS.txt
  patches/
    NNN-red.patch
    NNN-green.patch
    ...
```

The manifest pins the expected repository state and describes:

- the expected branch and starting commit;
- required files;
- ordered RED/GREEN cycles;
- the command used for each focused RED;
- text that must appear in the expected RED failure;
- GREEN verification commands;
- final test/build/lint/diff gates;
- the final commit message when automatic commit is enabled.

The runner must stop immediately if any assumption or gate fails. It must not:

- call `exit`;
- close the interactive terminal;
- run `git reset --hard`;
- run `git clean`;
- discard local changes;
- continue after an unexpected RED;
- continue after a failed GREEN.

Failure logs are written to `.tdd-logs/`.

## Git discipline

Important batches start from a known clean commit.

The runner checks preconditions before applying patches. If the repo is on the wrong branch, at the wrong checkpoint, or unexpectedly dirty, fix or inspect that condition rather than bypassing the check.

Automatic commits are allowed only after every final gate passes. If a bundle stops before that point, leave its partial state intact for review.

## Scope and architecture discipline

Prefer observable domain, application, persistence, and UI seams over speculative abstractions.

Do not add a dependency because it might be useful later. Add one only when a selected feature requires it, and review its license before adding it.

Keep browser/storage details out of domain code. Keep ID and time generation injectable where deterministic behavior matters.

## Copyright and product independence

Do not copy another product's source code, design assets, icons, screenshots, text, or branding.

General project-management concepts such as projects, tasks, statuses, priorities, filters, calendars, and boards may be implemented independently with original code and product wording.

## Verification

For ordinary local work:

```powershell
npm run check
git diff --check
```

For a TDD bundle, use the bundle runner instead of manually skipping between patches.


## Resuming a stopped bundle

A resume bundle may intentionally start from one known dirty file left by an
earlier stopped run. In that case the manifest must list the exact expected
`git status --porcelain` line and the SHA-256 of the expected modified file.

Do not disable the clean-tree guard generally. Resume exceptions must be pinned
to the exact partial state they are designed to continue from.


## Presentation-only post-steps

CSS and other presentation-only changes may be applied after the behavioral TDD
cycles are green. They must not add JavaScript behavior or alter a behavior test.
The final lint, test, build, and diff gates still apply.


## Bundle implementation rules learned on Windows

These are required for future generated bundles:

1. **RED semantics:** non-zero exit is required. The runner must also match stable test/file identifiers so an unrelated failure cannot count as RED.
2. **GREEN semantics:** zero exit is required. Never continue after a failed focused GREEN.
3. **Native stderr:** expected Vitest stderr during RED must be captured as output, not promoted to a terminating PowerShell exception.
4. **Guarded edits:** prefer guarded file transforms for existing source files. Compare normalized text SHA-256, ignoring only BOM and CR/LF representation; write canonical LF and preserve an existing UTF-8 BOM only when necessary.
5. **Resume state:** do not reset a stopped batch. A resume manifest must pin branch, HEAD, exact `git status --porcelain` entries, and hashes for the partial files it expects.
6. **Manifest optionals:** omitted optional collections must be treated as empty. Prefer explicitly writing `[]` for `expectedStatus`, `expectedFileSha256`, and `expectedNormalizedFileSha256` on clean-start bundles.
7. **Post-steps:** documentation and CSS may run only after behavioral cycles are GREEN. They still must pass lint, tests, production build, and `git diff --check`.
8. **Vite CSS typing:** if the browser entry imports CSS, keep `src/vite-env.d.ts` with `/// <reference types="vite/client" />`; otherwise TypeScript 6 with the current config can reject the side-effect CSS import with TS2882.
9. **Logs and terminal:** write logs to `.tdd-logs/`, never call `exit`, and never use destructive cleanup commands.
10. **Automatic commit:** commit only after focused GREENs and all final gates pass. A stopped batch remains uncommitted.

### What to send after a stop

Normally send the bundle log. If a resume precondition itself fails, also send:

```powershell
git rev-parse HEAD
git status --short
```

Do not manually apply the next GREEN patch. The resume bundle should encode the exact continuation.


## Vertical integration test rule

When one minimal implementation naturally satisfies both a domain test and its
browser interaction, put both expectations in the same RED cycle. Do not invent
a later RED that would already pass after the domain GREEN. Description search
in TDD 043 is the reference example.


## Persistence boundary rules

Persisted browser data is untrusted input. Validate the versioned document,
workspace arrays, project records, task records, optional task metadata, and
task-to-project relationships before exposing it to the application.

Store dispatch is transactional at the in-memory/persistence boundary: compute
the next reducer state, persist it, then publish it and notify subscribers. A
failed write must leave the previous state and subscriber observations intact.

Browser recovery belongs above the persistence boundary. Storage parsing keeps a
stable `Workspace storage is invalid` contract; BrowserApp converts that failure
to a user-facing recovery state and can deliberately replace invalid saved data
with an empty versioned workspace.


## Project-focus view state

Project focus is presentation state keyed by immutable project ID, not by project
name. Renaming therefore preserves focus. If the selected ID no longer exists,
derive an effective `all` selection rather than mutating state during render.

Project focus is intentionally not persisted in the workspace storage document.
Do not expand the persisted schema for a UI preference without a separate tested
storage design/migration decision.

## Living documentation and handoff

When a run teaches a durable rule, confirms a checkpoint, exposes a useful
failure mode, or changes architecture/behavior, update the relevant Markdown in
the next applicable bundle/maintenance step and update the aligned handoff.
Preserve useful historical fixes and always distinguish user-confirmed live state
from prepared target state.


## React external-store test synchronization

`WorkspaceRoot` consumes the application store through `useSyncExternalStore`.
When a test mutates that external store directly after `render`, synchronize the
mutation with React before reading the DOM.

Use `act(...)`, `findBy...`, or `waitFor(...)` as appropriate. This is required
for test synchronization only; do not weaken the product assertion or add
artificial production delays.

TDD 056 is the reference case: a direct `commands.renameProject(...)` call after
render was wrapped in `act(...)`, while the selected-project and renamed-heading
assertions stayed unchanged.


## View-preference persistence boundary

Do not add UI filters, search text, sort order, or selected-project focus to the
versioned workspace document merely to remember the current screen.

Use the separate versioned view-preference storage boundary. Workspace storage
is durable domain data and is validated strictly; view preferences are
non-critical UI state and invalid/unsupported preference documents fall back to
defaults.

When a project referenced by saved focus is deleted, repair the preference to
`all` at the user action boundary so the persisted view does not remain stale.


## Type ownership across boundaries

Import a type from the module that owns and defines it. A module that merely
uses a type does not automatically become a re-export boundary.

For example, `ViewPreferences` belongs to `domain/view-preferences.ts`.
`persistence/view-preferences-storage.ts` accepts and returns that type but does
not re-export it, so composition code must import the type from the domain
module.

Only import a type through another layer when that layer intentionally exports
it as part of its public API. This keeps dependency direction explicit and lets
the production TypeScript build catch accidental boundary assumptions that
transpile-only tests may not.


## Disposable preferences vs durable workspace data

Treat the two browser persistence documents differently:

- view preferences are non-critical UI state. Read failures, malformed values,
  unsupported versions, and write failures must not prevent the workspace from
  remaining usable;
- workspace projects/tasks are durable domain data. Reject duplicate entity IDs,
  invalid relationships, invalid metadata, and malformed creation timestamps.

When saved project focus references a project that no longer exists, normalize
it to `all` and attempt to persist the repair. If that repair write fails, keep
the normalized in-memory view anyway.

Resetting invalid workspace data also resets view preferences so recovery does
not immediately reapply stale filters or focus.


## Feature-first phase and FEATURES.md

`FEATURES.md` is the maintained product checklist. Update it whenever a feature
moves from planned to implemented, when a new core capability is identified, or
when scope is deliberately deferred.

During the current feature-first phase:

- prioritize domain behavior, application flows, persistence, recovery, and
  usable semantic controls;
- do not spend cycles on visual redesign, animation, spacing systems, icon
  systems, or cosmetic polish unless a minimal change is required for feature
  usability or accessibility;
- keep CSS/style work separate from behavior batches whenever possible;
- a feature is checked only after its behavior cycles and final gates pass.

Task movement is a relationship change, not task recreation: keep the same task
ID and metadata, validate that the target project exists, and let the normal
transactional workspace store persist the new relationship.


## Legal-safe competitor reference work

Competitor research may inform generic features, workflows, data relationships,
and product-management concepts. It must not be used as a pixel-copy or source
for proprietary expression.

Do not copy:

- competitor source code or bundled assets;
- screenshots, logos, icons, illustrations, or proprietary fonts;
- distinctive marketing wording or branded feature names;
- exact visual composition solely to make the product look like a competitor.

Prefer our own hierarchy, terminology, interaction details, and visual identity.
Use `CLICKUP_REFERENCE.md` as the maintained reference for this rule.


## Product identity and persistence identifiers

The visible working product name is **Yönlek** and the npm package name is
`yonlek`.

Do not rename `workspace-app.workspace` or
`workspace-app.view-preferences` merely for branding. They are established
persistence identifiers; changing them without migration would strand existing
local data.

## Areas

Areas are optional durable groupings above Projects.

- Project identity is unchanged by Area assignment.
- Deleting an Area preserves its Projects and clears their `areaId`.
- Version-1 workspace documents without `areas` remain valid.
- When Areas are present, validate records, duplicate Area IDs, and
  Project-to-Area references.
- Keep Area behavior separate from the eventual visual navigation design.


## Repository-file access in jsdom tests

A Vitest test running under `jsdom` must not assume that `import.meta.url`
resolves to a Node `file:` URL.

When a test needs to inspect repository files such as `index.html` or
`package.json`, use an explicit filesystem path rooted at the repository, for
example:

```ts
import { resolve } from 'node:path'

readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
```

TDD 085 is the reference case. The original test used
`readFileSync(new URL(..., import.meta.url))` and failed before reaching its
product assertions because the URL scheme was not `file:` under the jsdom
execution. The approved correction changed only file location; all Yönlek and
storage-key assertions remained unchanged.


## RED markers for missing-module cycles

When the intended first RED is that a new module does not exist yet, Vitest can
fail during module collection before individual `it(...)` cases are collected.
In that situation, RED validation must use stable file/module markers, for
example the test file path and `Cannot find module './area'`.

Do not require individual test-case names for a collection-time missing-module
RED because those names may never appear in output.

TDD 086 is the reference case. The test itself was correct and remained
unchanged; only the fail-fast runner's expected RED markers were corrected.


## Lists and task-container integrity

Lists are optional durable containers inside Projects.

- A List must reference an existing Project.
- A Task may omit `listId` for backward compatibility.
- If a Task has `listId`, that List must exist and belong to the same Project as
  the Task.
- Moving a Task to another Project clears its current List assignment unless a
  later behavior explicitly chooses a compatible target List.
- Deleting a List preserves its Tasks and clears their `listId`.
- Deleting a Project removes that Project's Lists and Tasks but must preserve
  unrelated workspace layers such as Areas.
- Version-1 storage remains backward-compatible with documents that do not
  contain `lists`.

Automated commit messages should prefer ASCII-only wording while nested
PowerShell/Git output still displays Unicode inconsistently. This affects
terminal display only; product files continue to use `Yönlek`.


## Optional collection shape compatibility

`areas` and `lists` remain optional fields in `WorkspaceState` for storage and
state-shape backward compatibility.

When a reducer operation has no surviving values for an optional collection
that was already empty, it does not need to introduce that empty collection
into a state shape that previously exposed only `projects` and `tasks`.

However, reducers must preserve real unrelated data:

- non-empty Areas survive Project deletion;
- Lists belonging to other Projects survive Project deletion;
- deleting a Project removes only that Project's Lists and Tasks.

TDD 096 is the reference case. A new Project-delete implementation correctly
preserved hierarchy data but also introduced empty `areas`/`lists` arrays into
an older command test's exact state shape. The correction was implementation
only; the existing behavior test was not changed.


## Subtask hierarchy integrity

Subtasks use the existing `Task` entity with optional `parentTaskId`.

- A parent reference must resolve to an existing Task.
- Parent and child must belong to the same Project.
- Persistence rejects cycles in the parent chain.
- Creating a Subtask inherits the parent's Project and current List.
- Deleting a Task cascades through all descendants.
- Moving a root/parent Task across Projects moves its descendants and clears
  incompatible List assignments.
- Moving a Subtask away from its parent Project by itself is rejected.
- Existing Tasks without `parentTaskId` remain valid and require no migration.

Do not create a parallel `Subtask` entity unless a later invariant requires
data that cannot be represented by Task + parent relationship.


## Stable task-title semantics for adjacent summaries

Task titles are stable semantic text used by interaction tests and UI queries.
Do not append counters, badges, status text, or other summaries directly into
the Task title string.

Render adjacent summaries as separate semantic elements. For example, immediate
Subtask counts use a dedicated label such as:

```tsx
<span>{task.title}</span>
<span aria-label={`Subtask count for ${task.title}`}>
  {count === 1 ? '1 subtask' : `${count} subtasks`}
</span>
```

TDD 107 is the reference case. The first GREEN implementation appended the
Subtask count to every Task title. The new count assertion passed, but 10 older
interaction tests could no longer locate Tasks by their exact titles. With user
approval, only the new TDD 107 assertion was corrected; existing tests were not
changed or weakened.


## Checklist integrity

Checklists are Task-local lightweight data, distinct from Subtasks.

Each Checklist item contains:

- `id`
- `text`
- `completed`

Rules:

- Checklist item text is trimmed and must be non-empty.
- Item IDs are unique within the containing Task.
- Checklist item identity is Task-local; do not require global uniqueness
  across different Tasks.
- Deleting the final Checklist item removes the optional `checklist` field
  rather than persisting an unnecessary empty array.
- Checklist completion does not change Task status.
- Checklist progress is adjacent summary text and must not be appended to the
  stable Task title.
- Existing Tasks without `checklist` remain valid and require no migration.


## Manual ordering

Manual order is represented by durable array order, not by numeric position
fields.

Sibling scopes:

- Areas: all Areas.
- Projects: same `areaId`, including the unassigned group.
- Lists: same `projectId`.
- Tasks/Subtasks: same `projectId`, `listId`, and `parentTaskId`.
- Checklist items: same containing Task.

Rules:

- Reordering swaps the selected item with its nearest sibling in the requested
  direction.
- Items outside the sibling scope retain their array positions.
- Boundary moves are no-ops and remain immutable.
- Task reorder controls are exposed when Task sort is `manual`; other sort modes
  continue to derive display order independently.
- `created` remains the default Task sort.
- Workspace arrays already round-trip in order through version-1 persistence;
  do not add position fields solely for local manual ordering.
- Drag-and-drop is a later interaction layer over these commands, not a separate
  ordering model.


## Tag integrity

Tags are reusable workspace-level definitions. Tasks reference them by ID.

Rules:

- `WorkspaceState.tags` remains optional for backward compatibility.
- `Task.tagIds` remains optional; deleting the final assignment removes it.
- Tag names are trimmed and non-empty.
- Tag identity is ID-based; this batch does not enforce unique names.
- Tag IDs must be unique across the workspace.
- Task `tagIds` must be unique within the Task and reference existing Tags.
- Assigning the same Tag twice is idempotent.
- Deleting a Tag preserves Tasks and removes that Tag ID from all Tasks.
- Deleting the final Tag removes the optional `tags` collection instead of
  forcing an empty array into older state shapes.
- Existing version-1 workspace documents without Tags remain valid.
- Tag colors and visual badge styling are deferred; do not couple semantic Tag
  identity to a presentation color.
