# ClickUp feature and architecture reference

Status: research reference only. This is **not** a clone specification.

## Legal-safe design rule

Use ClickUp as a source of general product-management concepts and capability
coverage. Do not copy:

- ClickUp source code;
- logos, icons, illustrations, screenshots, proprietary assets, or fonts;
- distinctive marketing copy or feature names such as ClickUp Brain / ClickApps;
- exact screen compositions, navigation treatment, card styling, color systems,
  or other distinctive visual expression;
- undocumented/internal implementation details obtained by reverse engineering.

General ideas, systems, methods, and functional concepts can inform our own
implementation, but the product needs its own code, information architecture,
terminology, visual identity, and interaction details.

## Publicly documented ClickUp product architecture

ClickUp documents a hierarchy centered around:

Workspace
→ Spaces
→ Folders / Subfolders
→ Lists
→ Tasks
→ Subtasks

Tasks live inside Lists. Docs, Dashboards, Forms, and Whiteboards can also be
attached throughout parts of the hierarchy.

Important architectural patterns:

1. **Hierarchy-scoped configuration**
   - settings can apply at higher hierarchy levels;
   - lower levels can inherit or override behavior;
   - Custom Fields can be attached by location.

2. **Hierarchy-scoped views**
   - the same underlying tasks can be represented through List, Board, Calendar,
     Gantt, Table, Timeline, Workload, Activity, Map, Mind Map, Dashboard, and
     other views;
   - views are presentation/query layers over shared work data rather than
     separate copies of tasks.

3. **Rich task entity**
   Public docs describe task sections and behavior including:
   - title and description;
   - status;
   - priority;
   - assignees;
   - Custom Fields;
   - subtasks and nested subtasks;
   - task relationships;
   - dependency relationships;
   - checklists;
   - comments and activity;
   - attachments;
   - recurring behavior;
   - time estimates and time tracking.

4. **Search / filter / sort as first-class query behavior**
   Search can use task names, descriptions, and visible Custom Fields. Views can
   filter and sort by many task properties.

5. **Automation engine**
   ClickUp's public model is:
   Trigger → optional Conditions → Actions.
   Automations are scoped by hierarchy location.

6. **Permissions inherited through hierarchy**
   Access can be affected by workspace role, direct item permissions, privacy,
   team membership, and inherited hierarchy permissions.

7. **External integration boundary**
   Public API documentation includes token/OAuth authentication and webhooks.
   Webhooks can subscribe to workspace/location events and are signed.

## Publicly stated technical architecture

ClickUp's engineering blog says ClickUp 3.0 involved a rebuilt database and a
move to a service-based architecture for scalability, maintainability, fault
tolerance, performance, and reliability.

That is only a high-level public principle. It is not enough information to
reconstruct ClickUp's internal architecture and we should not attempt to do so.

## Architecture for our product

We should take the general scalability pattern but use our own simpler model:

Workspace
→ Area
→ Project
→ List
→ Task
→ Subtask

Notes:

- `Workspace` remains the top-level local/application boundary.
- `Area` is an optional grouping for teams, departments, products, clients, or
  other broad workflows.
- `Project` is the project entity we already have.
- `List` is an optional task container within a project.
- Tasks belong to a List once Lists exist.
- Subtasks are task children.
- Checklists remain lightweight task-local items, distinct from subtasks.

This avoids copying ClickUp's exact hierarchy while preserving the useful
scalability concept.

## Recommended feature sequence

### Foundation

1. Areas
2. Lists inside Projects
3. Tasks move between Lists / Projects
4. Subtasks
5. Checklists
6. Manual ordering

### Rich task model

7. Assignees (local identities first; real accounts later)
8. Tags / labels
9. Custom Fields
10. Dependencies
11. General task relationships
12. Recurring tasks
13. Time estimates
14. Time tracking
15. Attachments metadata / local file references
16. Activity history

### Views

17. Board view by status
18. Calendar view
19. Table view
20. Timeline / Gantt foundation
21. Saved views
22. Per-view filters / grouping / sorting

### Productivity

23. Bulk actions
24. Templates
25. Trigger / condition / action automation model
26. Goals / measurable targets
27. Dashboards / reporting

### Knowledge

28. Notes / Docs
29. Project-linked documents
30. Wiki/source-of-truth markers

### Multi-user / backend phase

31. Accounts
32. Workspace members
33. Roles / permissions
34. Sharing
35. Comments / mentions
36. Notifications
37. Backend sync
38. Realtime collaboration
39. Public API
40. Webhooks / integrations

## What not to prioritize yet

During the current bare-bone phase:

- do not chase visual similarity to ClickUp;
- do not copy ClickUp's sidebar or task detail layout;
- do not add backend complexity before the local domain model settles;
- do not build dashboards before the underlying query/custom-field model exists;
- do not build permissions before user/account concepts exist;
- do not build automation before events/actions have stable domain boundaries.

## Sources reviewed

- ClickUp Help: Intro to the Hierarchy
  https://help.clickup.com/hc/en-us/articles/13856392825367-Intro-to-the-Hierarchy
- ClickUp Help: Intro to Lists
  https://help.clickup.com/hc/en-us/articles/6311877646999-Intro-to-Lists
- ClickUp Help: Intro to views
  https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views
- ClickUp Help: Views
  https://help.clickup.com/hc/en-us/sections/39723873580823-Views
- ClickUp Help: Intro to tasks
  https://help.clickup.com/hc/en-us/articles/10552031987735-Intro-to-tasks
- ClickUp Help: Intro to Custom Fields
  https://help.clickup.com/hc/en-us/articles/6303536766231-Intro-to-Custom-Fields
- ClickUp Help: Intro to Relationships
  https://help.clickup.com/hc/en-us/articles/6304528030743-Intro-to-Relationships
- ClickUp Help: Intro to Dependency Relationships
  https://help.clickup.com/hc/en-us/articles/6309155073303-Intro-to-Dependency-Relationships
- ClickUp Help: Intro to Automations
  https://help.clickup.com/hc/en-us/articles/6312102752791-Intro-to-Automations
- ClickUp Help: Intro to Docs
  https://help.clickup.com/hc/en-us/articles/6328174371351-Intro-to-Docs
- ClickUp Help: Intro to Dashboards
  https://help.clickup.com/hc/en-us/articles/6312197753239-Intro-to-Dashboards
- ClickUp Help: Intro to permissions
  https://help.clickup.com/hc/en-us/articles/6309225399703-Intro-to-permissions
- ClickUp Developer: Authentication
  https://developer.clickup.com/docs/authentication
- ClickUp Developer: Webhooks
  https://developer.clickup.com/docs/webhooks
- ClickUp Engineering: ClickUp 3.0 performance and reliability
  https://clickup.com/blog/performance-and-reliability/
