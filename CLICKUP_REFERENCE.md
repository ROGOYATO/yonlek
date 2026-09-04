# ClickUp feature and architecture reference

Status: research reference only. This file is not a clone specification and does
not define Yönlek's visual design.

## Independence rule

ClickUp can be studied for generic work-management capabilities, data
relationships, and publicly described product concepts.

Do not copy:

- source code;
- logos, icons, screenshots, illustrations, proprietary assets, or fonts;
- branded feature names such as ClickUp Brain or ClickApps;
- distinctive marketing wording;
- exact navigation, card layout, screen composition, color systems, or other
  recognizable visual expression;
- undocumented implementation details obtained by reverse engineering.

Yönlek must keep its own code, hierarchy, terminology, visual identity, and
interaction choices.

## Publicly documented ClickUp concepts

The public ClickUp documentation describes a hierarchy centered on:

```text
Workspace
→ Space
→ Folder or Subfolder
→ List
→ Task
→ Subtask
```

The useful product concepts are broader than the exact names in that hierarchy.

### Hierarchy-scoped configuration

Higher-level locations can influence lower-level work. Public documentation
describes location-aware settings and Custom Fields.

For Yönlek, the useful idea is scoped ownership and inheritance. The exact
ClickUp hierarchy is not copied.

### Multiple views over shared work data

ClickUp documents several views over the same underlying work, including List,
Board, Calendar, Gantt, Table, Timeline, Workload, Activity, Map, Mind Map, and
Dashboard-style views.

The reusable product idea is that a view should query and present shared Task
data instead of creating a second copy of the Task.

### Rich task data

Public ClickUp documentation describes Task capabilities such as:

- title and description;
- status and priority;
- assignees;
- Custom Fields;
- Subtasks;
- relationships and dependencies;
- Checklists;
- comments and activity;
- attachments;
- recurring work;
- time estimates and time tracking.

Yönlek uses this only as capability coverage. Its current Task model and
terminology are defined by Yönlek's own domain code.

### Search, filter, and sort

ClickUp treats search, filtering, sorting, and view configuration as core
product behavior.

Yönlek has already adopted the generic idea of query controls over shared Task
data. The implementation is independent.

### Automation

ClickUp publicly describes an automation model based on:

```text
Trigger
→ optional Conditions
→ Actions
```

Yönlek has not implemented automation yet. If it does, the event and command
model should be derived from Yönlek's own domain boundaries.

### Permissions and collaboration

ClickUp documents workspace roles, privacy, sharing, inherited permissions, and
team membership.

Yönlek does not have authenticated users or permissions yet. The current local
Person model is only a Task-assignment identity and must not be treated as an
account or authorization model.

### Integration boundary

ClickUp's developer documentation includes API authentication and webhooks.

Yönlek does not have a public API or webhook model yet. Those belong to the
later backend phase.

## Publicly stated ClickUp technical direction

ClickUp's engineering material has described ClickUp 3.0 as involving database
changes and a move toward service-based architecture for scale and reliability.

That statement is high-level product-engineering context. It is not detailed
enough to reconstruct ClickUp internals, and Yönlek should not attempt to do so.

## Yönlek's independent model

Yönlek currently uses:

```text
Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask
```

Key differences and ownership rules:

- `Area` is an optional Yönlek grouping above Projects.
- `Project` remains the primary work container.
- `List` is an optional Task container inside one Project.
- a Subtask is a Task with `parentTaskId`;
- a Checklist item is Task-local lightweight data;
- Tags, People, Custom Field definitions, and Task relationships live at
  Workspace level;
- Tasks refer to reusable Workspace records by ID.

This model is already implemented through local persistence and validation. It
is not a placeholder copy of ClickUp's hierarchy.

## Current Yönlek coverage

The following capability areas are already implemented:

- Areas;
- Projects;
- Lists;
- Task movement between Projects and Lists;
- nested Subtasks;
- Checklists;
- manual ordering;
- Tags;
- local People and multiple Task assignees;
- text, number, and checkbox Custom Fields;
- directional dependencies;
- symmetric Task relationships;
- Task duplication;
- search, filter, and sort;
- browser-local persistence and recovery;
- separately persisted view preferences.

Task duplication is a Yönlek-specific lifecycle behavior in the current roadmap.
It copies one Task's owned data but not its child Tasks or workspace-level
relationship graph.

See `FEATURES.md` for the authoritative implementation checklist.

## Remaining capability sequence

This sequence is a planning aid, not a promise that every item will be built in
this order.

### Task lifecycle and productivity

1. Task archive and restore
2. Project archive and restore
3. Recurring Tasks
4. Time estimates
5. Time tracking
6. Attachments
7. Activity history
8. Bulk actions
9. Templates

### Views

10. Board
11. Calendar
12. Table
13. Timeline or Gantt foundation
14. Saved views
15. Per-view grouping, filters, and sorts

### Automation and reporting

16. Trigger, condition, and action automation
17. Goals or measurable targets
18. Dashboards and reporting

### Knowledge

19. Notes or Docs
20. Project-linked documents
21. Wiki or source-of-truth behavior

### Multi-user and backend

22. Accounts
23. Workspace members
24. Roles and permissions
25. Sharing
26. Comments and mentions
27. Notifications
28. Backend persistence and sync
29. Realtime collaboration
30. Public API
31. Webhooks and integrations

## What not to prioritize yet

Until the local domain model and core workflows settle:

- do not chase visual similarity to ClickUp;
- do not copy ClickUp's sidebar, Task-detail composition, or styling;
- do not add server architecture only to imitate a mature SaaS product;
- do not build dashboards before their underlying data queries exist;
- do not attach permissions to local People;
- do not build automation before Yönlek has stable events and commands.

## Sources reviewed

The existing research used these public sources:

- ClickUp Help, Intro to the Hierarchy: https://help.clickup.com/hc/en-us/articles/13856392825367-Intro-to-the-Hierarchy
- ClickUp Help, Intro to Lists: https://help.clickup.com/hc/en-us/articles/6311877646999-Intro-to-Lists
- ClickUp Help, Intro to views: https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views
- ClickUp Help, Views: https://help.clickup.com/hc/en-us/sections/39723873580823-Views
- ClickUp Help, Intro to tasks: https://help.clickup.com/hc/en-us/articles/10552031987735-Intro-to-tasks
- ClickUp Help, Intro to Custom Fields: https://help.clickup.com/hc/en-us/articles/6303536766231-Intro-to-Custom-Fields
- ClickUp Help, Intro to Relationships: https://help.clickup.com/hc/en-us/articles/6304528030743-Intro-to-Relationships
- ClickUp Help, Intro to Dependency Relationships: https://help.clickup.com/hc/en-us/articles/6309155073303-Intro-to-Dependency-Relationships
- ClickUp Help, Intro to Automations: https://help.clickup.com/hc/en-us/articles/6312102752791-Intro-to-Automations
- ClickUp Help, Intro to Docs: https://help.clickup.com/hc/en-us/articles/6328174371351-Intro-to-Docs
- ClickUp Help, Intro to Dashboards: https://help.clickup.com/hc/en-us/articles/6312197753239-Intro-to-Dashboards
- ClickUp Help, Intro to permissions: https://help.clickup.com/hc/en-us/articles/6309225399703-Intro-to-permissions
- ClickUp Developer, Authentication: https://developer.clickup.com/docs/authentication
- ClickUp Developer, Webhooks: https://developer.clickup.com/docs/webhooks
- ClickUp Engineering, ClickUp 3.0 performance and reliability: https://clickup.com/blog/performance-and-reliability/

These links are a research snapshot. Recheck them before relying on them for a
future product decision because public documentation can change.
