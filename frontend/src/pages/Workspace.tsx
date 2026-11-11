import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { predict, getExamples, ApiRequestError, friendlyError } from '../api/client';
import type { PredictResponse, ExampleItem, HistoryEntry } from '../api/types';
import { useSpeech } from '../hooks/useSpeech';
import { useHistory } from '../hooks/useHistory';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResultCard } from '../components/ResultCard';
import { ResultSkeleton } from '../components/ResultSkeleton';
import { HistoryDrawer } from '../components/HistoryDrawer';

const MAX_CHARS = 1000;

export const Workspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Form state
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);

  // Async state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [analyzedText, setAnalyzedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  // Examples
  const [examples, setExamples] = useState<ExampleItem[]>([]);

  // History drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { entries, addEntry, clearAll } = useHistory();

  // Speech
  const {
    isListening,
    isSupported: isSpeechSupported,
    transcript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeech();

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync transcript from speech into text field
  useEffect(() => {
    if (transcript) {
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript).slice(0, MAX_CHARS));
    }
  }, [transcript]);

  // Load curated examples on mount
  useEffect(() => {
    const controller = new AbortController();
    getExamples(controller.signal)
      .then((items) => setExamples(items))
      .catch(() => {
        // Fallback default examples if backend unavailable
        setExamples([
          {
            text: 'Oh great, another Monday. Just what I needed.',
            context: 'Waking up to rain and heavy traffic',
            expected_label: 'sarcastic',
          },
          {
            text: 'Thank you so much for helping me fix that bug, really appreciate it!',
            context: 'Pair programming session',
            expected_label: 'not_sarcastic',
          },
          {
            text: 'Sure, because working 80 hours a week without pay is everyone\'s dream.',
            context: 'Discussion on unpaid overtime',
            expected_label: 'sarcastic',
          },
        ]);
      });

    return () => controller.abort();
  }, []);

  // Handle URL prefill from landing page cards
  useEffect(() => {
    const qText = searchParams.get('text');
    const qContext = searchParams.get('context');
    const autoAnalyze = searchParams.get('analyze');

    if (qText) {
      setText(qText);
      if (qContext) {
        setContext(qContext);
        setShowContext(true);
      }
      // Clean up search params after reading
      setSearchParams({}, { replace: true });

      if (autoAnalyze === 'true') {
        // Trigger auto analyze
        executeAnalysis(qText, qContext || undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run on mount

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Countdown timer for 429 errors
  useEffect(() => {
    if (retryTimer === null || retryTimer <= 0) return;
    const interval = setInterval(() => {
      setRetryTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryTimer]);

  const executeAnalysis = async (
    inputText: string,
    inputContext?: string,
    source: 'text' | 'voice' = 'text',
  ) => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setError('Please enter a sentence to analyze.');
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setError(`Input exceeds the ${MAX_CHARS} character limit.`);
      return;
    }

    // Cancel previous inflight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setRetryTimer(null);

    try {
      const res = await predict(
        {
          text: trimmed,
          context: inputContext?.trim() || null,
          source,
        },
        controller.signal,
      );

      setResult(res);
      setAnalyzedText(trimmed);
      addEntry(trimmed, inputContext?.trim() || null, res);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429 && err.retryAfter) {
          setRetryTimer(err.retryAfter);
        }
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    executeAnalysis(text, context, isListening ? 'voice' : 'text');
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to analyze
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && text.trim()) {
        handleAnalyze();
      }
    }
  };

  const handleSelectExample = (ex: ExampleItem) => {
    setText(ex.text);
    if (ex.context) {
      setContext(ex.context);
      setShowContext(true);
    } else {
      setContext('');
    }
    setError(null);
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setText(entry.text);
    setContext(entry.context || '');
    setShowContext(!!entry.context);
    setResult(entry.result);
    setAnalyzedText(entry.text);
    setError(null);
  };

  const handleClear = () => {
    setText('');
    setContext('');
    setResult(null);
    setError(null);
    setRetryTimer(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F0D] text-[#E6F0EA]">
      <Navbar
        historyCount={entries.length}
        onOpenHistory={() => setDrawerOpen(true)}
      />

      <main className="flex-1 container-app py-6 md:py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Terminal Command Bar / Sub-header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24332B] pb-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#87948C]">
              <span className="text-[#39FF88] font-bold">$</span>
              <span className="text-[#E6F0EA]">sarcasm-detector analyze</span>
              <span className="text-[#526057]">--provider=groq --policy=strict</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#526057]">
              <span>SHORTCUT:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#151C18] border border-[#24332B] text-[#87948C] font-mono">Ctrl+Enter</kbd>
            </div>
          </div>

          {/* ── Main Input Panel ─────────────────────────────────── */}
          <section
            className="bg-[#111714] border border-[#24332B] rounded-md p-5 md:p-6 space-y-4"
            aria-label="Sarcasm Analysis Input"
          >
            {/* Input Label & Clear */}
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor="sarcasm-input" className="text-[#87948C] tracking-wider uppercase font-semibold flex items-center gap-1.5">
                <span className="text-[#39FF88]">&gt;</span>
                <span>ANALYZE STATEMENT</span>
              </label>
              {(text || context) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[#E05252] hover:text-[#ff7b7b] transition-colors cursor-pointer text-xs"
                  aria-label="Clear all inputs"
                >
                  [ CLEAR ]
                </button>
              )}
            </div>

            {/* Terminal Input Box */}
            <div className="relative flex rounded border border-[#24332B] bg-[#0B0F0D] focus-within:border-[#39FF88] focus-within:ring-1 focus-within:ring-[#39FF88] transition-all">
              <span className="select-none pl-3.5 pt-3.5 font-mono text-sm font-bold text-[#39FF88]">&gt;</span>
              <textarea
                id="sarcasm-input"
                rows={4}
                className="w-full bg-transparent px-3 py-3 text-sm md:text-base text-[#E6F0EA] font-sans placeholder-[#526057] focus:outline-none resize-none leading-relaxed"
                placeholder='Enter a statement to analyze... e.g. "Great, another meeting that could have been an email."'
                value={text}
                onChange={(e) => {
                  setText(e.target.value.slice(0, MAX_CHARS));
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                maxLength={MAX_CHARS}
                aria-describedby="char-count"
                disabled={loading}
              />
            </div>

            {/* Context Toggle / Field */}
            <div>
              {!showContext ? (
                <button
                  type="button"
                  onClick={() => setShowContext(true)}
                  className="text-xs font-mono text-[#87948C] hover:text-[#39FF88] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>+</span>
                  <span>add_context (optional)</span>
                </button>
              ) : (
                <div className="space-y-1.5 animate-fade-in font-mono text-xs">
                  <div className="flex items-center justify-between text-[#87948C]">
                    <label htmlFor="context-input" className="tracking-wider uppercase">
                      # CONTEXT / SITUATION
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContext(false);
                        setContext('');
                      }}
                      className="text-[#526057] hover:text-[#E05252] cursor-pointer"
                    >
                      [remove]
                    </button>
                  </div>
                  <div className="flex items-center rounded border border-[#24332B] bg-[#0B0F0D] focus-within:border-[#39FF88] focus-within:ring-1 focus-within:ring-[#39FF88] transition-all">
                    <span className="select-none pl-3 text-xs text-[#526057]">#</span>
                    <input
                      id="context-input"
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 text-xs md:text-sm text-[#E6F0EA] font-sans placeholder-[#526057] focus:outline-none"
                      placeholder="e.g. Someone accidentally dropped their lunch tray in the cafeteria"
                      value={context}
                      onChange={(e) => setContext(e.target.value.slice(0, MAX_CHARS))}
                      maxLength={MAX_CHARS}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar: Voice Left, Char count & Analyze Right */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#24332B]">
              {/* Voice button */}
              <div className="flex items-center gap-3">
                {isSpeechSupported ? (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded border transition-colors font-mono text-xs flex items-center gap-2 cursor-pointer ${
                      isListening
                        ? 'border-[#E05252] bg-[#E05252]/10 text-[#FF7B7B] mic-pulse font-bold'
                        : 'border-[#24332B] bg-[#151C18] text-[#87948C] hover:border-[#39FF88] hover:text-[#39FF88]'
                    }`}
                    aria-label={isListening ? 'Stop voice recording' : 'Start voice input'}
                    title={isListening ? 'Click to stop recording' : 'Click to speak'}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isListening ? 'bg-[#E05252] animate-ping' : 'bg-[#87948C]'
                      }`}
                    />
                    <span>{isListening ? '[ LISTENING... ]' : '[ ◉ LISTEN ]'}</span>
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-[#526057]">
                    [mic_unsupported]
                  </span>
                )}

                {speechError && (
                  <span className="font-mono text-xs text-[#D9A441]" role="alert">
                    err: {speechError}
                  </span>
                )}
              </div>

              {/* Right: Counter + Execute button */}
              <div className="flex items-center gap-4">
                <div id="char-count" className="font-mono text-xs text-[#526057]">
                  <span className={text.length >= MAX_CHARS ? 'text-[#E05252] font-bold' : ''}>
                    {text.length}
                  </span>
                  /{MAX_CHARS}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading || !text.trim() || !!retryTimer}
                  className="btn-primary"
                  aria-label="Analyze text for sarcasm"
                >
                  {loading ? (
                    <>
                      <span className="terminal-cursor font-mono">&gt;</span>
                      <span>ANALYZING...</span>
                    </>
                  ) : retryTimer ? (
                    <span>RATE_LIMITED [{retryTimer}s]</span>
                  ) : (
                    <>
                      <span>ANALYZE</span>
                      <span className="font-mono">&rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Presets / Quick Examples */}
            {examples.length > 0 && (
              <div className="pt-3 border-t border-[#24332B] font-mono text-xs">
                <span className="text-[#526057] block mb-2 text-[11px]">
                  $ test_presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {examples.slice(0, 3).map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectExample(ex)}
                      className="px-2.5 py-1 rounded border border-[#24332B] bg-[#0B0F0D] hover:border-[#39FF88] text-[#87948C] hover:text-[#E6F0EA] transition-colors text-left text-xs truncate max-w-full cursor-pointer"
                      title={ex.text}
                    >
                      &gt; &ldquo;{ex.text.slice(0, 36)}...&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Output / Analysis Section ────────────────────────── */}
          <section aria-label="Sarcasm Analysis Results">
            {/* Error presentation */}
            {error && (
              <div
                role="alert"
                className="p-4 rounded border border-[#E05252]/40 bg-[#E05252]/10 text-xs font-mono text-[#FF7B7B] space-y-2 animate-fade-in mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#E05252]">
                    <span>[ERROR]</span>
                    <span>REQUEST_FAILED</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="px-2 py-0.5 rounded border border-[#E05252]/50 hover:bg-[#E05252]/20 text-[#E05252] font-mono text-xs cursor-pointer"
                  >
                    [ RETRY ↻ ]
                  </button>
                </div>
                <p className="text-[#E6F0EA]/90 font-sans leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && <ResultSkeleton />}

            {/* Analysis Result Card */}
            {!loading && result && (
              <ResultCard
                originalText={analyzedText}
                result={result}
              />
            )}

            {/* Clean Empty State */}
            {!loading && !result && !error && (
              <div
                className="bg-[#111714] border border-[#24332B] rounded-md p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-4 font-mono"
                data-testid="workspace-empty-state"
              >
                <div className="w-10 h-10 rounded border border-[#24332B] bg-[#0B0F0D] flex items-center justify-center text-[#39FF88] text-base font-bold">
                  &gt;_
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#87948C] tracking-wider uppercase">
                    ANALYSIS
                  </div>
                  <p className="text-sm font-semibold text-[#E6F0EA]">
                    Waiting for input...
                  </p>
                  <p className="text-xs text-[#526057] max-w-md mx-auto pt-1 font-sans">
                    Enter a statement in the console above or select a preset test case to execute sarcasm evaluation.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entries={entries}
        onSelect={handleSelectHistory}
        onClear={clearAll}
      />

      <Footer />
    </div>
  );
};

