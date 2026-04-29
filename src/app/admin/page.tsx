'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Database, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDistanceToNow } from 'date-fns';

interface SyncLog {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  source: string;
  advisersAdded: number;
  advisersUpdated: number;
  licenseesAdded: number;
  licenseesUpdated: number;
  movementsAdded: number;
  errorMessage: string | null;
  notes: string | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
  if (status === 'error')   return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  return <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />;
}

export default function AdminPage() {
  const [secret, setSecret]     = useState('');
  const [syncing, setSyncing]   = useState(false);
  const [result, setResult]     = useState<string | null>(null);
  const [isError, setIsError]   = useState(false);
  const [logs, setLogs]         = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/logs?pageSize=10');
      const json = await res.json();
      setLogs(json.data ?? []);
    } catch { /* ignore */ }
    setLogsLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function triggerSync() {
    setSyncing(true);
    setResult(null);
    setIsError(false);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setIsError(true);
        setResult(json.error ?? `Error ${res.status}`);
      } else {
        const d = json.data;
        setResult(
          `Sync complete — ${d.advisersAdded} added, ${d.advisersUpdated} updated, ` +
          `${d.movementsAdded} movements detected (as at ${d.asAtDate})`
        );
        fetchLogs();
      }
    } catch (e) {
      setIsError(true);
      setResult(String(e));
    }
    setSyncing(false);
  }

  const latest = logs[0];

  return (
    <div>
      <PageHeader
        title="Data Sync"
        subtitle="Pull the latest data from the ASIC Financial Adviser Register"
        source="data.gov.au — ASIC Financial Advisers Dataset"
      />

      {/* Last sync status banner */}
      {latest && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${
          latest.status === 'success' ? 'bg-green-50 border-green-200' :
          latest.status === 'error'   ? 'bg-red-50 border-red-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <StatusIcon status={latest.status} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {latest.status === 'success' ? 'Last sync succeeded' :
               latest.status === 'error'   ? 'Last sync failed' : 'Sync in progress…'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {latest.completedAt
                ? formatDistanceToNow(new Date(latest.completedAt), { addSuffix: true })
                : formatDistanceToNow(new Date(latest.startedAt), { addSuffix: true })}
              {latest.status === 'success' && ` · ${latest.advisersAdded + latest.advisersUpdated} adviser records · ${latest.movementsAdded} movements`}
              {latest.errorMessage && ` · ${latest.errorMessage}`}
            </p>
          </div>
        </div>
      )}

      {/* Sync trigger card */}
      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Trigger ASIC Sync
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Downloads the weekly ASIC register CSV from data.gov.au and updates all adviser, licensee, movement, and geographic data.
          Takes 30–90 seconds for ~15,000 records.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Sync secret (from .env SYNC_SECRET)</label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter sync secret…"
              className="mt-1 w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <button
            onClick={triggerSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing ASIC Register…' : 'Sync Now'}
          </button>
        </div>

        {result && (
          <div className={`mt-3 p-3 rounded-md text-sm flex items-start gap-2 ${
            isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {isError
              ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{result}</span>
          </div>
        )}
      </div>

      {/* How the sync works */}
      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">How it works</h2>
        <ol className="space-y-2 text-xs text-muted-foreground">
          {[
            { step: '1', text: 'Downloads the ASIC Financial Advisers Register CSV from data.gov.au (free, no API key needed, updated weekly)' },
            { step: '2', text: 'Parses and validates ~15,000 adviser records with Zod schema validation' },
            { step: '3', text: 'Upserts advisers and licensees into the database (adds new, updates changed)' },
            { step: '4', text: 'Diffs against the previous snapshot to detect movements: transfers, joins, exits, suspensions' },
            { step: '5', text: 'Recomputes geographic aggregations (adviser density + white-space scores) per SA4 region' },
            { step: '6', text: 'Logs the sync result — records added, updated, movements detected' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
          <strong className="text-foreground">Automate with cron</strong> — add to your server&apos;s crontab to run every Wednesday at 06:00 AEST:
        </p>
        <pre className="mt-1.5 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
{`0 20 * * 2  curl -s -X POST https://your-domain.com/api/sync \\
     -H "Authorization: Bearer $SYNC_SECRET"`}
        </pre>
      </div>

      {/* Sync log history */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">Sync History</h2>
        </div>
        {logsLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No syncs run yet</div>
        ) : (
          <div className="divide-y">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <StatusIcon status={log.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">{log.status}</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                      {log.completedAt
                        ? formatDistanceToNow(new Date(log.completedAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {log.status === 'success' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.advisersAdded} added · {log.advisersUpdated} updated · {log.movementsAdded} movements · source: {log.source}
                    </p>
                  )}
                  {log.errorMessage && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{log.errorMessage}</p>
                  )}
                  {log.notes && !log.errorMessage && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
