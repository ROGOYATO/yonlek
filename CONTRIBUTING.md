# Contributing

## Required development loop

Behavioral production code must not be written before its test.

For each change:

1. State one observable behavior.
2. Add or change a test for that behavior.
3. Run the focused test and confirm red for the expected reason.
4. Add the minimum production code needed for green.
5. Run the focused test again.
6. Refactor if useful without changing behavior.
7. Run the full `npm run check` gate.

Do not create tests that only duplicate implementation details or assert comments, formatting, private function structure, or temporary configuration values. Prefer stable public seams and observable domain behavior.

## Scope discipline

Do not add a dependency because it may be useful later. Add one only when a selected feature requires it and its license has been checked.

Do not copy another product's source code, design assets, icons, text, or branding. General ideas such as projects, tasks, statuses, filters, and boards are implemented independently.
