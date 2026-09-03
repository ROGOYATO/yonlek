import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { createProject } from './domain/project'
import { createTask } from './domain/task'

describe('App', () => {
  it('renders the empty workspace screen', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Workspace')
    expect(html).toContain('No projects yet.')
  })

  it('renders projects and their tasks from supplied state', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T00:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-03T00:05:00.000Z',
    })

    const html = renderToStaticMarkup(
      <App state={{ projects: [project], tasks: [task] }} />,
    )

    expect(html).toContain('Robotics Research')
    expect(html).toContain('Draft experiment plan')
  })
})
