# Workspace App — TDD cycle 001 (RED)

This is intentionally not a working application yet.

The first behavior test has been written before its production implementation:

- `src/domain/project.test.ts`
- expected missing implementation: `src/domain/project.ts`

Run `npm install`, then `npm test`.

The test run should fail because `./project` does not exist. That failure is the required RED step. Do not create the implementation before observing that failure.

After RED is confirmed, the next change is the smallest `createProject` implementation that satisfies these tests. No UI, persistence, task model, or unrelated feature should be added during that GREEN step.

The project's own source license has not been chosen yet. See `THIRD_PARTY_NOTICES.md` for direct dependency licenses.
