# Workspace App

A local-first project and task manager built with React, Vite, and TypeScript.

The current implementation is intentionally small. It is being developed as a sequence of tested vertical slices rather than as a broad clone of another product.

## Current checkpoint

Live checkpoint before the workflow update:

- branch: `main`
- starting commit for this batch: `d153827` (`TDD 022-030: add project rename and task filters`)
- TDD state: cycle 038 GREEN
- tests: 59 passing
- production build: passing after the Vite client type declaration correction
- lint: 0 warnings, 0 errors

## Implemented behavior

Projects:

- create a project;
- reject a blank project name;
- rename a project with the same validation rule;
- delete a project and its tasks.

Tasks:

- create a task inside an existing project;
- reject a blank task title;
- rename a task;
- change task status between `todo`, `doing`, and `done`;
- change priority between `low`, `normal`, and `high`;
- set or clear an optional calendar due date;
- delete a task without deleting its project;
- search task titles;
- filter tasks by status, priority, and due-date presence;
- sort tasks by creation time, title, or due date;
- clear all task filters together.

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

## Hosting and backend status

The app is intended to run as a static React/Vite frontend, including GitHub Pages with a custom domain. GitHub Pages deployment has not been added yet.

The current persistence implementation is browser-local. Authentication, shared multi-user data, a remote database, realtime collaboration, and server-side APIs have not been added.

## Licensing

The project's own source-code license has not been chosen yet.

Do not assume that the repository is MIT-licensed merely because several dependencies are. Direct dependency licenses are tracked in `THIRD_PARTY_NOTICES.md`.

No ClickUp source code, proprietary assets, branding, icons, screenshots, or copied UI text are used.
