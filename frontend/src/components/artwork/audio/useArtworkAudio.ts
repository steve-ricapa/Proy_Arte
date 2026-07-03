import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";

const STORAGE_KEY = "artwork-audio-muted";

const getStoredMuted = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
};

const createSound = (src: string, volume: number) => {
  return new Howl({
    src: [src],
    volume,
    preload: true,
    onloaderror: () => {
      console.warn(`[artwork-audio] Could not load sound asset: ${src}`);
    },
    onplayerror: function () {
      this.once("unlock", () => this.play());
    },
  });
};

export default function useArtworkAudio() {
  const [isMuted, setIsMuted] = useState(getStoredMuted);
  const birthSoundRef = useRef<Howl | null>(null);
  const explosionSoundRef = useRef<Howl | null>(null);
  const fallbackContextRef = useRef<AudioContext | null>(null);
  const birthAssetReadyRef = useRef(true);
  const explosionAssetReadyRef = useRef(true);

  const ensureFallbackContext = useCallback(async () => {
    if (typeof window === "undefined") return null;
    if (!fallbackContextRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      fallbackContextRef.current = new AudioCtor();
    }
    if (fallbackContextRef.current.state === "suspended") {
      await fallbackContextRef.current.resume();
    }
    return fallbackContextRef.current;
  }, []);

  const playBirthFallback = useCallback(async () => {
    const ctx = await ensureFallbackContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    overtone.type = "triangle";
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.18);
    overtone.frequency.setValueAtTime(930, now);
    overtone.frequency.exponentialRampToValueAtTime(1320, now + 0.16);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscillator.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 0.3);
    overtone.stop(now + 0.25);
  }, [ensureFallbackContext]);

  const playExplosionFallback = useCallback(async () => {
    const ctx = await ensureFallbackContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }, [ensureFallbackContext]);

  useEffect(() => {
    if (!birthSoundRef.current) {
      birthSoundRef.current = createSound("/sounds/planet-birth.mp3", 0.35);
      birthSoundRef.current.once("loaderror", () => {
        birthAssetReadyRef.current = false;
      });
    }
    if (!explosionSoundRef.current) {
      explosionSoundRef.current = createSound("/sounds/planet-explode.mp3", 0.45);
      explosionSoundRef.current.once("loaderror", () => {
        explosionAssetReadyRef.current = false;
      });
    }

    return () => {
      birthSoundRef.current?.unload();
      explosionSoundRef.current?.unload();
      birthSoundRef.current = null;
      explosionSoundRef.current = null;
      fallbackContextRef.current?.close().catch(() => undefined);
      fallbackContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(isMuted));
    Howler.mute(isMuted);
  }, [isMuted]);

  const armAudio = useCallback(() => {
    Howler.autoUnlock = true;
    Howler.mute(isMuted);
    void ensureFallbackContext();
  }, [ensureFallbackContext, isMuted]);

  const playBirthSound = useCallback(() => {
    if (isMuted) return;
    if (birthAssetReadyRef.current && birthSoundRef.current) {
      birthSoundRef.current.play();
      return;
    }
    void playBirthFallback();
  }, [isMuted, playBirthFallback]);

  const playExplosionSound = useCallback(() => {
    if (isMuted) return;
    if (explosionAssetReadyRef.current && explosionSoundRef.current) {
      explosionSoundRef.current.play();
      return;
    }
    void playExplosionFallback();
  }, [isMuted, playExplosionFallback]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    armAudio,
    playBirthSound,
    playExplosionSound,
    isMuted,
    toggleMute,
  };
}
