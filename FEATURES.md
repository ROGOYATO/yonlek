# Feature checklist

Direction: build an original, feature-rich project/work management product that
can reach broad capability parity with products such as ClickUp **without**
copying their protected expression, branding, assets, or distinctive UI.

Current prepared feature state after TDD 144.

## Product identity

- [x] Product-facing Yönlek identity
- [x] Existing localStorage keys preserved across branding
- [ ] Formal Yönlek trademark clearance

## Product hierarchy

Target independent hierarchy:

Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask

- [x] Workspace domain/persistence boundary
- [x] Areas
- [x] Projects
- [x] Lists inside projects
- [x] Tasks
- [x] Subtasks
- [x] Checklists
- [x] Manual Area ordering
- [x] Manual List ordering
- [x] Manual Checklist item ordering

## Projects

- [x] Create
- [x] Rename
- [x] Delete with task cascade
- [x] Project focus
- [x] Project task counts
- [x] Completion summaries
- [x] Move tasks between projects
- [x] Project descriptions
- [x] Assign projects to Areas
- [x] Unassign projects when an Area is deleted
- [x] Manual project ordering
- [ ] Archive / restore
- [ ] Project templates

## Tasks

- [x] Create
- [x] Rename
- [x] Delete
- [x] Status
- [x] Priority
- [x] Due date
- [x] Description
- [x] Search title / description
- [x] Status filter
- [x] Priority filter
- [x] Due-date filter
- [x] Sort by created/title/due date/priority
- [x] Move between project/list containers
- [x] Assign tasks to Lists
- [x] Create tasks directly in a List
- [x] Nested subtask relationships
- [x] Cascading subtask deletion
- [x] Checklist item create / rename / complete / delete
- [x] Checklist completion progress
- [x] Subtasks
- [x] Checklists
- [x] Manual ordering
- [x] Task Tag assignment / removal
- [x] Multiple Task assignees
- [x] Text / number / checkbox Custom Field values
- [x] Dependency cycle rejection
- [x] Related-task links
- [ ] Duplicate
- [ ] Archive / restore
- [x] Tags / labels
- [x] Assignees / local people
- [x] Custom Fields
- [x] Dependencies
- [x] General relationships
- [ ] Recurring tasks
- [ ] Time estimates
- [ ] Time tracking
- [ ] Attachments
- [ ] Activity history

## Views

- [x] All-project list view
- [x] Focused-project list view
- [ ] Board view
- [ ] Calendar view
- [ ] Table view
- [ ] Timeline
- [ ] Gantt foundation
- [ ] Saved views
- [ ] Per-view grouping
- [ ] Per-view filters/sorts

## Productivity

- [ ] Bulk actions
- [ ] Templates
- [ ] Automation trigger / condition / action model
- [ ] Goals / measurable targets
- [ ] Dashboards / reporting

## Knowledge

- [ ] Notes / Docs
- [ ] Project-linked documents
- [ ] Wiki/source-of-truth behavior

## Persistence / recovery

- [x] Versioned workspace persistence
- [x] Transactional store writes
- [x] Strict workspace validation
- [x] Invalid-workspace recovery
- [x] Reset recovery
- [x] Separate view-preference persistence
- [x] Best-effort preference storage
- [x] Stale focus repair
- [ ] Export backup
- [ ] Import backup

## Integration / platform

- [ ] Public API
- [ ] OAuth/application authorization
- [ ] Webhooks
- [ ] Integration framework

## Multi-user / backend phase

- [ ] Accounts
- [ ] Members
- [ ] Roles
- [ ] Permissions
- [ ] Sharing
- [ ] Comments / mentions
- [ ] Notifications
- [ ] Backend sync
- [ ] Realtime collaboration

## Deferred visual/UI polish

Feature work comes first. Do not try to make the current UI visually resemble
ClickUp.

- [ ] Independent design system
- [ ] Original app shell/navigation design
- [ ] Typography/spacing pass
- [ ] Responsive layout
- [ ] Original icon system or properly licensed icon library
- [ ] Empty-state polish
- [ ] Motion/transitions
- [ ] Final accessibility and keyboard-navigation polish

## Legal-safe similarity rules

- [x] Independent source code
- [x] No ClickUp assets/screenshots/icons
- [x] No ClickUp branding
- [ ] Maintain original terminology where a generic alternative is practical
- [ ] Maintain independent visual composition
- [ ] Trademark-clear final product name before public launch
- [ ] Review third-party asset/library licenses before final UI phase

## Naming

- Working candidate: **Yönlek**
- Status: preliminary web collision check only
- Final trademark clearance: [ ] TÜRKPATENT
- Final trademark clearance: [ ] WIPO
- Final trademark clearance: [ ] EUIPO/TMview
- US launch clearance if needed: [ ] USPTO

See `BRAND_NAME_RESEARCH.md` for the preliminary name study.
