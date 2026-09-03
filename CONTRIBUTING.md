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
