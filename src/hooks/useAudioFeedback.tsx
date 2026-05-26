
import { useCallback, useRef } from 'react';

interface AudioFeedbackOptions {
  enabled?: boolean;
}

export function useAudioFeedback(options: AudioFeedbackOptions = {}) {
  const { enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current && enabled) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, [enabled]);

  const playTapSound = useCallback(() => {
    if (!enabled) return;
    
    const audioContext = initializeAudioContext();
    if (!audioContext) return;

    // iPhone keyboard "Tock" click sound - sharp, brief, crisp
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Tock sound characteristics - high frequency, very brief
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    
    // High-pass filter for crispness
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    filter.Q.setValueAtTime(1, audioContext.currentTime);
    
    // Very brief, sharp envelope like iOS keyboard click
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }, [enabled, initializeAudioContext]);

  const playCashOutSound = useCallback(() => {
    if (!enabled) return;
    
    const audioContext = initializeAudioContext();
    if (!audioContext) return;

    // iPhone keyboard "Tock" click sound - identical to cash in for consistency
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Same Tock sound characteristics
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    
    // High-pass filter for crispness
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    filter.Q.setValueAtTime(1, audioContext.currentTime);
    
    // Very brief, sharp envelope like iOS keyboard click
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }, [enabled, initializeAudioContext]);

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    playTapSound,
    playCashOutSound,
    cleanup
  };
}
