# Contributing

## Current repository contract

The current user-confirmed behavior baseline is:

- branch: `main`
- confirmed starting commit for TDD 261-265: `f24f767` (`TDD 256-260: add Task time tracking`)
- local repository: `C:\Users\yavuz\git\yonlek`
- remote: `https://github.com/ROGOYATO/yonlek.git`
- verified suite at that checkpoint: 482 tests across 140 files
- lint: 0 warnings and 0 errors
- production build: passed
- post-commit tree: clean
- push: `origin/main` updated successfully

The repository, npm package, and product slug use `yonlek`. The browser storage
keys intentionally keep the historical `workspace-app.*` prefix until a tested
migration is added.

## Checkpoint documentation

Do not describe a parent commit SHA as the latest checkpoint inside a feature
commit that supersedes it. A commit cannot contain its own final SHA without
changing that SHA. Record the last confirmed starting commit explicitly, then
record the new TDD range and live verification result after the runner finishes.

For private-repository work, prefer a clean `git archive` of the confirmed HEAD
as the preparation source. Live runners still precheck every existing-file patch
against the checkout before creating the first RED file.

## View preference compatibility

View preferences use a separate version-1 document. Additive preference fields may
remain optional when absence has one explicit effective default. The loader must
accept old version-1 documents without the field, validate any supplied value, and
keep workspace data unchanged. Do not bump the preference-storage version only to
add an optional field with backward-compatible semantics.


## Saved filter set boundary

Saved filter sets are part of the separate view-preference document. They keep
the Task search query, status filter, priority filter, due-date presence filter,
and at most one active Custom Field filter. Do not put Project focus, built-in or
Custom Field sort, grouping, workspace IDs, or Task data into a saved filter set.
Those settings belong to broader saved-view behavior.

Names are trimmed and non-empty. Saving the same normalized name replaces that
preset in place instead of creating a duplicate. Version-1 preference documents
that do not contain `savedFilterSets` remain valid. If the collection is present,
validate each preset and reject duplicate names.

## Saved view boundary

Saved views are broader than saved filter sets but remain view-preference data. A
saved view keeps Project focus, Task search, status, priority, due-date filter,
optional Custom Field filter, built-in sort, optional Custom Field sort, and
grouping. It must not copy workspace data or the `savedFilterSets` collection.

Saved-view names are trimmed, non-empty, and unique after normalization. Saving
the same normalized name replaces the existing view in place. Version-1
preference documents without `savedViews` remain valid; supplied collections must
validate every view and reject duplicate names.

## Custom Field filter and sort boundary

Custom Field filter/sort settings are disposable view-preference state, not
workspace data. The filter stores a stable field ID, the field type, and one
normalized primitive value. The sort stores one stable field ID. Preference
storage validates those structures without requiring the referenced Workspace
field to exist, because the two documents load independently.

At runtime the Workspace definition is authoritative. Missing fields, type
mismatches, or removed Select options make stale filter/sort references inactive
instead of throwing or hiding every Task. Text filters use case-insensitive
substring matching. Number, Checkbox, Select, and Date filters use exact typed
matching. Sorts are ascending, place missing values last, use Task `createdAt`
for ties, and use Select option order rather than option labels.


## PowerShell Git scalar output

PowerShell can unroll one-line command output to a scalar string. Indexing that
result with `[0]` then returns the first character, so `main` can become `m`.
When a Git command must return one scalar value, collect the output, require
exactly one line, and return that complete line without indexing the string.
Use the same helper for branch, HEAD, and remote guards.

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

Test-harness corrections such as DOM cleanup or build-boundary configuration
may be made without changing behavior assertions, but they must be described
explicitly.

Vitest file-level concurrency is capped at four workers because the full UI suite
can exceed the unchanged 5-second test timeout under all-core parallel load even
when the same tests pass in isolation. Do not remove the cap, raise the timeout,
or change worker/pool settings as a shortcut; reproduce the baseline and target
states first.

For rendered tests, scope assertions to the semantic section that owns the
behavior when the same text can legitimately appear elsewhere. Prefer
`within(...)` on the relevant Project, archive, or template section over global
`getAllByText(...)` counts. A global count is brittle when another valid UI
representation repeats the same domain text.

## Fail-fast bundle workflow

Multi-cycle work should be delivered as a patch bundle with a fail-fast PowerShell runner.

A normal bundle contains:

```text
yonlek-tdd-NNN-NNN/
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

The runner checks preconditions before applying patches. If the repo is on the
wrong branch, at the wrong checkpoint, or unexpectedly dirty, inspect that
condition instead of bypassing the check.

Automatic commits are allowed only after every final gate passes. If a bundle
stops before that point, leave its partial state intact for review.

## Scope and architecture discipline

Prefer observable domain, application, persistence, and UI seams over speculative abstractions.

Do not add a dependency because it might be useful later. Add one only when a
selected feature requires it, and review its license before adding it.

Keep browser/storage details out of domain code. Keep ID and time generation injectable where deterministic behavior matters.

## Copyright and product independence

Do not copy another product's source code, design assets, icons, screenshots, text, or branding.

General project-management concepts such as projects, tasks, statuses,
priorities, filters, calendars, and boards may be implemented independently
with original code and product wording.

## Verification

For ordinary local work:

```powershell
npm run check
git diff --check
```

For a TDD bundle, use the bundle runner instead of manually skipping between patches.

## Resuming a stopped bundle

A resume bundle may intentionally start from a known dirty state left by an
earlier stopped run. The manifest must list every expected
`git status --porcelain` entry and pin the normalized SHA-256 of each modified
or untracked file whose content matters to the continuation.

A resume guard is not permission to accept arbitrary local changes. It describes
one exact stopped state. Do not disable the clean-tree guard generally, and do
not reset or clean the repository to make a resume bundle fit.

## Documentation-only maintenance

Documentation changes do not need invented RED/GREEN behavior cycles.

A docs-only bundle should still:

1. pin the branch and starting behavior commit;
2. require a clean tree unless it is an exact resume;
3. derive the tracked Markdown set from Git, not from a reconstructed handoff snapshot;
4. verify that exact Markdown set before any write;
5. guard every Markdown file it intends to replace by normalized SHA-256;
6. run a documentation consistency check;
7. run `git diff --check`;
8. run the full `npm run check` gate even though production code did not change;
9. stage only the intended documentation files;
10. run the staged diff check;
11. commit only after every gate passes;
12. verify `origin` and use a non-force push when push is authorized.

This keeps documentation from drifting away from the code checkpoint it
describes.

## Presentation-only post-steps

CSS and other presentation-only changes may be applied after the behavioral TDD
cycles are green. They must not add JavaScript behavior or alter a behavior test.
The final lint, test, build, and diff gates still apply.

## Bundle implementation rules learned on Windows

These are required for future generated bundles:

1. **RED semantics.** Non-zero exit is required. The runner must also match
   stable test or file identifiers so an unrelated failure cannot count as RED.
2. **GREEN semantics:** zero exit is required. Never continue after a failed focused GREEN.
3. **Native stderr.** Treat a native program's exit code as the success signal.
   For commands whose stdout the runner parses, do not merge stderr into stdout
   with `2>&1` while `$ErrorActionPreference = 'Stop'`. Windows PowerShell 5.1
   can promote a harmless native stderr line, including Git's LF-to-CRLF
   warning, to `NativeCommandError` even when Git exits with code 0. Capture
   stdout only, leave stderr visible in the console, and check `$LASTEXITCODE`.
   Intentional RED output may still be captured when the runner needs to match
   the expected failure, but its capture path must not turn expected stderr into
   a runner failure.
4. **Guarded edits.** Prefer guarded file transforms for existing source files.
   Compare normalized text SHA-256 and ignore only BOM and CR/LF representation.
   Write canonical LF and preserve an existing UTF-8 BOM only when necessary.
5. **Resume state.** Do not reset a stopped batch. A resume manifest must pin
   branch, HEAD, exact `git status --porcelain` entries, and hashes for the
   partial files it expects.
6. **Manifest optionals.** Treat omitted optional collections as empty. Prefer
   explicit `[]` values for `expectedStatus`, `expectedFileSha256`, and
   `expectedNormalizedFileSha256` on clean-start bundles.
7. **Post-steps.** Documentation and CSS may run only after behavioral cycles
   are GREEN. They still must pass lint, tests, production build, and
   `git diff --check`.
8. **Vite CSS typing.** If the browser entry imports CSS, keep
   `src/vite-env.d.ts` with `/// <reference types="vite/client" />`. Without it,
   TypeScript 6 with the current config can reject the side-effect CSS import
   with TS2882.
9. **Logs and terminal:** write logs to `.tdd-logs/`, never call `exit`, and never use destructive cleanup commands.
10. **Automatic commit:** commit only after focused GREENs and all final gates pass. A stopped batch remains uncommitted.
11. **Operator invocation.** Prefer a standalone launcher invoked with one short
    PowerShell command. Long pasted blocks with backtick continuations can
    trigger PSReadLine rendering failures before the bundle starts. The launcher
    must still leave the interactive shell open on failure.

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

## Task archive lifecycle rule

Task archive is reversible state, not deletion.

- represent archive with optional `Task.archivedAt`;
- use the injected runtime clock at the command boundary;
- archive and restore the full Subtask subtree so active UI state never leaves a
  visible child under an archived parent;
- retain workspace-level Task relationship edges during archive and restore;
- exclude archived Tasks from normal counts, filters, sorts, Project Task lists,
  and active relationship-target choices;
- expose archived roots for restore instead of exposing every cascaded child as
  an independent restore action;
- keep version-1 storage backward compatible by treating `archivedAt` as
  optional, while validating it as an ISO instant when present.

A future archive design that needs partial-subtree restore or independent
archive history should introduce an explicit model for that behavior rather
than overloading the current timestamp contract.

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

The root Markdown files are part of the maintained project state, not release
notes copied from chat.

When a run teaches a durable rule, confirms a checkpoint, exposes a useful
failure mode, or changes architecture or behavior, update the relevant Markdown
in the next applicable bundle or maintenance step and update the aligned
handoff.

Keep these roles distinct:

- `README.md` explains the current product and architecture;
- `FEATURES.md` tracks implemented and planned capability;
- `CONTRIBUTING.md` records engineering rules and regression lessons;
- `TDD_LOG.md` preserves RED/GREEN history and confirmed checkpoints;
- `CLICKUP_REFERENCE.md` records competitor research and independence limits;
- `BRAND_NAME_RESEARCH.md` is the canonical naming and brand-research record;
- `THIRD_PARTY_NOTICES.md` records dependency-license information.

Preserve useful historical fixes. Never rewrite a prepared target as if it were
live. Handoffs must separate user-confirmed live state from work that is only
prepared.

A handoff snapshot is evidence about the handoff. It does not prove that every
snapshot file is tracked in the live repository. During the post-TDD-147 docs
refresh, a reconstructed handoff contained `YONLEK_NAME_RESEARCH.md` even though
clean `d976d0d` did not. The live file and hash guard stopped before any write.
Future maintenance bundles must use Git's tracked file set as the repository
source of truth.

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

The visible working product name is **Yönlek**. The npm package, GitHub
repository, and local repository folder use `yonlek`.

The local repository was renamed from
`C:\Users\yavuz\git\workspace-app` to `C:\Users\yavuz\git\yonlek` after
the clean `44a1087` checkpoint. On Windows, renaming the directory failed while
the interactive shell was still inside it. Moving the shell to the parent
directory with `cd ..` released that handle and the rename then succeeded.

Do not rename `workspace-app.workspace` or
`workspace-app.view-preferences` merely for branding. They are established
persistence identifiers. Changing them without migration would make existing
local data unreachable through the new key.

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

## Local person and assignee integrity

People are workspace-level local identities. Tasks reference them by ID.

Rules:

- `WorkspaceState.people` remains optional for backward compatibility.
- `Task.assigneeIds` remains optional and may contain multiple People.
- Person names are trimmed and non-empty.
- Person IDs are unique across the workspace.
- Assignee IDs must be unique within each Task and reference existing People.
- Assigning the same Person twice is idempotent.
- Deleting a Person preserves Tasks and removes that ID from all Tasks.
- Deleting the final assignment removes `assigneeIds`.
- Deleting the final Person removes the optional `people` collection.
- Existing version-1 workspace documents without People remain valid.
- A local Person is not an authenticated account. Do not attach authorization,
  invitation, notification, or remote identity semantics to this model.

## Custom field integrity

Custom Field definitions live at workspace level. Tasks reference definitions
through keys in optional `customFieldValues`.

Supported types:

- `text`: string
- `number`: finite number
- `checkbox`: boolean
- `select`: one stable option ID owned by that field
- `date`: exact `YYYY-MM-DD` calendar date
- `formula`: read-only finite numeric result computed from Number/Formula fields

Rules:

- `WorkspaceState.customFields` remains optional for backward compatibility.
- `Task.customFieldValues` remains optional.
- Definition IDs are unique across the workspace.
- Every Task value key must reference an existing definition.
- Runtime value type must match the definition type.
- Text values are normalized by trimming.
- Select definitions own an ordered option list. Option IDs and non-blank labels
  are required, and option IDs are unique inside one field.
- Task Select values store option IDs, never display labels. Renaming an option
  preserves existing Task selections.
- Date values are trimmed before runtime validation and must resolve to a real
  calendar date in exact `YYYY-MM-DD` form.
- Date Custom Field values are independent from Task `startDate` and `dueDate`.
- Formula definitions may be unconfigured or reference exactly two stable
  Number/Formula field IDs with `+`, `-`, `*`, or `/`.
- Formula Task results are computed on read. Never store a Formula field key in
  `Task.customFieldValues`.
- Formula dependency validation rejects self-reference and direct or indirect
  cycles.
- Missing operands, missing Task values, division by zero, non-finite results,
  or malformed persisted dependency graphs evaluate as unavailable instead of
  producing stored fallback values.
- Deleting a Custom Field clears Formula configurations that directly reference
  that field. Downstream Formula definitions remain configured and evaluate as
  unavailable until their dependency is configured again.
- Deleting a Select option removes only Task values for that field that reference
  the deleted option. Other Custom Field values stay unchanged.
- Non-Select definitions must not carry Select option metadata.
- Clearing the final Task value removes `customFieldValues`.
- Deleting a definition removes that value key from every Task.
- Deleting the final definition removes `customFields`.
- Existing version-1 workspaces without Custom Fields remain valid.
- Field type migration preserves the definition ID, name, and `createdAt` and
  clears every stored Task value for that field. Do not implicitly coerce old
  values during migration.
- Migrating to Select creates a fresh empty option list. Migrating to Formula
  leaves the field unconfigured. Incompatible Select/Formula metadata must not
  survive migration.
- If a migrated field remains Number or Formula, existing Formula dependencies
  that reference it stay intact. If it becomes Text, Checkbox, Select, or Date,
  clear direct Formula configurations that reference it. Downstream Formula
  definitions remain present and evaluate unavailable until reconfigured.
- A same-type migration is a non-destructive no-op.

## Git push gate

User-authorized bundles may push after a successful local commit.

Order:

1. RED/GREEN gates.
2. Documentation/checklist updates.
3. Full lint/tests/build.
4. `git diff --check`.
5. Local commit.
6. Post-commit clean-tree check.
7. Verify the configured `origin` URL.
8. Non-force `git push -u origin main`.

Allowed Yönlek remotes:

- `https://github.com/ROGOYATO/yonlek.git`
- `git@github.com:ROGOYATO/yonlek.git`

Never force-push from a feature bundle. If push fails, stop and preserve the
successful local commit and clean working tree. Do not reset or clean.

### Controlled inputs with normalizing domain setters

Do not feed a normalizing domain setter directly from every keystroke when the
same persisted value controls the input. Normalization such as `trim()` can
rewrite the field while the user is still composing text and can collapse
intentional internal spaces.

For Text Custom Fields, keep a local draft during editing and commit through the
domain boundary on blur. Tests should assert the user-visible value contract;
do not weaken the test to match a lossy controlled-input implementation.

### Zero-warning lint gate

`npm run lint` uses `oxlint . --deny-warnings`.

A lint warning is a failed quality gate, not a successful check. Bundles must
stop before commit/push when Oxlint reports any warning or error. Do not rely
only on the default Oxlint exit code because warnings are otherwise non-fatal.

## Task relationship integrity

Relationships are workspace-level edges between Task IDs.

Types:

- `blocks`: directional source → target dependency;
- `related`: symmetric non-dependency link.

Rules:

- both endpoints must exist;
- a Task cannot relate to itself;
- duplicate semantic relationships are rejected;
- reversed `related` endpoints are the same relationship;
- dependency cycles are rejected;
- deleting Tasks, descendant cascades, or Projects removes affected edges;
- persistence validates IDs, endpoint references, duplicate semantics,
  canonical timestamps, and dependency acyclicity;
- Task moves do not rewrite relationship IDs because Task identity is stable.

## Project deletion state-shape regression

When adding new workspace-level optional collections, project deletion must
preserve unrelated collections. Prefer a surgical `{ ...state, ...changes }`
update over reconstructing WorkspaceState from an older subset of fields.
TDD 137 is the regression reference.

## Windows Git executable

Automated Windows runners pin:

`C:\Program Files\Git\cmd\git.exe`

All internal Git operations and manifest commands named `git` route to that
executable. Do not rely on PATH because MSYS Git may appear earlier and behave
differently for credential helpers and HTTPS transport.

## Windows PowerShell 5.1 source encoding

Repository runners target Windows PowerShell 5.1 as well as newer shells. Keep
executable `.ps1` source ASCII-only. Do not place product names or other
non-ASCII prose directly in runner literals, comments, or assertions.

This is stricter than ordinary UTF-8 source handling on purpose. Windows
PowerShell 5.1 can decode a UTF-8-without-BOM script through legacy code-page
rules before the script has a chance to call an explicit UTF-8 API. A correct
literal such as the product name can therefore arrive in memory as mojibake and
make a content assertion fail even when the Markdown file itself is valid
UTF-8.

When a runner needs to verify Unicode documentation, prefer an ASCII substring
that still proves the required behavior. If an exact Unicode code point is
material to the check, construct it at runtime from its numeric code point
instead of embedding the character in `.ps1` source.

Bundle preflight must inspect the raw bytes of every executable PowerShell file
and reject bytes above `0x7F` before repository work starts. This source audit is
separate from the PowerShell parser check; both are required.

## Project deletion and optional workspace collections

Project deletion must preserve unrelated workspace-level data without
materializing optional empty collections.

Compatibility rules:

- preserve unrelated Tags, People, Custom Fields, and other workspace metadata;
- if `areas` was absent or empty before deletion, do not introduce `areas: []`;
- if `lists` was absent or empty before deletion, do not introduce `lists: []`;
- if a non-empty List collection existed, filter it by deleted Project and
  preserve the resulting collection even when it becomes `[]`;
- clean relationship edges that touch Tasks removed by the Project deletion.

TDD 141 exposed this boundary: the first TDD 137 preservation fix used
`...state`, which correctly kept newer metadata but reintroduced historical
empty `areas` / `lists` shapes. The correction is implementation-only; no test
was weakened.

## Relationship target selector text

Task titles are stable semantic text and should remain uniquely attributable to
the rendered Task row where exact title semantics matter.

Relationship target selectors keep Task IDs as option values. Their visible
option text is `Target: <task title>` instead of duplicating the bare Task title.
This keeps the selector understandable without making filtered-out Tasks appear
to exact-text queries or creating duplicate bare title nodes.

Do not weaken filtering/title tests to accommodate control chrome that
duplicates bare Task titles.

## Task duplication

Task duplication is a three-boundary behavior.

At the domain boundary, `duplicateTask` copies one Task under a caller-supplied
new ID and timestamp. At the application boundary,
`WorkspaceCommands.duplicateTask(taskId)` obtains that identity and time from
the injected runtime, then persists the duplicate through the established
`task/added` reducer path. At the UI boundary, each Task exposes an accessible
`Duplicate task <title>` button.

The duplicate keeps the source Task's Project, List, parent, status, priority,
due date, description, Checklist, Tag IDs, assignee IDs, and Custom Field
values.

Task-owned arrays and records must be copied into new containers. A later edit
to the duplicate must not mutate the source through a shared reference.

Do not copy child Tasks. They are separate Task entities that happen to point at
the source through `parentTaskId`.

Do not copy workspace-level `blocks` or `related` edges. Those edges describe
the workspace graph, not fields owned by the Task being duplicated.

TDD 145 proves the copy semantics, TDD 146 proves persistence through the
command boundary, and TDD 147 proves the accessible UI control.

## RED failure-cause guards

A RED gate must prove why the new test failed. Matching only the test suite or
test title is not enough because those strings also appear when the test fails
for an unrelated fixture, runtime, import, or syntax error.

When a bundle expects one specific RED reason:

- require a marker from the intended assertion or missing public behavior;
- reject known accidental failure classes such as `ReferenceError`, syntax
  errors, transform errors, and undefined fixture variables when they are not
  the intended seam;
- do not apply the GREEN production payload until the RED reason is confirmed;
- if an invalid RED was already followed by production code, restore the exact
  pre-GREEN source through guarded file replacement, not `git reset`, then run
  the corrected RED before reapplying GREEN.

TDD 150 exposed this rule. The first archived-task persistence test referenced
fixtures outside its scope. The old RED gate matched the test name and accepted
the resulting `ReferenceError`, so the production validator was applied without
valid RED evidence. The repaired sequence defines local fixtures, restores the
pre-TDD-150 storage source through a hash-guarded replacement, requires the
intended assertion failure, and only then reapplies the archive timestamp
validation.

Captured RED output is also a machine-readable boundary. Terminal color can add
ANSI control sequences inside text that looks contiguous on screen. A marker
check must therefore compare against normalized output, not the raw colored
transport. Preserve the raw output in the terminal and log for diagnosis, but
disable color for machine-read RED subprocesses where possible and strip ANSI
CSI sequences before required or rejected marker checks.

The first repaired TDD 150 resume exposed this distinction. Vitest visibly
printed the intended `AssertionError: expected [Function] to throw an error`,
but the runner compared the marker against unsanitized captured output and
falsely reported it missing. No production change was needed for that stop.

Reducer RED tests need one more guard. This reducer has no default branch, so a
new action that is not implemented yet returns `undefined`. A RED test must
assert that whole return value before reading fields from it. Otherwise a field
read such as `result.projectTemplates` turns the intended missing-action RED
into a `TypeError`. Keep the field assertions after the whole-return assertion
so GREEN still proves the full state shape. RED gates should reject the runtime
error when the intended failure is an assertion.

## Vitest DOM value assertions

The current Vitest setup uses Chai assertions but does not install jest-dom
matchers such as `toHaveValue`. Rendered tests that need to verify an input or
select value should read the native DOM `.value` property and compare it with
`toBe`, using the appropriate `HTMLInputElement` or `HTMLSelectElement` cast.
Do not add or rely on a matcher that the repository test setup has not
configured.

## Repository line endings

The repository defines text normalization in `.gitattributes`:

```text
* text=auto eol=lf
```

Git stores and checks out repository text as LF regardless of a developer's
`core.autocrlf` setting. This keeps generated bundles, Linux tooling, Windows
Git, and CI on one text format and removes repeated LF-to-CRLF warnings from
guarded patch runs.

Bundle writers must write repository payloads as UTF-8 using LF. Normalized
SHA-256 guards still normalize line endings before comparison, but the final
working-tree bytes must also match the repository EOL policy. PowerShell
launcher scripts distributed outside the repository remain ASCII-safe and may
use CRLF because they are Windows operator files, not repository source.

Line-ending policy is a repository contract, not a reason to rewrite unrelated
files. Do not run a blanket normalization commit unless Git actually reports
content changes that need review.


## PowerShell Git argument wrappers

Do not name an explicit PowerShell parameter `Args`. PowerShell already reserves
`$args` as the automatic array of undeclared arguments, and `@args` has special
pass-through splatting behavior. Git wrapper functions must use an unambiguous
name such as `GitArguments` or invoke the fixed Git command directly.

The first TDD 153 resume used `param([string[]]$Args)` and then splatted
`@Args`. Its first tracked-file guard falsely reported
`src/domain/project.test.ts` as untracked even though the file was part of
`e71af4e`. The runner stopped before any TDD 153 source change. Future bundle
preflights should exercise the Git plumbing check against a known tracked file
before the first patch.

## Project template integrity

Project templates are workspace-local reusable blueprints, not cloned live
workspace graphs.

- Keep template references local to the template. Do not store live List, Task,
  Tag, Person, Custom Field, Area, or relationship IDs as reusable dependencies.
- Snapshot only active Tasks. An archived Task is historical state, not default
  work for a new Project.
- Preserve reusable Task status, priority, description, Subtask structure, List
  structure, and Checklist text/completion.
- Do not copy due dates because an absolute calendar date is not a reusable
  template offset.
- Instantiation must allocate fresh Project, List, Task, and Checklist IDs and
  persist the whole instance through one workspace action.
- Deleting the source Project must not invalidate or delete its saved template.

## Project archive integrity

Project archive and Task archive are separate state transitions.

- Project archive sets optional `Project.archivedAt`.
- It does not rewrite `Task.archivedAt`.
- Normal UI surfaces include only active Projects and Tasks that belong to active
  Projects.
- Restoring a Project does not restore Tasks that were archived independently.
- Lists, Area assignment, description, Tasks, and relationship edges are
  retained while the Project is archived.
- Delete remains the destructive operation and continues to remove owned Lists,
  Tasks, and affected relationship edges.

Tests should preserve that distinction. Do not implement Project archive as
Project delete plus reconstruction, and do not cascade Task archive state merely
to hide a Project.

## Task view layout integrity

List and Board are view-preference state, not workspace data.

- Missing `viewMode` in a version-1 preference document means List.
- Board uses the already focused, filtered, and sorted active Task sequence.
- Board columns are fixed by Task status: To do, Doing, and Done. Keep empty columns so the layout is stable.
- Board reuses existing Task rows and actions. Do not fork Task behavior into a second Board-only command path.
- List grouping is ignored while Board is active but must not be rewritten. Switching back to List restores the prior grouping preference.
- Existing saved views do not capture layout mode. Applying one must preserve the current List/Board choice unless a separately tested migration expands that contract later.

## Calendar view integrity

Calendar extends optional `viewMode`; it does not create workspace data.

- Missing `viewMode` in a version-1 preference document still means List.
- Calendar uses the already focused, filtered, and sorted active Task sequence.
- Group Tasks by exact `YYYY-MM-DD` due-date strings and order dated sections
  chronologically. Put Tasks with no due date in one final `No due date` section.
- Preserve incoming Task order inside each date section so an existing Task sort
  remains meaningful when several Tasks share a date.
- Reuse existing Task rows and actions. Do not create Calendar-only Task command
  paths.
- Ignore List grouping headings while Calendar is active without rewriting the
  saved grouping preference. Switching back to List must restore it.
- Existing saved views still do not capture layout mode. Applying one must
  preserve the current List, Board, Calendar, Table, or Timeline choice unless a
  separately tested migration changes that contract.
- Keep date labels locale-free at this stage. Month navigation, locale-specific
  formatting, and richer calendar presentation require separate behavior tests.

## Table view integrity

Table extends optional `viewMode`; it does not create workspace data.

- Table uses the already focused, filtered, and sorted active Task sequence.
- Keep the scan columns fixed at Title, Status, Priority, Due date, and List until
  a separate column-configuration behavior is designed and tested.
- Use explicit `No due date` and `No list` fallbacks instead of blank cells.
- Preserve incoming Task order in table rows so the selected Task sort remains
  authoritative.
- Keep the existing Task detail rows and actions instead of creating a second
  Table-only editing or command path.
- Ignore List grouping headings while Table is active without rewriting the saved
  grouping preference. Switching back to List must restore it.
- Saved views preserve the current layout mode and do not capture Table unless a
  separately tested Saved View migration expands that contract.

## Timeline view integrity

Timeline extends optional `viewMode`; it does not create workspace data.

- Timeline uses the already focused, filtered, and sorted active Task sequence.
- Order dated Tasks by exact `YYYY-MM-DD` due-date strings. Preserve incoming
  order when Tasks share a date, then put undated Tasks last with `No due date`.
- Keep the existing Task detail rows and actions instead of creating a second
  Timeline-only editing or command path.
- Ignore List grouping headings while Timeline is active without rewriting the
  saved grouping preference. Switching back to List must restore it.
- Saved views preserve the current layout mode and do not capture Timeline unless
  a separately tested Saved View migration expands that contract.
- Do not add start dates, durations, drag scheduling, or dependency-line rendering
  in this slice. Those behaviors belong to the later Gantt foundation.

## Gantt foundation integrity

The TDD 203-207 Gantt foundation adds schedule data without opening a Gantt UI
mode.

- Treat `startDate` as optional workspace Task data using exact `YYYY-MM-DD`.
- Validate start dates through the Task domain and workspace storage boundary; do
  not duplicate date parsing in commands or projections.
- When both boundaries exist, require `startDate <= dueDate`. Enforce the invariant
  from both setters so changing either side cannot create an invalid range.
- Keep `changeTaskStartDate` on the existing workspace command/store path so
  persistence stays transactional with other Task mutations.
- Keep `createTaskGanttItems` pure. It preserves incoming Task order, keeps every
  Task as a row, and marks a Task scheduled only when both dates exist.
- The confirmed TDD 203-207 batch does not add `gantt` to `TaskViewMode`; the
  separate TDD 208-212 UI slice owns that compatibility change.
- Do not infer durations, shift dependency dates, draw dependency lines, or add
  milestone, work-calendar, baseline, or critical-path semantics without separate
  tests.

## Gantt view integrity

TDD 208-212 opens the Gantt UI without expanding the scheduling model.

- Route optional start-date edits through the existing `changeTaskStartDate`
  command/store path; do not create view-specific Task persistence.
- `gantt` is optional version-1 view-preference state. Missing view mode still
  means List, and unrelated values remain invalid.
- Gantt uses the already active, focused, filtered, and sorted Task sequence and
  the pure `createTaskGanttItems` projection. Every Task remains a row.
- A Gantt row is scheduled only when both exact start and due dates exist. Missing
  either boundary is shown as `Unscheduled`; do not infer a duration.
- Keep the existing Task detail/action path. Suppress List grouping headings while
  Gantt is active without changing the saved grouping preference.
- Saved views continue to preserve the current layout instead of capturing Gantt.
- Do not add drag scheduling, dependency-line drawing, automatic rescheduling,
  milestones, baselines, work calendars, time-scale geometry, or critical path in
  this slice.

## Per-view filter and sort integrity

TDD 213-217 keeps layout-specific filtering inside view preferences, not workspace
data.

- Snapshot only Task search, status, priority, due-date presence, and sort. Project
  focus, grouping, saved preset collections, and layout mode are not nested into
  a per-view snapshot.
- Keep the snapshot collection optional. Ordinary List-only filter/sort changes
  must preserve the legacy version-1 preference shape until a real layout switch.
- On first entry to an unseen layout, inherit the outgoing active filter/sort
  values. Once a layout has a snapshot, restore that snapshot on later visits.
- Active filter/sort edits update only the active layout snapshot after snapshots
  exist. Clearing filters follows the same rule.
- Saved Filter Sets preserve their existing contract and update only the active
  layout's filter snapshot. Saved Views keep Project focus/grouping behavior,
  update the active layout's filters/sort, and remain layout-neutral.
- Persist the optional map in storage version 1 and reject malformed view keys or
  malformed snapshot values through the existing non-critical preference fallback.
- Do not change workspace storage, Task filtering algorithms, Task sorting
  algorithms, or make Project focus/grouping layout-specific in this slice.

## Bulk Task action integrity

TDD 218-222 keeps bulk mutation on the existing workspace command and reducer
path.

- Bulk status and priority changes use one workspace action per user operation.
  Do not loop through single-Task commands because that creates multiple
  persistence writes.
- Bulk archive uses one runtime timestamp and one workspace action. Every
  selected root keeps the existing full Subtask archive cascade.
- Task selection is UI-local. Do not persist selected IDs in workspace or view
  preferences.
- Select-all operates on the current active Tasks after Project focus and Task
  filters. Archived, hidden, and other-Project Tasks are outside that selection.
- Status, priority, and archive clear selection only after the bulk handler
  succeeds.
- Bulk delete, restore, moves, dates, Tags, People, and Custom Fields need their
  own tested slices before they are added.

## Recurring Task integrity

Recurring Task rules are Task-owned optional metadata with unit `day`, `week`, or `month` and a positive integer interval. A recurring Task must have a valid due date. Clearing that due date must clear recurrence in the same Task update. Completion-driven recurrence must update the completed source and append exactly one next occurrence in one workspace dispatch. The source occurrence is retained as immutable history; the next occurrence gets a fresh Task ID/creation time, resets to `todo`, advances dates with calendar arithmetic, and resets Checklist completion. Do not generate recurring subtrees or relationship edges implicitly.

### Time-estimate invariant

`Task.estimateMinutes`, when present, is a positive finite integer number of minutes. Keep the same rule in live Task state, Task Templates, Project Templates, and storage validation. Do not add implicit string, decimal-hour, or duration-unit coercion.

### Time-tracking invariant

`Task.timeEntries`, when present, contains completed entries with a non-empty ID, a positive integer `durationMs`, and an ISO `recordedAt` instant. Entry IDs are unique within one Task. `Task.timerStartedAt`, when present, is the single running timer start instant.

Manual time entry accepts positive integer minutes and converts them to milliseconds at the domain boundary. Timer start and stop use the injected workspace runtime. Stopping requires a later instant and stores the exact elapsed milliseconds. Keep each user operation on one workspace dispatch.

Actual tracked work is history, not planning metadata. Task duplication, the next recurring occurrence, Task Templates, and Project Templates must not copy completed entries or a running timer. Time estimates keep their separate copy behavior. Storage version 1 keeps both tracking fields optional for backward compatibility and rejects tracking fields inside template blueprints.

The first UI slice shows completed tracked minutes, manual entry controls, one start/stop timer control, and deletion of completed entries. It does not add a live ticking display, rollups, billable flags, People attribution, reports, or background timers.

### Attachment metadata invariant

`Task.attachments`, when present, contains metadata only. Each entry has a non-empty ID and name, a non-negative safe integer `sizeBytes`, an optional non-empty media type, and an ISO `addedAt` instant. Attachment IDs are unique within one Task. The domain normalizes IDs, names, and media types before accepting an entry.

The browser file input may read `File.name`, `File.size`, and `File.type`. Do not persist file bytes, local filesystem paths, object URLs, previews, upload handles, or other content references in this slice. Task duplication, recurring occurrences, Task Templates, and Project Templates must not copy attachment metadata. Storage version 1 keeps `attachments` optional for backward compatibility and rejects attachment fields inside template blueprints.

Each add or delete action uses one workspace dispatch. The UI must state that only metadata is stored so a saved file name is not mistaken for durable file access.

### Package-script invocation in runners

When a package script already contains a strict flag, invoke the package script directly. Do not append the same flag again through `npm run <script> -- ...`. The TDD 256-260 resume r2 called `npm run lint -- --deny-warnings` even though `package.json` already defined `lint` as `oxlint . --deny-warnings`; oxlint rejected the duplicated flag before any repository change. Preflight checks should inspect the package script contract instead of duplicating it.

### Focused test harness and RED validity

Before packaging a new focused test, compare its setup with a currently passing neighboring test at the same public seam. Reuse repository constructors, stores, and persistence helpers instead of inventing imports, constructors, or raw storage keys. BrowserApp workspace fixtures must use `saveWorkspace`/`loadWorkspace` unless the test intentionally exercises malformed raw persistence. A UI RED is valid only after the fixture proves the expected Project/Task loaded; a missing-element error alone is not enough. If GREEN fails with the same setup or harness symptom as RED, treat the prior RED as invalid and stop before continuing the batch.
### Task Activity atomicity invariant

Task Activity history must remain atomic with the user mutation that produced it. Track supported lifecycle changes through the `workspace/taskActivityTracked` envelope so `WorkspaceStore` reduces and persists one final Workspace state. Never implement Activity as a second dispatch after the Task mutation.

Activity derivation compares the actual pre-mutation and post-mutation Workspace state. No-op operations append no entry. Multi-Task operations keep deterministic pre-state Task ordering, and Activity must not consume `runtime.nextId()`. Reuse an operation timestamp when one already exists; otherwise obtain exactly one timestamp for the tracked command. Direct base-action dispatch remains untracked because the reducer must not invent time.

## Backup export contract

Backup export is a versioned application boundary. Keep the backup document
deterministic and explicit: workspace state, view preferences, one canonical ISO
export instant, and the backup format version. Export must not mutate workspace
or preference state. Browser download mechanics belong behind the dedicated
download boundary; import and validation behavior are implemented separately.

## Backup import contract

Backup import must validate the complete versioned document before mutating
persistence. Reuse the existing Workspace and View Preferences validation
boundaries rather than maintaining a second schema. If a later persistence
write fails, restore the previously loaded Workspace and View Preferences when
possible. Browser import must remount the application from imported state;
invalid files must leave the current application usable and unchanged.

## Vitest worker concurrency

Keep Vitest worker concurrency low enough that timing-sensitive browser tests
remain below the repository's unchanged 5000 ms default timeout under the full
suite. The current cap is `maxWorkers: 2`. Do not raise it without repeated
same-machine full-suite evidence, and do not lengthen individual test timeouts
to hide contention.

## Storage migration contract

Persisted-data migrations must be explicit and sequential. Register one
migration per source version and require each migration to advance exactly one
version. Do not skip versions, infer unknown schemas, or mutate the source
document in place.

Workspace storage keeps its public distinction between invalid data and an
unsupported storage version. View Preferences keeps its best-effort fallback to
defaults when its stored document cannot be migrated or validated. Loading a
current-version document must not rewrite storage. Backup-file versioning is a
separate compatibility boundary and must not be coupled to browser-storage
version numbers.


## Automation core contract

Keep Automation configuration separate from execution. An Automation owns a
stable non-empty ID, normalized non-empty name, boolean enabled state, one typed
trigger, and typed condition/action arrays. Domain update helpers must return new
Automation values and must never replace the stable ID.

Workspace owns the optional Automation collection. Adding a duplicate Automation
ID is invalid; deleting the final Automation removes the optional collection
instead of leaving an empty persisted field. Workspace commands may create and
edit configuration, but TDD 286-290 must not evaluate triggers, conditions, or
actions.

Do not observe the DOM to discover trigger events. TDD 291-295 must build on the
existing Activity/event boundary. Keep browser storage at version 1 in this
batch. Automation-specific persisted-data validation, execution composition, and
UI belong to TDD 306-310.


## Automation trigger matching contract

Trigger matching is a pure domain step over `TaskActivityEntry` values. Do not
observe DOM changes, browser events, or rendered UI to discover Automation
triggers. The supported local trigger kinds are `task.created`,
`task.statusChanged`, `task.priorityChanged`, `task.dueDateChanged`,
`task.archived`, and `task.restored`.

A disabled Automation never matches. Batch matching must preserve Activity-entry
order first and Automation collection order second so later condition/action
stages receive deterministic input. Trigger matching must not mutate Workspace,
append Activity, evaluate conditions, or execute actions. Those responsibilities
remain in later TDD slices.
