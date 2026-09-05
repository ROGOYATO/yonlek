# Yönlek

Yönlek is a local-first project and task manager built with React, TypeScript,
Vite, and browser `localStorage`.

The project is still in its feature-first phase. Core data rules and workflows
are being added before a final visual design system or backend is introduced.

## Verified behavior checkpoint

The confirmed starting checkpoint for TDD 188-192 is TDD 187.

- branch: `main`
- behavior commit: `9f81f0f` (`TDD 183-187: add board view`)
- local repository: `C:\Users\yavuz\git\yonlek`
- remote: `https://github.com/ROGOYATO/yonlek.git`
- tests: 345 passed across 67 files
- lint: 0 warnings, 0 errors with `oxlint . --deny-warnings`
- production build: passed
- working tree after the feature commit: clean
- push: `origin/main` updated successfully

This checkpoint includes Task and Project archive/restore, Project and Task
templates, Task grouping, saved filter sets, saved views, Board view, persisted
archive timestamps, and active/archive UI boundaries.

## Current product model

Yönlek currently uses this hierarchy:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```

A Checklist item is Task-local data, not another hierarchy level.

The model is intentionally independent. `Area`, `Project`, `List`, and `Task`
are Yönlek domain concepts with their own validation and persistence rules.

### Areas

Areas are optional workspace-level groupings for Projects.

Current behavior:

- create, rename, move, and delete Areas;
- assign and unassign Projects;
- keep Projects when an Area is deleted;
- clear affected Project `areaId` values when an Area is removed;
- preserve version-1 workspaces that never had an `areas` field.

### Projects

Projects own Lists and Tasks.

Current behavior:

- create, rename, describe, move, archive, restore, and delete Projects;
- focus the UI on one Project by immutable Project ID;
- show Project Task counts and completion summaries;
- move Tasks between Projects;
- delete a Project together with its Lists and Tasks;
- preserve unrelated workspace metadata when a Project is deleted;
- hide archived Projects and their Tasks from normal counts, selectors, Area
  summaries, and Task move targets without deleting their data.

### Lists

Lists are optional Task containers inside one Project.

Current behavior:

- create, rename, move, and delete Lists;
- assign a Task only to a List from the same Project;
- create a Task directly in a List;
- clear a Task's List when that Task moves to an incompatible Project;
- keep Tasks when their List is deleted.

### Tasks and subtasks

A Subtask is a normal Task with `parentTaskId`.

Current Task behavior includes:

- create, rename, delete, duplicate, archive, and restore;
- `todo`, `doing`, and `done` status;
- `low`, `normal`, and `high` priority;
- optional due date and description;
- search by title and description;
- status, priority, and due-date filters;
- created, title, due-date, priority, and manual sort modes;
- view-only grouping by status, priority, or List after filtering and sorting;
- named saved filter sets for search, status, priority, and due-date filters;
- named saved views for Project focus, filters, sort, and grouping;
- persisted List and Board Task layouts;
- move between compatible Project and List containers;
- nested Subtasks with cycle and parent integrity checks;
- manual ordering among valid siblings.

Subtask deletion cascades through descendants. Moving a parent across Projects
moves its descendants with it. A Subtask cannot be moved away from its parent
Project on its own.

### Saved filter sets

Saved filter sets are view-preference data, not workspace data. A named set keeps
only the Task search query, status filter, priority filter, and due-date presence
filter. Saving the same normalized name updates that preset. Applying a preset
changes only those four filters and preserves Project focus, sort, and grouping.

### Saved views

Saved views are also view-preference data. A named view keeps the complete current
list configuration: Project focus, Task search, status, priority, due-date filter,
sort, and grouping. Applying a saved view restores those seven values. It does not
copy workspace data or the saved-filter-set collection.

### Board view

Task layout is optional view-preference state. An older version-1 preference document
with no layout field opens in List mode. Board mode renders fixed `To do`,
`Doing`, and `Done` status columns after the existing Project focus, Task
filters, and Task sort have been applied. The Board reuses the same Task rows,
so existing Task actions remain available. Grouping is a List-layout concern:
Board hides grouping headings without rewriting the saved grouping preference.
Switching back to List restores that grouping. Saved views currently preserve
the active layout instead of storing a List/Board choice.

### Calendar view

Calendar is another optional Task view mode in the same version-1 preference
document. It groups the already focused, filtered, and sorted active Tasks by
`YYYY-MM-DD` due date, orders dated sections chronologically, and places undated
Tasks in a final `No due date` section. The incoming Task order is preserved
inside each date section, so the selected Task sort still controls Tasks that
share a day. Calendar reuses the existing Task rows and actions. List grouping
headings are hidden while Calendar is active, but the grouping preference is
not rewritten and returns when the user switches back to List. Saved views
continue to preserve the current layout instead of capturing List, Board, or
Calendar mode.

### Task templates

Task templates snapshot one active Task subtree for reuse. The template keeps
Task/Subtask titles, status, priority, description, and Checklist
text/completion. It does not keep source Project/List IDs, due dates, Tags,
People, Custom Field values, archive flags, relationship edges, or original
identities. Creating from a template generates fresh IDs and attaches the whole
subtree to one selected active Project and optional compatible List.

### Task-local data

Tasks can also contain or reference:

- Checklist items;
- reusable Tags;
- multiple local People as assignees;
- text, number, and checkbox Custom Field values.

Checklist arrays and Custom Field value records belong to the Task. Tags,
People, and Custom Field definitions belong to the Workspace and Tasks refer to
them by ID.

### Task relationships

Task relationships are workspace-level edges, not Task fields.

Supported relationship types:

- `blocks`, which is directional;
- `related`, which is symmetric.

The reducer and persistence loader reject missing endpoints, self-links,
semantic duplicates, and dependency cycles. Deleting a Task or Project removes
relationship edges that point to deleted Tasks.

The UI shows `Blocks`, `Blocked by`, and `Related` summaries separately from the
Task title. Relationship target option values remain Task IDs. Their visible
text uses `Target: <task title>` so selector options do not create duplicate bare
Task-title nodes.

## Task duplication contract

TDD 145-147 added Task duplication through the domain, application-command, and
UI boundaries.

Duplicating one Task:

- creates a new Task ID;
- records a new `createdAt` timestamp;
- keeps the source Project, List, parent, status, priority, due date, and
  description;
- copies Checklist data;
- copies Tag and assignee ID arrays;
- copies Custom Field values;
- creates separate nested arrays and records so editing the duplicate cannot
  mutate the source through a shared JavaScript reference.

It deliberately does not copy:

- child Tasks;
- workspace-level `blocks` edges;
- workspace-level `related` edges.

Those records do not belong to the Task object being copied. Copying them would
change the workspace graph instead of copying only one Task.

## Project archive and restore contract

TDD 153-157 adds reversible Project archive behavior.

Archiving a Project records optional `archivedAt` on the Project itself. It does
not rewrite the `archivedAt` field of every Task in that Project. The Project,
its Lists, Tasks, Area assignment, description, and relationship edges remain in
workspace state and browser persistence.

Normal workspace surfaces operate on active Projects. Tasks under an archived
Project are therefore excluded from workspace and Project counts, search,
filters, sorting, Project selectors, Area Project counts, and Task move targets.
The archived Project surface exposes `Restore project <name>` controls.

Restoring a Project removes only the Project's `archivedAt`. Tasks that were
independently archived before or during the Project archive remain archived and
return only through the Task archive flow.

The storage document remains version 1 because Project `archivedAt` is an
optional additive field. Persisted values are validated as ISO instants.

## Project template contract

TDD 158-162 adds reusable workspace-local Project templates.

Saving a Project as a template snapshots reusable structure rather than live
workspace identity. A template keeps the Project name and description, List
structure, active Task and Subtask titles, status, priority, description, and
Checklist text/completion. Template-local keys preserve List and parent Task
relationships.

Templates deliberately omit Area assignment, due dates, Tags, People, Custom
Field values, Project/Task archive flags, and workspace-level relationship edges.
Those values are workspace-specific, time-specific, or reference identities that
can disappear independently from the template.

Creating a Project from a template generates fresh IDs for the Project, Lists,
Tasks, and Checklist items and uses one fresh creation timestamp. The saved
template remains independent from its source Project and can still be used after
the source Project is deleted.

## Task archive and restore contract

TDD 148-152 adds reversible Task archive behavior.

Archiving a Task:

- keeps the Task in `WorkspaceState.tasks` instead of deleting it;
- records `archivedAt` using the injected runtime clock;
- applies the same archive timestamp to every descendant Subtask;
- retains Checklists, Tags, assignees, Custom Field values, and relationship
  edges;
- removes the archived subtree from normal workspace and Project Task counts,
  search/filter/sort results, and active Task controls.

Restoring an archived root removes `archivedAt` from that Task and its archived
Subtask subtree. The archive UI lists archived roots rather than every cascaded
descendant, which prevents a child from being restored through the UI while its
parent remains archived.

Archive is intentionally different from delete. Delete removes the Task subtree
and relationship edges that point to it. Archive preserves the graph so the
same Task identities can return on restore.

The storage document remains version 1 because `archivedAt` is an optional Task
field. Older version-1 workspaces remain valid. The loader validates any stored
`archivedAt` value as an ISO instant before exposing it to the application.

## Persistence and recovery

There are two browser persistence documents.

### Durable workspace data

Key:

```text
workspace-app.workspace
```

Current storage version:

```text
1
```

The loader validates entity records, duplicate IDs, cross-entity references,
timestamps, hierarchy constraints, relationship semantics, and dependency
cycles before exposing saved data to the application.

The `workspace-app` prefix is intentionally retained. It is an established data
identifier from before the product was renamed to Yönlek. Renaming that key
without a migration would make existing browser data appear to disappear.

### View preferences

Key:

```text
workspace-app.view-preferences
```

Current storage version:

```text
1
```

View preferences include selected Project, Task search text, filters, Task sort,
grouping, List/Board layout, saved filter sets, and saved views.

Preferences are deliberately less strict than workspace data. Invalid,
unsupported, or unreadable preferences fall back to defaults instead of
blocking application startup. If saved Project focus points to a deleted
Project, Yönlek repairs it to `All projects`.

Workspace data and view preferences stay separate because a Task is durable
domain data while a filter selection is disposable UI state.

## Application architecture

The main runtime flow is:

```text
BrowserApp
  |
  +-- workspace persistence
  |     +-- loadWorkspace
  |     +-- saveWorkspace
  |
  +-- WorkspaceStore
  |     +-- workspaceReducer
  |     +-- transactional persistence
  |     +-- subscriptions
  |
  +-- WorkspaceCommands
  |     +-- ID generation
  |     +-- timestamp generation
  |     +-- domain object creation
  |     +-- reducer actions
  |
  +-- WorkspaceRoot
        +-- useSyncExternalStore subscription
        +-- view-preference coordination
        +-- App UI
```

The domain layer does not read browser APIs. IDs and timestamps enter through
the application-command boundary so tests can inject deterministic values.

`WorkspaceStore` computes the next state, persists it, and only then publishes
it to memory and subscribers. If persistence fails, the old in-memory state
remains current.

## Repository map

The most important paths are:

```text
src/domain/
  Core entities, pure helpers, validation rules, reducer behavior

src/application/
  WorkspaceStore and WorkspaceCommands

src/persistence/
  Versioned workspace and view-preference storage

src/BrowserApp.tsx
  Browser composition and recovery

src/WorkspaceRoot.tsx
  React store subscription and view-state coordination

src/App.tsx
  Current feature-first UI

scripts/run-tdd-bundle.ps1
  Shared fail-fast bundle runner

FEATURES.md
  Implemented and planned product capabilities

CONTRIBUTING.md
  Engineering rules and regression lessons

TDD_LOG.md
  Completed RED/GREEN history

CLICKUP_REFERENCE.md
  Competitor capability research with independence constraints

BRAND_NAME_RESEARCH.md
  Canonical working-name research
```

## Development

Install dependencies:

```powershell
npm install
```

Start Vite:

```powershell
npm run dev
```

Run the complete local gate:

```powershell
npm run check
git diff --check
```

`npm run check` runs, in order:

```text
lint
tests
production build
```

The lint script uses `--deny-warnings`, so a warning fails the gate.

## Test-first workflow

Behavioral production code is written only after a focused test has failed for
the expected reason.

For one behavior:

1. write the test at a stable domain, application, persistence, or UI boundary;
2. run the focused test and confirm the expected RED;
3. add only the implementation needed for that behavior;
4. rerun the focused test and require GREEN;
5. refactor while the focused and relevant regression tests stay green;
6. run the final lint, full test, production build, and diff gates before
   commit.

Existing tests are not weakened to rescue an implementation. If an established
test appears wrong, changing it requires an explicit review of the requirement
first.

Multi-cycle work uses fail-fast PowerShell bundles. A stopped bundle leaves the
repository at the exact failing stage. Do not reset or clean it. Resume bundles
pin the expected branch, HEAD, and dirty paths before continuing. For new RED
coverage, prefer focused test files when that avoids depending on unrelated
historical formatting in a large existing test file. Existing production files
still require guarded live-HEAD context before modification.

See `CONTRIBUTING.md` for the full workflow.

## Current scope limits

Yönlek is still browser-local.

Not implemented yet:

- authentication;
- accounts or remote workspace members;
- roles and permissions;
- backend database or sync;
- realtime collaboration;
- comments and mentions;
- notifications;
- public API or webhooks;
- file attachment storage;
- recurring Tasks;
- time estimates and tracking;
- Board, Calendar, Table, Timeline, or Gantt views;
- export/import backup;
- final responsive design and keyboard-navigation pass.

`FEATURES.md` is the maintained checklist for these gaps.

## Hosting

The frontend can be built as a static Vite application. GitHub Pages deployment
and custom-domain automation are not part of the repository yet.

## Product independence

Yönlek may study established work-management products for generic capability
coverage. That research does not authorize copying source code, assets, icons,
screenshots, marketing text, branded feature names, or distinctive UI
composition.

`CLICKUP_REFERENCE.md` records the current research boundary.

## Naming status

`Yönlek` is the active working product name, npm package name, GitHub repository
name, and local repository folder.

That implementation decision is not trademark clearance.

Formal name clearance remains pending. See `BRAND_NAME_RESEARCH.md`, the repository's canonical naming and brand-research record.

## Licensing

The repository's own source-code license has not been selected yet.

Dependency licenses do not license this project's source. See
`THIRD_PARTY_NOTICES.md` for the current direct-dependency summary.
