import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Calendar, Sparkles, Layers, ListFilter, Briefcase, Trash2, AlertTriangle, X } from 'lucide-react';

export default function ScraperControlHub({ onScrapeFinished }) {
  const [activeWindow, setActiveWindow] = useState('36h');
  const [isRunning, setIsRunning] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [expandedRunId, setExpandedRunId] = useState(null);

  // Custom Modal State for Confirmations
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const fetchStatusAndLogs = async () => {
    try {
      const res = await axios.get('/api/jobs/scrape/status');
      if (res.data.success) {
        setIsRunning(res.data.status?.isRunning || false);
        setLiveLogs(res.data.logs || []);
      }
    } catch (e) {}
  };

  const fetchHistoryLogs = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/jobs/scrape/logs');
      if (res.data.success) {
        setHistoryLogs(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load history logs', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    fetchHistoryLogs();

    const interval = setInterval(() => {
      fetchStatusAndLogs();
      fetchHistoryLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleTriggerScrape = async (windowKey) => {
    setMsg({ text: '', type: '' });
    try {
      const isFull = windowKey === 'full';
      const res = await axios.post('/api/jobs/scrape/trigger', {
        timeWindow: windowKey,
        useWorkfunctions: isFull
      });

      if (res.data.success) {
        setMsg({ text: `🚀 Scraper launched in background for ${windowKey.toUpperCase()}! Both Jobs & Internships are scraping concurrently.`, type: 'success' });
        setIsRunning(true);
        fetchStatusAndLogs();
        fetchHistoryLogs();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const executeClearLogs = async () => {
    setShowClearConfirmModal(false);
    setClearingLogs(true);
    try {
      const res = await axios.delete('/api/jobs/scrape/logs');
      if (res.data.success) {
        setMsg({ text: '🧹 All scraper execution audit logs cleared successfully!', type: 'success' });
        setHistoryLogs([]);
        setLiveLogs([]);
      }
    } catch (err) {
      setMsg({ text: 'Failed to clear audit logs: ' + err.message, type: 'error' });
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Manual Controls Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-purple-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-time Dual Engine (VPS Tuned: 2 vCPU / 8 GB RAM)</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-outfit">
              Manual Scraper Trigger Hub
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Trigger instant scraping for recent updates (12 Hours, 36 Hours, 3 Days, 5 Days) or perform a Full 189 Workfunction Sweep. Automatically deduplicates records on insertion.
            </p>
          </div>

          {/* Time Window Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: '12h', label: '12 Hours' },
              { key: '36h', label: '36 Hours (Daily)' },
              { key: '3d', label: '3 Days' },
              { key: '5d', label: '5 Days' },
              { key: 'full', label: 'Full 189 Workfunctions' }
            ].map(w => (
              <button
                key={w.key}
                disabled={isRunning}
                onClick={() => {
                  setActiveWindow(w.key);
                  handleTriggerScrape(w.key);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 ${
                  activeWindow === w.key
                    ? 'gradient-btn text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isRunning && activeWindow === w.key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Run {w.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Running Indicator */}
        {isRunning && (
          <div className="mt-6 flex items-center space-x-3 p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <div className="text-xs">
              <strong className="text-white block font-semibold">Background Scraper Executing...</strong>
              <span>Scraping Jobs & Internships concurrently. Results will update automatically.</span>
            </div>
          </div>
        )}

        {/* Message Banner */}
        {msg.text && (
          <div className={`mt-4 p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            msg.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg({ text: '', type: '' })} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Execution History Log Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Scraper Execution History & Log Audit</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { fetchHistoryLogs(); fetchStatusAndLogs(); }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Audit</span>
            </button>

            {/* Clear Logs Button -> Triggers Custom Modal Popup */}
            <button
              disabled={clearingLogs || historyLogs.length === 0}
              onClick={() => setShowClearConfirmModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/20 hover:text-rose-300 transition-all disabled:opacity-40"
            >
              {clearingLogs ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear Audit Logs</span>
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
            <p>Loading execution history...</p>
          </div>
        ) : historyLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
            No historical scraper logs recorded yet. Trigger a manual scrape above or wait for the daily 3:00 AM cron interval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Trigger Type</th>
                  <th className="py-3 px-4">Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Total Items</th>
                  <th className="py-3 px-4">New Inserted Breakdown</th>
                  <th className="py-3 px-4">Updated Breakdown</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyLogs.map(log => (
                  <React.Fragment key={log._id || log.runId}>
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {new Date(log.startedAt || log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.triggerType === 'AUTO_CRON'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {log.triggerType === 'AUTO_CRON' ? '⏰ Auto Cron' : '👤 Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {log.timeWindow?.toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'SUCCESS' && (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Success
                          </span>
                        )}
                        {log.status === 'RUNNING' && (
                          <span className="flex items-center gap-1 text-indigo-400 font-bold animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.durationSec ? `${log.durationSec}s` : 'In progress'}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {log.totalFetched || 0}
                      </td>

                      {/* New Inserted Breakdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-emerald-400 font-bold block">
                            +{log.newInserted || 0} Total
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            (+{log.newJobsInserted || 0} Jobs, +{log.newInternshipsInserted || 0} Internships)
                          </span>
                        </div>
                      </td>

                      {/* Updated Breakdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-indigo-300 font-bold block">
                            {log.updatedCount || 0} Total
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ({log.updatedJobsCount || 0} Jobs, {log.updatedInternshipsCount || 0} Internships)
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedRunId(expandedRunId === log._id ? null : log._id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-indigo-400 hover:text-white"
                        >
                          {expandedRunId === log._id ? 'Hide Logs' : 'View Logs'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Logs */}
                    {expandedRunId === log._id && (
                      <tr>
                        <td colSpan="9" className="p-4 bg-slate-950 border-b border-slate-800">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                              <span>Internal Audit Logs for Run ID: {log.runId}</span>
                              <span>Jobs: {log.jobsCount || 0} | Internships: {log.internshipsCount || 0}</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              {(log.logs || []).map((l, idx) => (
                                <div key={idx} className="text-slate-300">
                                  <span className="text-slate-500">[{l.timestamp}]</span> {l.message}
                                </div>
                              ))}
                              {(!log.logs || log.logs.length === 0) && (
                                <div className="text-slate-500 italic">No specific log messages recorded.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOM POPUP CONFIRMATION MODAL (Replaces Browser window.confirm) */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-outfit">Clear Audit Execution Logs?</h3>
                <p className="text-xs text-slate-300">
                  This will permanently delete all recorded scraper execution history logs from MongoDB. Scraped job & internship opportunities will NOT be affected.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={executeClearLogs}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
