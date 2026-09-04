# Yönlek

A local-first project and task manager built with React, Vite, and TypeScript.

The current implementation is intentionally small. It is being developed as a sequence of tested vertical slices rather than as a broad clone of another product.

## Current checkpoint

Prepared checkpoint after TDD 147:

- branch: `main`
- batch start: `44a1087` (`TDD 137-144: add task relationships`)
- TDD state: cycle 147 GREEN
- expected suite: 305 tests
- lint gate: zero warnings via `oxlint . --deny-warnings`
- Git runner: pinned to `C:\Program Files\Git\cmd\git.exe`

Task duplication creates one new Task with a new ID and creation timestamp. It
preserves the source Task data but does not copy child Tasks or workspace-level
relationship edges.

See [`FEATURES.md`](./FEATURES.md) for the maintained feature-first roadmap.

## Implemented behavior

Areas:

- create, rename, and delete Areas;
- optionally assign Projects to Areas;
- delete Areas without deleting Projects;
- clear Project Area assignments when an Area is deleted;
- show per-Area Project counts;
- persist and validate Area records and Project-to-Area relationships.

Projects:

- create a project;
- reject a blank project name;
- rename a project with the same validation rule;
- delete a project and its tasks;
- show per-project completion and visible-task counts;
- focus the workspace on one project by stable project ID;
- fall back to all projects if the focused project is deleted;
- show task counts in the project selector.

Tasks:

- create a task inside an existing project;
- reject a blank task title;
- rename a task;
- change task status between `todo`, `doing`, and `done`;
- change priority between `low`, `normal`, and `high`;
- set or clear an optional calendar due date;
- set or clear an optional task description;
- delete a task without deleting its project;
- duplicate one Task with a new identity while preserving its Task-local data;
- search task titles and descriptions;
- filter tasks by status, priority, and due-date presence;
- sort tasks by creation time, title, due date, or priority;
- clear all task filters together.

Application:

- browser startup loads versioned workspace data from `localStorage`;
- accepted workspace actions are persisted transactionally;
- failed persistence writes do not advance in-memory state or subscribers;
- stored project/task data and relationships are validated before loading;
- invalid saved data has a browser recovery/reset path;
- React subscribes to the workspace store;
- project and task validation failures are shown to the user instead of escaping the event handler;
- the project-focus selection is presentation state and is not persisted yet.

## Architecture

```text
BrowserApp
  |
  +-- WorkspaceStore
  |     +-- loadWorkspace / saveWorkspace
  |     +-- workspaceReducer
  |     +-- subscriptions
  |
  +-- WorkspaceCommands
  |     +-- project/task creation
  |     +-- task mutations
  |     +-- project/task deletion
  |
  +-- WorkspaceRoot
        +-- React subscription boundary
        +-- App UI
```

Domain functions remain independent of browser APIs. IDs and timestamps are injected at the application-command boundary so domain tests stay deterministic.

## Development

Install dependencies:

```powershell
npm install
```

Run the development server:

```powershell
npm run dev
```

Run the normal verification gate:

```powershell
npm run check
```

`npm run check` runs lint, tests, and the production build.

## Test-first patch bundles

Behavioral production code is written test-first.

Larger batches are delivered as ordered RED/GREEN patch bundles. Each bundle includes:

- `run-tdd.ps1`;
- `manifest.json`;
- numbered RED and GREEN patches;
- expected RED failure markers;
- SHA-256 checksums;
- a matching handoff ZIP when the batch is important.

The runner is fail-fast. Existing source files are updated through guarded normalized-content transforms so BOM or newline representation cannot silently bypass content checks.

It stops on:

- an unexpected starting commit or branch;
- a dirty starting tree when the bundle requires a clean tree;
- a patch check/apply failure;
- a RED test that unexpectedly passes;
- a RED test that fails for a reason other than the expected one;
- a GREEN test failure;
- a full-suite, build, lint, or `git diff --check` failure;
- a commit failure.

The runner never calls `exit` and never resets or discards the working tree. If it stops, the terminal stays open and the repo is left at the failing stage for inspection.

Logs are written under `.tdd-logs/` and ignored by Git.

See `CONTRIBUTING.md` for the development rules and `TDD_LOG.md` for the completed cycle history.


## Reliable bundle workflow

The Windows PowerShell bundle workflow has a few rules that are now part of the project, not ad-hoc recovery steps:

- RED is expected to fail. A RED phase passes only when the focused command exits non-zero and the expected test/file markers are present.
- GREEN is expected to pass. The runner never applies later steps after a failed GREEN.
- Never change or weaken an existing behavior test merely to make implementation pass. If a test itself appears wrong, explain the proposed test change and get approval first.
- Every important bundle pins the branch and starting commit. A resume bundle additionally pins the exact dirty paths and content hashes left by the stopped run.
- Do not reset or clean a stopped run. The runner leaves the failing state intact so a resume bundle can continue from it safely.
- Existing source files are changed through guarded normalized-content transforms. The guard compares content while ignoring only UTF-8 BOM and newline representation, then writes canonical LF. This avoids BOM/CRLF-sensitive patch failures.
- `git diff --check` is a required gate after each cycle and before commit.
- Expected RED stderr is captured and shown; a non-zero native command during RED must not be converted into a terminating PowerShell error.
- Optional manifest collections must behave as empty lists when absent. Current manifests declare empty checksum lists explicitly and runner v7 is null-safe.
- Presentation-only work runs after behavioral cycles are GREEN, but it still has to pass the production build.
- Vite browser entrypoints that import CSS need `src/vite-env.d.ts` with `/// <reference types="vite/client" />` so TypeScript accepts the side-effect CSS import.
- Complete terminal output is saved under `.tdd-logs/`. The runner never calls `exit`, `git reset --hard`, or `git clean`.

If a bundle stops, use its log and current `git status --short` as the basis for the next resume bundle instead of manually applying later GREEN patches.


## Living project documentation

`README.md`, `CONTRIBUTING.md`, `TDD_LOG.md`, and the aligned handoff are living
project state. Durable workflow rules, failure modes, architecture decisions, and
confirmed checkpoints are folded into the relevant Markdown/handoff instead of
being left only in chat history. Handoffs distinguish user-confirmed live state
from prepared target state.


Project view state is intentionally not persisted yet. The selected project is
held as React UI state keyed by immutable project ID, so project renames preserve
focus and deleting the selected project can fall back to the all-projects view
without a persistence migration.


View preferences:

- project focus, task search, task filters, and task sorting are stored under a
  separate versioned `workspace-app.view-preferences` document;
- preference corruption or unsupported preference versions fall back to
  defaults and never block workspace startup;
- preference writes do not modify the versioned workspace project/task
  document;
- deleting the currently focused project repairs the saved focus back to
  `All projects`.

This separation is deliberate: projects and tasks are durable workspace data;
focus/filter/sort values are disposable UI preferences.


Type ownership:

- import domain types from the module that defines them;
- a persistence or application boundary may consume a domain type without
  becoming that type's public owner;
- do not import a type through another boundary unless that boundary
  intentionally re-exports it as part of its API.

The TDD 068 build correction is the reference case: `ViewPreferences` is
defined by `domain/view-preferences.ts`; `view-preferences-storage.ts` consumes
it but does not re-export it.


Persistence reliability:

- view-preference reads and writes are best-effort; storage failures fall back
  to defaults or keep the current UI usable;
- stale saved project focus is repaired to `All projects` at startup;
- resetting invalid workspace data also resets view preferences;
- durable workspace loading rejects duplicate project IDs, duplicate task IDs,
  and invalid `createdAt` ISO instants.

The asymmetry is intentional: preferences are disposable UI state, while
workspace entities are durable data whose identity and timestamps must remain
internally consistent.


Feature-first product direction:

- tasks can move between existing projects without changing their identity;
- project focus remains stable when a task moves out of the focused project;
- moved task relationships persist through browser storage and reload;
- projects support optional descriptions with storage validation;
- `FEATURES.md` is the maintained product checklist;
- visual styling is intentionally deferred while core bare-bone workflows are
  still being added.

## Hosting and backend status

The app is intended to run as a static React/Vite frontend, including GitHub Pages with a custom domain. GitHub Pages deployment has not been added yet.

The current persistence implementation is browser-local. Authentication, shared multi-user data, a remote database, realtime collaboration, and server-side APIs have not been added.

## Licensing

The project's own source-code license has not been chosen yet.

Do not assume that the repository is MIT-licensed merely because several dependencies are. Direct dependency licenses are tracked in `THIRD_PARTY_NOTICES.md`.

No ClickUp source code, proprietary assets, branding, icons, screenshots, or copied UI text are used.


## Product reference direction

The product may pursue broad capability parity with established work-management
tools, including ClickUp, but it must remain an independent product.

Use `CLICKUP_REFERENCE.md` only as a capability and architecture reference.
Do not copy ClickUp source code, protected assets, screenshots, icons, marketing
copy, distinctive UI composition, or branded feature names.

Our independent target hierarchy is:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```

`BRAND_NAME_RESEARCH.md` records preliminary naming research. `Yönlek` is a
working candidate only; it is not considered legally cleared until official
trademark searches are completed.


Hierarchy direction:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```

The `areas` field is an additive optional field in storage version 1. Older
saved workspaces without Areas remain valid.


Lists:

- create, rename, and delete Lists inside Projects;
- optionally assign Tasks to a List in their own Project;
- deleting a List preserves Tasks and clears their List assignment;
- deleting a Project removes its Lists and Tasks while preserving unrelated
  Areas;
- moving a Task to another Project clears an incompatible List assignment;
- create a Task directly in a selected List;
- show per-List Task counts;
- persist and validate Lists and Task-to-List relationships;
- older version-1 workspaces without `lists` or Task `listId` remain valid.

Hierarchy:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```


Subtasks:

- create Subtasks from any existing Task;
- inherit Project and current List from the parent at creation time;
- retain normal Task status, priority, due-date, description, and editing
  behavior;
- show the parent relationship in the bare-bone UI;
- support nested parent chains;
- deleting a Task cascades through all descendants;
- persisted parent references must exist in the same Project;
- persisted parent cycles are rejected;
- moving a parent Task to another Project moves all descendants and clears
  incompatible List assignments;
- moving a Subtask away from its parent Project by itself is rejected;
- show immediate Subtask counts.

Hierarchy:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```


Checklists:

- each Task can optionally contain lightweight Checklist items;
- Checklist items have an ID, text, and completion state;
- create, rename, complete/uncomplete, and delete Checklist items;
- deleting the final item removes the optional `checklist` field;
- Checklist item IDs must be unique within their Task;
- persist and validate Checklist items and completion state;
- restore Checklist state through browser composition;
- show completed/total Checklist progress separately from the stable Task title;
- Checklists are not Subtasks and do not have Project/List/status/priority
  hierarchy of their own.


Manual ordering:

- reorder Areas globally;
- reorder Projects only among Projects with the same Area assignment;
- reorder Lists only within their Project;
- reorder Tasks/Subtasks only among siblings with the same Project, List, and
  parent;
- reorder Checklist items only within their Task;
- Task sort now includes a persisted `Manual` mode;
- `Created` remains the default Task sort;
- moving at a sibling boundary is a no-op;
- unrelated items retain their positions while sibling items swap;
- workspace persistence already preserves array order, so no schema migration
  or numeric position field is required;
- current UI uses explicit Move up / Move down controls. Drag-and-drop remains
  deferred to the visual interaction phase.


Tags / labels:

- create, rename, and delete reusable workspace Tags;
- Tags have durable IDs, names, and creation timestamps;
- Tasks optionally store `tagIds`;
- assign/remove Tags through Task checkboxes;
- duplicate assignment is idempotent;
- deleting a Tag preserves Tasks and removes that Tag from every Task;
- deleting the last assignment removes the optional `tagIds` field;
- deleting the final workspace Tag removes the optional `tags` collection;
- persisted Tags, duplicate Tag IDs, duplicate Task assignments, and missing
  references are validated;
- browser reload restores Task Tag assignment state;
- Tags are semantic data only in this phase; visual colors/badges remain part of
  later UI design work.


Local People / assignees:

- create, rename, and delete reusable workspace-local People;
- People have durable IDs, names, and creation timestamps;
- Tasks optionally store multiple `assigneeIds`;
- assign/remove People through Task checkboxes;
- duplicate assignment is idempotent;
- deleting a Person preserves Tasks and removes that Person from every Task;
- deleting the final assignment removes the optional `assigneeIds` field;
- deleting the final Person removes the optional `people` collection;
- persisted Person records, duplicate Person IDs, duplicate Task assignments,
  and missing references are rejected;
- browser reload restores Task assignee checkbox state;
- this is local identity only; accounts, email invitations, permissions,
  notifications, and remote membership remain later multiuser work.


Custom Fields:

- create, rename, and delete reusable workspace Custom Field definitions;
- supported initial types are `text`, `number`, and `checkbox`;
- definitions have durable IDs, names, types, and creation timestamps;
- Tasks optionally store `customFieldValues` keyed by definition ID;
- text values are trimmed, number values must be finite, and checkbox values
  are boolean;
- clear individual values without changing the field definition;
- deleting a definition preserves Tasks and removes that value from every Task;
- final value removal clears optional `customFieldValues`;
- final definition deletion clears optional `customFields`;
- persistence rejects invalid definitions, duplicate IDs, unknown references,
  and values whose runtime type does not match their definition;
- browser reload restores typed Task values;
- field type mutation, select/dropdown options, date fields, formulas, and
  custom-field filtering remain later extensions.

Task dependencies and relationships:

- workspace-level `TaskRelationship` edges with durable IDs and timestamps;
- `blocks` is directional: source Task blocks target Task;
- `related` is symmetric and stored with canonical endpoint order;
- both endpoints must reference existing Tasks;
- self relationships and semantic duplicates are rejected;
- dependency cycles are rejected at reducer and persistence boundaries;
- deleting a Task, Subtask cascade, or Project cleans affected relationships;
- bare-bone Task UI can add/remove relationships and shows Blocks / Blocked by /
  Related semantics;
- browser reload restores relationships;
- relationship summaries are separate from stable Task title text.

Regression fixed before this slice:

Project deletion now preserves newer workspace-level optional collections such
as Tags, People, and Custom Fields instead of reconstructing an older partial
state shape.
