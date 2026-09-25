export interface BackupDownloadFile {
  filename: string
  contents: string
}

export interface BackupDownloadEnvironment {
  createObjectUrl(contents: string, mediaType: string): string
  clickDownload(url: string, filename: string): void
  revokeObjectUrl(url: string): void
}

export type BackupDownloadHandler = (file: BackupDownloadFile) => void

const defaultEnvironment: BackupDownloadEnvironment = {
  createObjectUrl(contents, mediaType) {
    return URL.createObjectURL(
      new Blob([contents], {
        type: mediaType,
      }),
    )
  },
  clickDownload(url, filename) {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
  },
  revokeObjectUrl(url) {
    URL.revokeObjectURL(url)
  },
}

export function downloadBackupText(
  file: BackupDownloadFile,
  environment: BackupDownloadEnvironment = defaultEnvironment,
): void {
  const url = environment.createObjectUrl(
    file.contents,
    'application/json;charset=utf-8',
  )

  try {
    environment.clickDownload(url, file.filename)
  } finally {
    environment.revokeObjectUrl(url)
  }
}
