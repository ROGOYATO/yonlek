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
