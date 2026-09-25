import { describe, expect, it } from 'vitest'

import { readBackupFileText } from './backup-file'

describe('Backup file reader', () => {
  it('reads a JSON backup file without changing its text', async () => {
    const contents = '{"version":1}\n'

    await expect(
      readBackupFileText({
        name: 'backup.JSON',
        async text() {
          return contents
        },
      }),
    ).resolves.toBe(contents)
  })

  it('rejects non-JSON names and empty backup files', async () => {
    await expect(
      readBackupFileText({
        name: 'backup.txt',
        async text() {
          return '{}'
        },
      }),
    ).rejects.toThrow('Backup file must be a JSON file')

    await expect(
      readBackupFileText({
        name: 'backup.json',
        async text() {
          return '   \n'
        },
      }),
    ).rejects.toThrow('Backup file is empty')
  })
})
