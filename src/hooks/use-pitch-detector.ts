"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PitchDetector } from "pitchy";

export interface PitchData {
  frequency: number;
  clarity: number;
  note: string;
  cents: number;
}

export type DetectionMode = "microphone" | "file";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(frequency: number): { note: string; cents: number } {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const noteIndex = Math.round(noteNum) + 69;
  const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
  
  const octave = Math.floor(noteIndex / 12) - 1;
  const noteName = NOTES[noteIndex % 12];
  
  return {
    note: `${noteName}${octave}`,
    cents,
  };
}

export function usePitchDetector() {
  const [isListening, setIsListening] = useState(false);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DetectionMode>("microphone");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current) return;

    const inputBuffer = new Float32Array(detectorRef.current.inputLength);
    analyserRef.current.getFloatTimeDomainData(inputBuffer);

    const [frequency, clarity] = detectorRef.current.findPitch(
      inputBuffer,
      audioContextRef.current!.sampleRate
    );

    if (frequency && clarity > 0.9) {
      const { note, cents } = frequencyToNote(frequency);
      setPitchData({
        frequency: Math.round(frequency * 100) / 100,
        clarity: Math.round(clarity * 100) / 100,
        note,
        cents,
      });
    } else {
      setPitchData(null);
    }

    // Update current time for file playback
    if (mode === "file" && audioContextRef.current && isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
      setCurrentTime(Math.min(elapsed, duration));
    }

    animationFrameRef.current = requestAnimationFrame(updatePitch);
  }, [mode, isPlaying, duration]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Create pitch detector
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);

      setMode("microphone");
      setIsListening(true);
      updatePitch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access microphone";
      setError(errorMessage);
      console.error("Error starting pitch detection:", err);
    }
  }, [updatePitch]);

  const loadAudioFile = useCallback(async (file: File) => {
    try {
      setError(null);
      setFileName(file.name);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Create audio context
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      audioBufferRef.current = audioBuffer;

      // Create pitch detector
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);

      setDuration(audioBuffer.duration);
      setCurrentTime(0);
      setMode("file");
      setIsListening(true);
      
      // Don't start playing automatically
      setIsPlaying(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load audio file";
      setError(errorMessage);
      console.error("Error loading audio file:", err);
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || !analyserRef.current) return;

    // Stop existing source if any
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    // Create new source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    // Start from current time
    const offset = pauseTimeRef.current;
    source.start(0, offset);
    startTimeRef.current = audioContextRef.current.currentTime;

    sourceNodeRef.current = source;

    // Handle end of playback
    source.onended = () => {
      if (pauseTimeRef.current >= duration - 0.1) {
        // Reached end
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
      }
    };

    setIsPlaying(true);
    updatePitch();
  }, [duration, updatePitch]);

  const pauseAudio = useCallback(() => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;

      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
      setIsPlaying(false);
    }
  }, []);

  const seekAudio = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    
    if (isPlaying) {
      pauseAudio();
    }

    pauseTimeRef.current = time;
    setCurrentTime(time);

    if (wasPlaying) {
      playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);

  const stopListening = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop audio source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    detectorRef.current = null;
    audioBufferRef.current = null;
    scriptProcessorRef.current = null;
    
    setIsListening(false);
    setIsPlaying(false);
    setPitchData(null);
    setCurrentTime(0);
    setDuration(0);
    setFileName(null);
    pauseTimeRef.current = 0;
    startTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    pitchData,
    error,
    mode,
    isPlaying,
    currentTime,
    duration,
    fileName,
    startListening,
    stopListening,
    loadAudioFile,
    playAudio,
    pauseAudio,
    seekAudio,
  };
}
