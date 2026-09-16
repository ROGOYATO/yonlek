import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type AttachmentDomain = typeof taskDomain & {
  addTaskAttachment?: (
    task: taskDomain.Task,
    input: {
      id: string
      name: string
      sizeBytes: number
      mediaType?: string
      now: string
    },
  ) => taskDomain.Task
  deleteTaskAttachment?: (
    task: taskDomain.Task,
    attachmentId: string,
  ) => taskDomain.Task
}

function task() {
  return taskDomain.createTask({
    id: 'task-1',
    projectId: 'project-1',
    title: 'Attach file',
    now: '2026-09-16T08:00:00.000Z',
  })
}

describe('Task attachment metadata', () => {
  it('adds and deletes immutable attachment metadata', () => {
    const domain = taskDomain as AttachmentDomain
    expect(domain.addTaskAttachment).toBeTypeOf('function')
    expect(domain.deleteTaskAttachment).toBeTypeOf('function')

    const source = task()
    const attached = domain.addTaskAttachment!(source, {
      id: ' attachment-1 ',
      name: ' report.pdf ',
      sizeBytes: 0,
      mediaType: ' application/pdf ',
      now: '2026-09-16T09:00:00.000Z',
    })

    expect(attached.attachments).toEqual([
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 0,
        mediaType: 'application/pdf',
        addedAt: '2026-09-16T09:00:00.000Z',
      },
    ])
    expect(source).not.toHaveProperty('attachments')

    const withoutAttachment = domain.deleteTaskAttachment!(
      attached,
      'attachment-1',
    )
    expect(withoutAttachment).not.toHaveProperty('attachments')
    expect(attached.attachments).toHaveLength(1)
  })

  it('rejects invalid metadata and duplicate attachment IDs', () => {
    const domain = taskDomain as AttachmentDomain
    expect(domain.addTaskAttachment).toBeTypeOf('function')
    expect(domain.deleteTaskAttachment).toBeTypeOf('function')

    const source = task()

    expect(() =>
      domain.addTaskAttachment!(source, {
        id: '   ',
        name: 'report.pdf',
        sizeBytes: 1,
        now: '2026-09-16T09:00:00.000Z',
      }),
    ).toThrow('Task attachment ID is required')

    expect(() =>
      domain.addTaskAttachment!(source, {
        id: 'attachment-1',
        name: '   ',
        sizeBytes: 1,
        now: '2026-09-16T09:00:00.000Z',
      }),
    ).toThrow('Task attachment name is required')

    for (const sizeBytes of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        domain.addTaskAttachment!(source, {
          id: 'attachment-invalid',
          name: 'report.pdf',
          sizeBytes,
          now: '2026-09-16T09:00:00.000Z',
        }),
      ).toThrow('Task attachment size must be a non-negative integer')
    }

    expect(() =>
      domain.addTaskAttachment!(source, {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 1,
        now: 'not-an-instant',
      }),
    ).toThrow('Task attachment timestamp must be an ISO instant')

    const attached = domain.addTaskAttachment!(source, {
      id: 'attachment-1',
      name: 'report.pdf',
      sizeBytes: 1,
      mediaType: '   ',
      now: '2026-09-16T09:00:00.000Z',
    })
    expect(attached.attachments?.[0]).not.toHaveProperty('mediaType')

    expect(() =>
      domain.addTaskAttachment!(attached, {
        id: 'attachment-1',
        name: 'other.pdf',
        sizeBytes: 2,
        now: '2026-09-16T10:00:00.000Z',
      }),
    ).toThrow('Task attachment ID must be unique')

    expect(() =>
      domain.deleteTaskAttachment!(attached, 'missing'),
    ).toThrow('Task attachment does not exist')
  })
})
