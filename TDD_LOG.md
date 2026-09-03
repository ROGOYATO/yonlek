# TDD Log

## Cycle 001 — RED: create a project

Test written first: `src/domain/project.test.ts`.

Required behavior:

1. trim surrounding whitespace from a project name;
2. retain the supplied id and creation timestamp;
3. reject a blank project name.

Production implementation intentionally absent.

Next gate: run `npm test` and confirm failure because `src/domain/project.ts` does not exist.
