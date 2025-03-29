import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

interface SpeechOptions {
  onComplete?: () => void;
}

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    try {
      await Speech.stop();
      setIsSpeaking(true);

      // Split text into sentences
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const sentence of sentences) {
        if (!isSpeaking) break;
        
        await Speech.speak(sentence, {
          language: 'en',
          rate: 1.0,
          onDone: () => {
            if (sentences.indexOf(sentence) === sentences.length - 1) {
              setIsSpeaking(false);
              options.onComplete?.();
            }
          }
        });
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      options.onComplete?.();
    }
  }, [isSpeaking]);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking
  };
}; 