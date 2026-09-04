# Feature checklist

This file tracks product behavior, not visual polish. A checkbox moves to
complete only after the behavior has a confirmed GREEN cycle and the final
verification gate has passed.

Verified behavior baseline:

- commit: `d976d0d`
- TDD: 147 GREEN
- tests: 305 passed
- lint: 0 warnings, 0 errors
- production build: passed

## Product identity

- [x] Product-facing Yönlek name
- [x] npm package name `yonlek`
- [x] GitHub repository named `yonlek`
- [x] Local repository folder renamed to `yonlek`
- [x] Existing `workspace-app.*` storage keys preserved for data compatibility
- [ ] Formal Yönlek trademark clearance

The old storage-key prefix is not a branding mistake. It is a compatibility
identifier. Changing it requires a tested migration that can find and move
existing browser data.

## Product hierarchy

Current hierarchy:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```

A Checklist item belongs to one Task and is not another hierarchy level.

- [x] Workspace domain and persistence boundary
- [x] Areas
- [x] Projects
- [x] Lists inside Projects
- [x] Tasks
- [x] Subtasks represented as Tasks with `parentTaskId`
- [x] Checklists
- [x] Manual Area ordering
- [x] Manual Project ordering within Area scope
- [x] Manual List ordering within Project scope
- [x] Manual Task and Subtask ordering within sibling scope
- [x] Manual Checklist item ordering

## Projects

- [x] Create
- [x] Rename
- [x] Description
- [x] Delete with List, Task, Subtask, and relationship cleanup
- [x] Preserve unrelated workspace metadata during deletion
- [x] Project focus by immutable ID
- [x] Project Task counts
- [x] Completion summaries
- [x] Move Tasks between Projects
- [x] Assign Projects to Areas
- [x] Clear Area assignment when an Area is deleted
- [x] Manual ordering
- [ ] Archive and restore
- [ ] Project templates

Project deletion is a selective cleanup operation. It must remove only data
owned by the deleted Project or data that points to one of its deleted Tasks.

## Tasks

### Core lifecycle

- [x] Create
- [x] Rename
- [x] Delete
- [x] Duplicate
- [x] Archive and restore

Task duplication creates one new Task identity. It copies Task-owned values and
nested containers, but it does not copy child Tasks or workspace-level
relationship edges.

Task archive is reversible and uses optional `archivedAt` state on the Task.
Archiving a parent archives its full Subtask subtree with the same timestamp.
Restoring that parent restores the subtree. Archived Tasks remain in workspace
state and persistence, keep their relationships and Task-local data, and are
excluded from normal Task counts, filters, sorting, and Project Task lists. The
archive surface shows archived roots so a cascaded child is not independently
restored under an archived parent through the UI.

### Core fields

- [x] Status
- [x] Priority
- [x] Due date
- [x] Description
- [x] Project assignment
- [x] List assignment

### Search, filter, and sort

- [x] Search title
- [x] Search description
- [x] Status filter
- [x] Priority filter
- [x] Due-date presence filter
- [x] Sort by created time
- [x] Sort by title
- [x] Sort by due date
- [x] Sort by priority
- [x] Manual sort mode
- [x] Clear active Task filters together
- [ ] Per-view grouping
- [ ] Saved filter sets

### Structure

- [x] Create Tasks directly in Lists
- [x] Move between Project and List containers
- [x] Nested Subtasks
- [x] Parent-cycle rejection
- [x] Cascading Subtask deletion
- [x] Parent-chain Project integrity
- [x] Manual sibling ordering

### Checklists

- [x] Create item
- [x] Rename item
- [x] Complete and reopen item
- [x] Delete item
- [x] Completion progress
- [x] Manual item ordering
- [x] Persist and validate Task-local Checklist data

### Tags and assignees

- [x] Workspace Tags
- [x] Assign and remove multiple Tags from Tasks
- [x] Workspace-local People
- [x] Assign and remove multiple People from Tasks
- [x] Cleanup Task references when a Tag or Person is deleted
- [ ] Authenticated accounts
- [ ] Invitations
- [ ] Remote membership

Local People are labels for assignment inside one browser workspace. They do
not imply authentication, email identity, permissions, or notifications.

### Custom fields

- [x] Workspace-level field definitions
- [x] Text fields
- [x] Number fields
- [x] Checkbox fields
- [x] Set and clear Task values
- [x] Persistence type validation
- [x] Cleanup Task values when a definition is deleted
- [ ] Select fields
- [ ] Date fields
- [ ] Formula fields
- [ ] Field type migration
- [ ] Custom Field filtering and sorting

### Relationships

- [x] Directional `blocks` dependency
- [x] Symmetric `related` link
- [x] `Blocked by` derived summary
- [x] Self-link rejection
- [x] Duplicate relationship rejection
- [x] Dependency-cycle rejection
- [x] Relationship cleanup after Task and Project deletion
- [x] Persistence validation and browser reload
- [ ] Additional relationship types

Relationship records live at Workspace level. They refer to Tasks by ID and are
not copied when one Task is duplicated.

### Later task capabilities

- [ ] Recurring Tasks
- [ ] Time estimates
- [ ] Time tracking
- [ ] Attachments
- [ ] Activity history

## Views

Current UI is a semantic list-oriented interface used to prove behavior. The
final navigation and visual system are still deferred.

- [x] All-Project list view
- [x] Focused-Project list view
- [x] Persist selected Project separately from workspace data
- [x] Persist Task search, filters, and sort separately from workspace data
- [ ] Board view
- [ ] Calendar view
- [ ] Table view
- [ ] Timeline
- [ ] Gantt foundation
- [ ] Saved views
- [ ] Per-view grouping
- [ ] Per-view filters and sorts

## Productivity

- [x] Duplicate Task
- [ ] Bulk actions
- [ ] Task and Project templates
- [ ] Automation model with trigger, condition, and action
- [ ] Goals or measurable targets
- [ ] Dashboards and reporting

## Knowledge

- [ ] Notes or Docs
- [ ] Project-linked documents
- [ ] Wiki or source-of-truth markers

## Persistence and recovery

### Implemented

- [x] Versioned workspace document
- [x] Transactional store writes
- [x] Strict workspace validation
- [x] Invalid-workspace recovery screen
- [x] Reset invalid workspace data
- [x] Separate versioned view-preference document
- [x] Best-effort preference storage
- [x] Stale Project focus repair
- [x] Backward-compatible optional collections in storage version 1

### Planned

- [ ] Export backup
- [ ] Import backup
- [ ] Explicit migration framework for a future storage version

## Integration and platform

- [ ] Public API
- [ ] OAuth or application authorization
- [ ] Webhooks
- [ ] Integration framework

## Multi-user and backend phase

- [ ] Accounts
- [ ] Workspace members
- [ ] Roles
- [ ] Permissions
- [ ] Sharing
- [ ] Comments and mentions
- [ ] Notifications
- [ ] Backend persistence
- [ ] Sync
- [ ] Realtime collaboration

These items need a server-side identity and data model. They should not be
attached to the current local Person model.

## Visual and interaction work

Feature behavior currently takes priority over a final design system.

- [ ] Independent app shell and navigation design
- [ ] Responsive layout
- [ ] Typography and spacing system
- [ ] Original icon system or properly licensed icon library
- [ ] Empty-state design
- [ ] Drag-and-drop over the existing manual-order commands
- [ ] Motion and transitions
- [ ] Final keyboard-navigation pass
- [ ] Final accessibility review

## Product independence

- [x] Independent source code
- [x] No ClickUp source code
- [x] No ClickUp proprietary assets, screenshots, or icons
- [x] Yönlek product identity used in the application
- [ ] Maintain original terminology where a generic alternative is practical
- [ ] Maintain independent visual composition during the design phase
- [ ] Review third-party asset and library licenses before final UI work

See `CLICKUP_REFERENCE.md` for the competitor-research boundary.

## Naming

Working product name: **Yönlek**

Implemented naming state:

- product UI: Yönlek
- npm package: `yonlek`
- GitHub repository: `yonlek`
- local repository folder: `yonlek`
- browser storage keys: intentionally still `workspace-app.*`

Formal clearance remains open:

- [ ] TÜRKPATENT
- [ ] WIPO Global Brand Database
- [ ] EUIPO or TMview
- [ ] USPTO if the United States becomes a launch market
- [ ] Turkish company and trade-name review
- [ ] domain-name review
- [ ] major app-store and software-directory review
- [ ] phonetic, visual, and semantic near-match review

See `BRAND_NAME_RESEARCH.md` for the canonical naming and brand-research record.
