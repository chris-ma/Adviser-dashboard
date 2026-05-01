'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Database, AlertTriangle, KeyRound, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDistanceToNow } from 'date-fns';

// Baked in at build time from NEXT_PUBLIC_SYNC_SECRET env var.
// Set the same value as SYNC_SECRET in Vercel → Settings → Environment Variables.
const BAKED_SECRET = process.env.NEXT_PUBLIC_SYNC_SECRET ?? '';
const LS_KEY = 'syncSecretOverride';

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
  const [syncing, setSyncing]       = useState(false);
  const [result, setResult]         = useState<string | null>(null);
  const [isError, setIsError]       = useState(false);
  const [logs, setLogs]             = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [secretInput, setSecretInput] = useState(BAKED_SECRET);
  const [secretOpen, setSecretOpen]   = useState(false);

  useEffect(() => {
    const override = localStorage.getItem(LS_KEY);
    if (override) setSecretInput(override);
  }, []);

  function handleSecretChange(val: string) {
    setSecretInput(val);
    if (val && val !== BAKED_SECRET) {
      localStorage.setItem(LS_KEY, val);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }

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
    const secret = secretInput || BAKED_SECRET;
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
        if (res.status === 401) setSecretOpen(true);
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
  const usingDefaultSecret = !secretInput || secretInput === 'change-me-in-production';

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

        {/* Secret warning */}
        {usingDefaultSecret && (
          <div className="flex items-start gap-2 p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Sync secret is still the default placeholder. Set <code className="font-mono bg-yellow-100 px-1 rounded">SYNC_SECRET</code> and <code className="font-mono bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SYNC_SECRET</code> to the same value in Vercel, then redeploy. Or enter your secret below.
            </span>
          </div>
        )}

        <button
          onClick={triggerSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing ASIC Register…' : 'Sync Now'}
        </button>

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

        {/* Override sync secret (collapsible) */}
        <div className="mt-4 border-t pt-3">
          <button
            type="button"
            onClick={() => setSecretOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Override sync secret
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${secretOpen ? 'rotate-180' : ''}`} />
          </button>
          {secretOpen && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1.5">
                Use this if your deployed <code className="font-mono bg-muted px-1 rounded">SYNC_SECRET</code> differs from the value baked into this build. The override is saved in browser storage.
              </p>
              <input
                type="password"
                value={secretInput}
                onChange={e => handleSecretChange(e.target.value)}
                placeholder="Enter your SYNC_SECRET value"
                className="w-full text-xs font-mono px-3 py-2 border rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {secretInput && secretInput !== BAKED_SECRET && (
                <p className="text-xs text-blue-600 mt-1">Override active — using manually entered secret.</p>
              )}
            </div>
          )}
        </div>
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
