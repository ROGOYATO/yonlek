import { describe, expect, it } from 'vitest'

import {
  downloadBackupText,
  type BackupDownloadEnvironment,
} from './backup-download'

describe('Backup browser download boundary', () => {
  it('creates one JSON object URL, clicks it, and always revokes it', () => {
    const events: string[] = []
    const environment: BackupDownloadEnvironment = {
      createObjectUrl(contents, mediaType) {
        events.push(`create:${mediaType}:${contents}`)
        return 'blob:backup'
      },
      clickDownload(url, filename) {
        events.push(`click:${url}:${filename}`)
      },
      revokeObjectUrl(url) {
        events.push(`revoke:${url}`)
      },
    }

    downloadBackupText(
      {
        filename: 'yonlek-backup.json',
        contents: '{"version":1}\n',
      },
      environment,
    )

    expect(events).toEqual([
      'create:application/json;charset=utf-8:{"version":1}\n',
      'click:blob:backup:yonlek-backup.json',
      'revoke:blob:backup',
    ])
  })

  it('revokes the object URL even when triggering the download fails', () => {
    const events: string[] = []
    const environment: BackupDownloadEnvironment = {
      createObjectUrl() {
        return 'blob:backup'
      },
      clickDownload() {
        throw new Error('Download click failed')
      },
      revokeObjectUrl(url) {
        events.push(url)
      },
    }

    expect(() =>
      downloadBackupText(
        {
          filename: 'yonlek-backup.json',
          contents: '{}\n',
        },
        environment,
      ),
    ).toThrow('Download click failed')

    expect(events).toEqual(['blob:backup'])
  })
})
