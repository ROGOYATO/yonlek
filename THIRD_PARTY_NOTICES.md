# Third-party notices

This file summarizes the direct npm dependencies declared by Yönlek. It is not
a license for Yönlek's own source code and it is not a substitute for a release
license audit.

Exact installed versions are pinned by the committed `package-lock.json`.
`package.json` is the source of truth for which dependencies are direct.

## Runtime dependencies

| Package | Role | License |
| --- | --- | --- |
| `react` | UI runtime | MIT |
| `react-dom` | Browser renderer | MIT |

## Development dependencies

| Package | Role | License |
| --- | --- | --- |
| `@testing-library/dom` | DOM test queries and helpers | MIT |
| `@testing-library/react` | React component test utilities | MIT |
| `@testing-library/user-event` | User interaction test utilities | MIT |
| `@types/node` | Node.js type declarations | MIT |
| `@types/react` | React type declarations | MIT |
| `@types/react-dom` | React DOM type declarations | MIT |
| `@vitejs/plugin-react` | React integration for Vite | MIT |
| `jsdom` | Browser-like DOM for tests | MIT |
| `oxlint` | Linter | MIT |
| `typescript` | TypeScript compiler | Apache-2.0 |
| `vite` | Development server and production bundler | MIT |
| `vitest` | Test runner | MIT |

## Release rule

Before a public release:

1. regenerate the complete direct and transitive dependency inventory from the
   committed lockfile;
2. verify each package's actual installed license metadata;
3. preserve attribution or notice text required by any dependency;
4. review any new fonts, icons, images, or other assets separately from npm
   packages;
5. choose and publish an explicit license for Yönlek's own source code.

TDD 145-147 added no new npm dependency. The Task-duplication feature uses the
existing domain, application, React, and test stack.
