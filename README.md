# Workspace App

A local-first project and task manager built with React, Vite, and TypeScript.

The current implementation is intentionally small. It is being developed as a sequence of tested vertical slices rather than as a broad clone of another product.

## Current checkpoint

Live checkpoint before the workflow update:

- branch: `main`
- commit: `470ee43` (`TDD 015-021: add persisted task management interactions`)
- TDD state: cycle 021 GREEN
- tests: 34 passing
- production build: passing
- lint: 0 warnings, 0 errors

## Implemented behavior

Projects:

- create a project;
- reject a blank project name;
- delete a project and its tasks.

Tasks:

- create a task inside an existing project;
- reject a blank task title;
- rename a task;
- change task status between `todo`, `doing`, and `done`;
- change priority between `low`, `normal`, and `high`;
- delete a task without deleting its project.

Application:

- browser startup loads versioned workspace data from `localStorage`;
- accepted workspace actions are persisted;
- React subscribes to the workspace store;
- project and task validation failures are shown to the user instead of escaping the event handler.

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

The runner is fail-fast. It stops on:

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

## Hosting and backend status

The app is intended to run as a static React/Vite frontend, including GitHub Pages with a custom domain. GitHub Pages deployment has not been added yet.

The current persistence implementation is browser-local. Authentication, shared multi-user data, a remote database, realtime collaboration, and server-side APIs have not been added.

## Licensing

The project's own source-code license has not been chosen yet.

Do not assume that the repository is MIT-licensed merely because several dependencies are. Direct dependency licenses are tracked in `THIRD_PARTY_NOTICES.md`.

No ClickUp source code, proprietary assets, branding, icons, screenshots, or copied UI text are used.
