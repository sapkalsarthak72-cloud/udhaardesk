/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { runAllTests } from '../tests/ledger.test';

interface TestResultsModalProps {
  onClose: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({ onClose }) => {
  const [testOutput, setTestOutput] = useState<{
    passed: number;
    failed: number;
    results: string[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const output = runAllTests();
      setTestOutput(output);
      setIsRunning(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                16 Business Scenario Verification Suite
              </h3>
              <p className="text-xs text-slate-500">
                Financial logic, FIFO aging, UPI & WhatsApp validators
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

        {/* Status Pill */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {testOutput && testOutput.failed === 0 ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All {testOutput.passed} Tests Passed!
              </span>
            ) : testOutput ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                {testOutput.failed} Tests Failed
              </span>
            ) : (
              <span className="text-xs text-slate-500">Running verification suite...</span>
            )}
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Re-run Tests</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1 font-mono text-xs">
          {isRunning && (
            <div className="text-center py-6 text-slate-500">
              Testing balance calculations, FIFO aging, and WhatsApp links...
            </div>
          )}

          {testOutput &&
            testOutput.results.map((res, idx) => {
              const isPass = res.startsWith('✅');
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border ${
                    isPass
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900 font-bold'
                  }`}
                >
                  {res}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
