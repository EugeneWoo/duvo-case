import { google } from 'googleapis'

let drive = null

export function initializeDrive(accessToken) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  drive = google.drive({ version: 'v3', auth })
  return drive
}

export async function uploadMarkdownToDrive(filename, content, accessToken) {
  if (!accessToken) {
    throw new Error('Google Drive access token required')
  }

  initializeDrive(accessToken)

  const fileMetadata = {
    name: filename,
    mimeType: 'text/markdown',
  }

  const media = {
    mimeType: 'text/markdown',
    body: content,
  }

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink',
    })

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    }
  } catch (error) {
    throw new Error(`Failed to upload to Google Drive: ${error.message}`)
  }
}
