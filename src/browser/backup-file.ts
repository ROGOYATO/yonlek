export interface BackupFileLike {
  name: string
  text(): Promise<string>
}

export type BackupFileReader = (file: BackupFileLike) => Promise<string>

export async function readBackupFileText(
  file: BackupFileLike,
): Promise<string> {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('Backup file must be a JSON file')
  }

  const contents = await file.text()

  if (contents.trim().length === 0) {
    throw new Error('Backup file is empty')
  }

  return contents
}
