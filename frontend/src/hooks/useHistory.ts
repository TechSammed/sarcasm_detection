import { useState, useCallback, useEffect } from 'react';
import type { HistoryEntry, PredictResponse } from '../api/types';

const STORAGE_KEY = 'sarcasm_history';
const MAX_ENTRIES = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  // Sync to localStorage on change
  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  const addEntry = useCallback(
    (text: string, context: string | null | undefined, result: PredictResponse) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        context: context ?? null,
        result,
        timestamp: Date.now(),
      };
      setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    },
    [],
  );

  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, clearAll } as const;
}
