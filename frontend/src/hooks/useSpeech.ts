import { useState, useCallback, useRef } from 'react';

interface UseSpeechResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeech(): UseSpeechResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const win = typeof window !== 'undefined' ? (window as IWindowWithSpeech) : undefined;
  const SpeechRecognitionConstructor = win?.SpeechRecognition || win?.webkitSpeechRecognition;

  const isSupported = !!SpeechRecognitionConstructor;

  const startListening = useCallback(() => {
    if (!SpeechRecognitionConstructor) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript ?? '';
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Enable it in browser settings and reload.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionConstructor]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, transcript, error, startListening, stopListening };
}
