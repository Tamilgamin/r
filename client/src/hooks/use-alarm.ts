import { useEffect, useRef, useState } from 'react';

export function useAlarm(isAlarming: boolean, soundType: string = 'default') {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Initialize audio context lazily on user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        setAudioEnabled(true);
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().then(() => setAudioEnabled(true));
    }
  };

  const playBeep = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    // Sound profiles
    if (soundType === 'siren') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, audioCtxRef.current.currentTime + 0.4);
    } else if (soundType === 'pulse') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
    } else {
      // Default beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtxRef.current.currentTime);
    }

    // Volume envelope to prevent clicks
    gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtxRef.current.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.5);
  };

  useEffect(() => {
    if (isAlarming) {
      // Attempt to play immediately if enabled
      initAudio();
      
      if (!intervalIdRef.current) {
        playBeep();
        intervalIdRef.current = setInterval(playBeep, 800);
      }
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isAlarming, soundType, audioEnabled]);

  return { initAudio, audioEnabled };
}
