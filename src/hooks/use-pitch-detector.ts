import { useCallback, useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';

/**
 * A React hook that provides both real‑time pitch detection from the microphone and
 * offline analysis for uploaded audio files.  This implementation improves upon
 * a simple pitch detector by adding a lightweight preprocessing step, gating
 * frames based on energy, clamping the detected frequencies to a sensible
 * range, smoothing the results across frames and normalising the cents
 * calculation.  It still relies on the underlying McLeod Pitch Method via
 * pitchy, which is appropriate for monophonic signals such as human voice or
 * single instruments.
 *
 * This hook exposes the current pitch (in hertz) and clarity during live
 * detection, the computed note name and cents offset, and utilities for
 * analysing a file and querying the detected pitch at an arbitrary point in
 * time during playback.
 */
export function usePitchDetector() {
  /**
   * Represents a single analysed frame.  If a frame cannot reliably be
   * classified as containing a pitch (for example because the signal energy
   * falls below a threshold or the detector clarity is low) then it is stored
   * as `null`.  Otherwise the object describes the detected frequency, the
   * clarity returned from the underlying detector, a musical note name and
   * cents offset from that note.
   */
  type PitchFrame = {
    time: number;
    frequency: number;
    clarity: number;
    note: string;
    cents: number;
  } | null;

  const [pitch, setPitch] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [pitchData, setPitchData] = useState<PitchFrame[] | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pitchDetectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null);

  /**
   * Converts a detected frequency into a musical note and cents offset.  This
   * assumes equal temperament with A4 tuned to 440 Hz.  The cents offset
   * indicates how many hundredths of a semitone the frequency is above
   * (positive) or below (negative) the nearest chromatic pitch.  A rounding
   * approach is used so that cent values are symmetric around zero.
   */
  function frequencyToNote(frequency: number) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // 440 Hz is A4 which corresponds to MIDI note 69
    const noteNum = 12 * Math.log2(frequency / 440) + 69;
    const nearest = Math.round(noteNum);
    const noteIndex = ((nearest % 12) + 12) % 12;
    const octave = Math.floor(nearest / 12) - 1;
    const centsVal = Math.round((noteNum - nearest) * 100);
    return {
      note: `${noteNames[noteIndex]}${octave}`,
      cents: centsVal,
    };
  }

  /**
   * Mixes a multi‑channel AudioBuffer down to mono by averaging the samples
   * across all channels.  A new buffer with a single channel and the same
   * length and sample rate is returned.  If the input already has one
   * channel, it is returned unchanged.
   */
  function mixToMono(audioBuffer: AudioBuffer, ctx: BaseAudioContext): AudioBuffer {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer;
    }
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const output = ctx.createBuffer(1, length, sampleRate);
    const out = output.getChannelData(0);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        out[i] += data[i] / audioBuffer.numberOfChannels;
      }
    }
    return output;
  }

  /**
   * Applies high‑pass and low‑pass filtering to restrict the signal to the
   * typical vocal/instrument fundamental range (approximately 80–1000 Hz).
   * The returned buffer will have one channel and is rendered via an
   * OfflineAudioContext so that the filtering is synchronous.  After
   * rendering, the signal is normalised so that its peak amplitude is 0.9.
   */
  async function applyVoiceBandFilter(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    const sampleRate = audioBuffer.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
    // Mix to mono first so that we filter only one channel
    const monoBuffer = mixToMono(audioBuffer, offlineCtx);
    const source = offlineCtx.createBufferSource();
    source.buffer = monoBuffer;
    // High‑pass filter to remove rumble and low bass
    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    // Low‑pass filter to remove bright accompaniment and noisy content
    const lowPass = offlineCtx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 1000;
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(offlineCtx.destination);
    source.start();
    const rendered = await offlineCtx.startRendering();
    // Normalise amplitude
    const data = rendered.getChannelData(0);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    if (max > 0) {
      const norm = 0.9 / max;
      for (let i = 0; i < data.length; i++) {
        data[i] *= norm;
      }
    }
    return rendered;
  }

  /**
   * Computes the root mean square (RMS) of a frame.  This provides a simple
   * measure of energy which is used to gate the pitch detector; frames below
   * the threshold are treated as silence and skipped.  RMS is chosen over
   * absolute sum because it scales with signal amplitude but remains in the
   * same domain as the original samples.
   */
  function computeRMS(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      const v = frame[i];
      sum += v * v;
    }
    return Math.sqrt(sum / frame.length);
  }

  /**
   * Smooths an array of pitch frames by replacing each valid frequency with
   * the median of its neighbouring frames.  This helps reduce spurious
   * octave jumps and jitter that can arise from the detector.  Null frames
   * remain null; smoothing occurs only where neighbouring frames exist.
   */
  function smoothPitchFrames(frames: PitchFrame[]): PitchFrame[] {
    const result: PitchFrame[] = new Array(frames.length);
    const getMedian = (vals: number[]) => {
      const sorted = vals.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame) {
        result[i] = null;
        continue;
      }
      // gather neighbouring valid frequencies including current
      const neighbourhood: number[] = [frame.frequency];
      if (i > 0 && frames[i - 1]) neighbourhood.push((frames[i - 1] as any).frequency);
      if (i < frames.length - 1 && frames[i + 1]) neighbourhood.push((frames[i + 1] as any).frequency);
      const medianFreq = getMedian(neighbourhood);
      result[i] = { ...frame, frequency: medianFreq, ...frequencyToNote(medianFreq) };
    }
    return result;
  }

  /**
   * Performs offline analysis of an audio buffer.  The buffer should already
   * have been preprocessed (mixed to mono, filtered and normalised) before
   * calling this function.  The analysis divides the signal into overlapping
   * frames and uses pitchy to find the pitch and clarity for each frame.  A
   * frame is considered valid only if its energy and clarity exceed
   * configured thresholds and the detected frequency lies within a sensible
   * human vocal/instrument range.  The resulting frames are smoothed and
   * stored in state for lookup during playback.
   */
  const analyzeAudioBuffer = useCallback(async (audioBuffer: AudioBuffer) => {
    const windowSize = 2048;
    const hopSize = 1024;
    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0);
    const detector = PitchDetector.forFloat32Array(windowSize);
    const clarityThreshold = 0.75;
    const rmsThreshold = 0.01;
    const minFrequency = 80;
    const maxFrequency = 1000;
    const frames: PitchFrame[] = [];
    for (let i = 0, time = 0; i + windowSize <= data.length; i += hopSize, time += hopSize / sampleRate) {
      const slice = data.subarray(i, i + windowSize);
      const rms = computeRMS(slice);
      if (rms < rmsThreshold) {
        frames.push(null);
        continue;
      }
      const [frequency, clarity] = detector.findPitch(slice, sampleRate);
      if (!frequency || clarity < clarityThreshold || frequency < minFrequency || frequency > maxFrequency) {
        frames.push(null);
        continue;
      }
      const { note: noteName, cents: centsVal } = frequencyToNote(frequency);
      frames.push({ time, frequency, clarity, note: noteName, cents: centsVal });
    }
    // smooth the pitch frames to reduce jitter
    const smoothed = smoothPitchFrames(frames);
    setPitchData(smoothed);
  }, []);

  /**
   * Retrieves the nearest analysed pitch frame for a given playback time.  If
   * there is no analysis data or the time falls outside the analysed range,
   * null is returned.
   */
  const getPitchAtTime = useCallback((time: number): PitchFrame => {
    if (!pitchData) return null;
    const hopSize = 1024;
    const sampleRate = 44100; // assumption used during analysis
    const index = Math.floor((time * sampleRate) / hopSize);
    return pitchData[index] ?? null;
  }, [pitchData]);

  /**
   * Handles real‑time pitch detection from the microphone.  This sets up a
   * Web Audio analyser node, repeatedly captures time‑domain data on every
   * animation frame and passes it through pitchy.  Only when the clarity
   * exceeds the threshold and the frequency lies within the configured
   * bounds are the state variables updated.  After several consecutive
   * frames of low energy or poor clarity the pitch is cleared to avoid
   * flickering.
   */
  const startMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioCtx = audioContextRef.current;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    pitchDetectorRef.current = detector;
    const clarityThreshold = 0.75;
    const minFrequency = 80;
    const maxFrequency = 1000;
    const buffer = new Float32Array(analyser.fftSize);
    let silenceCounter = 0;
    const update = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buffer);
      const rms = computeRMS(buffer);
      if (rms < 0.01) {
        silenceCounter++;
      } else {
        const [frequency, clarity] = pitchDetectorRef.current.findPitch(buffer, audioCtx.sampleRate);
        if (frequency && clarity > clarityThreshold && frequency >= minFrequency && frequency <= maxFrequency) {
          const { note: noteName, cents: centsVal } = frequencyToNote(frequency);
          setPitch(frequency);
          setClarity(clarity);
          setNote(noteName);
          setCents(centsVal);
          silenceCounter = 0;
        } else {
          silenceCounter++;
        }
      }
      // if we've had several frames of silence, clear the display
      if (silenceCounter > 5) {
        setPitch(null);
        setClarity(null);
        setNote(null);
        setCents(null);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);
  }, []);

  /**
   * Stops the real‑time microphone monitoring and cleans up Web Audio nodes.
   */
  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    pitchDetectorRef.current = null;
    setPitch(null);
    setClarity(null);
    setNote(null);
    setCents(null);
  }, []);

  /**
   * Accepts an uploaded audio file, decodes it via Web Audio, preprocesses
   * through mixing, filtering and normalisation, then runs the offline
   * analysis.  During analysis, the hook is effectively in a paused state
   * until the operation completes.
   */
  const loadAudioFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    // Preprocess the buffer to improve pitch detection reliability
    const preprocessed = await applyVoiceBandFilter(decoded);
    await analyzeAudioBuffer(preprocessed);
    await ctx.close();
  }, [analyzeAudioBuffer]);

  // Clean up microphone monitoring on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    pitch,
    clarity,
    note,
    cents,
    pitchData,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    getPitchAtTime,
  };
}
