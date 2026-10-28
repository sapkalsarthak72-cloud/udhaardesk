/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  CloudUpload,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initDriveAuth,
  googleSignInForDrive,
  getDriveAccessToken,
  logoutDrive,
} from '../services/googleDriveAuth';
import {
  DriveBackupFile,
  uploadKhataBackupToDrive,
  listKhataBackupsFromDrive,
  downloadKhataBackupFromDrive,
  deleteKhataBackupFromDrive,
} from '../services/googleDriveService';
import { Customer, Shop, Transaction } from '../types';
import { formatDateTime } from '../utils/formatters';

interface GoogleDriveBackupModalProps {
  shop: Shop;
  customers: Customer[];
  transactions: Transaction[];
  onClose: () => void;
  onRestoreData?: (backupData: {
    shop?: Shop;
    customers: Customer[];
    transactions: Transaction[];
  }) => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  shop,
  customers,
  transactions,
  onClose,
  onRestoreData,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Destructive Confirmation States
  const [pendingDeleteFile, setPendingDeleteFile] = useState<DriveBackupFile | null>(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<DriveBackupFile | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        loadBackupsList(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setBackups([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadBackupsList = async (token: string) => {
    setLoadingBackups(true);
    try {
      const list = await listKhataBackupsFromDrive(token);
      setBackups(list);
    } catch (err: any) {
      console.error('Failed to list backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await googleSignInForDrive();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await loadBackupsList(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${res.user.email}!`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Google Drive se connect nahi ho saka.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logoutDrive();
    setCurrentUser(null);
    setAccessToken(null);
    setBackups([]);
    setStatusMessage(null);
  };

  const handleCreateBackup = async () => {
    if (!accessToken) return;
    setIsBackingUp(true);
    setStatusMessage(null);

    try {
      const uploadedFile = await uploadKhataBackupToDrive(
        accessToken,
        shop,
        customers,
        transactions
      );
      setStatusMessage({
        type: 'success',
        text: `Naya Backup safalta-purvak Google Drive me save ho gaya: "${uploadedFile.name}"`,
      });
      await loadBackupsList(accessToken);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Backup failed: ${err.message || 'Kripya dubara koshish karein.'}`,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Mandatory confirmation execution for deletion
  const handleConfirmDelete = async () => {
    if (!pendingDeleteFile || !accessToken) return;
    setIsProcessingAction(true);
    try {
      await deleteKhataBackupFromDrive(accessToken, pendingDeleteFile.id);
      setStatusMessage({
        type: 'success',
        text: `Backup "${pendingDeleteFile.name}" Google Drive se delete ho gaya.`,
      });
      setPendingDeleteFile(null);
      await loadBackupsList(accessToken);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Delete failed: ${err.message}`,
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Mandatory confirmation execution for restore
  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile || !accessToken || !onRestoreData) return;
    setIsProcessingAction(true);
    try {
      const backupData = await downloadKhataBackupFromDrive(accessToken, pendingRestoreFile.id);
      if (!backupData.customers || !backupData.transactions) {
        throw new Error('Invalid backup file structure.');
      }
      onRestoreData({
        shop: backupData.shop,
        customers: backupData.customers,
        transactions: backupData.transactions,
      });
      setStatusMessage({
        type: 'success',
        text: `Data successfully restored from Google Drive (${backupData.customers.length} grahak, ${backupData.transactions.length} entries)!`,
      });
      setPendingRestoreFile(null);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${err.message}`,
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Google Drive Backup & Restore
              </h3>
              <p className="text-xs text-slate-500">
                Apna khata data Google Drive par surakshit rakhein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!currentUser ? (
            /* Google Sign-in View */
            <div className="text-center py-6 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Google Drive se Connect Karein
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Apne dukan ka poora khata hisaab, grahak list, aur CSV exports Google Drive me automatic folder me save karein.
                </p>
              </div>

              {/* Official Google Sign-in Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isAuthenticating ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Connected View */
            <div className="space-y-5">
              {/* Connected Account Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User avatar"
                      className="w-9 h-9 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.displayName || 'Google User'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Disconnect Google Drive"
                  className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Action Banner: Backup Now */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <CloudUpload className="w-4 h-4 text-indigo-300" />
                    <span>Dukaan Data Backup Abhi Karein</span>
                  </h4>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {customers.length} grahak · {transactions.length} transactions · CSV + JSON export
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isBackingUp}
                  onClick={handleCreateBackup}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>{isBackingUp ? 'Uploading...' : 'Drive par Backup Karein'}</span>
                </button>
              </div>

              {/* Backups List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Google Drive par Backups ({backups.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => accessToken && loadBackupsList(accessToken)}
                    disabled={loadingBackups}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingBackups ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingBackups ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Google Drive se backups search ho rahe hain...
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                    Abhi tak koi backup nahi mila. Upar diye gaye button se pehla backup banayein!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {backups.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 sm:px-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(file.createdTime)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Open in Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Google Drive me kholein"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Restore */}
                          {onRestoreData && (
                            <button
                              type="button"
                              onClick={() => setPendingRestoreFile(file)}
                              title="Yeh backup restore karein"
                              className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setPendingDeleteFile(file)}
                            title="Drive se delete karein"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Modal for Destructive Delete */}
      {pendingDeleteFile && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-slate-900">Google Drive se File Delete Karein?</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kya aap sach me <strong>"{pendingDeleteFile.name}"</strong> ko Google Drive se delete karna chahte hain? Yeh action wapas nahi ho sakta.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setPendingDeleteFile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessingAction ? 'Deleting...' : 'Haan, Delete Karein'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Restore */}
      {pendingRestoreFile && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-slate-900">Google Drive Backup Restore Karein?</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kya aap <strong>"{pendingRestoreFile.name}"</strong> se data restore karna chahte hain? Current khata records is backup ke sath update ho jayenge.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setPendingRestoreFile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessingAction ? 'Restoring...' : 'Haan, Restore Karein'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
