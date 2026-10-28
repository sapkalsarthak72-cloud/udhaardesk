/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Shop, Transaction } from '../types';
import { exportTransactionsToCsv } from '../utils/ledger';

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

const BACKUP_FOLDER_NAME = 'UdhaarDesk Khata Backups';

/**
 * Searches for or creates a dedicated 'UdhaarDesk Khata Backups' folder in the user's Drive.
 */
export async function findOrCreateBackupFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(
    `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    throw new Error(`Drive search failed (${searchRes.status}): ${errorBody}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Automated digital khata records and financial backups by UdhaarDesk',
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Failed to create Drive folder: ${errorBody}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a complete snapshot of the shop's khata ledger to Google Drive using multipart upload.
 */
export async function uploadKhataBackupToDrive(
  accessToken: string,
  shop: Shop,
  customers: Customer[],
  transactions: Transaction[]
): Promise<DriveBackupFile> {
  const folderId = await findOrCreateBackupFolder(accessToken);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `UdhaarDesk_Backup_${shop.shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.json`;

  const backupData = {
    app: 'UdhaarDesk',
    version: '1.0.0',
    backupTimestamp: new Date().toISOString(),
    shop,
    customers,
    transactions,
    csvExport: exportTransactionsToCsv(transactions, customers),
    summary: {
      totalCustomers: customers.length,
      totalTransactions: transactions.length,
    },
  };

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: `Complete khata backup with ${customers.length} customers and ${transactions.length} ledger entries`,
  };

  const boundary = '-------UdhaarDeskDriveUploadBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData, null, 2) +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errorText}`);
  }

  const fileInfo = await res.json();
  return fileInfo;
}

/**
 * Lists all previous backups from the user's Google Drive.
 */
export async function listKhataBackupsFromDrive(
  accessToken: string
): Promise<DriveBackupFile[]> {
  const query = encodeURIComponent(
    `name contains 'UdhaarDesk_Backup' and trashed = false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to list Drive files: ${errorBody}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads and parses backup data from Google Drive.
 */
export async function downloadKhataBackupFromDrive(
  accessToken: string,
  fileId: string
): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to download backup file: ${errorText}`);
  }

  return await res.json();
}

/**
 * Deletes a backup file from Google Drive (Mandatory user confirmation handled by caller).
 */
export async function deleteKhataBackupFromDrive(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to delete Drive file: ${errorText}`);
  }

  return true;
}
