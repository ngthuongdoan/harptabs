
export type Note = string;
export type HarmonicaKey = 'G' | 'Ab' | 'A' | 'Bb' | 'B' | 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'F#';
export type HoleAction = 'blow' | 'draw';

// This layout supports one action per hole.
export type HarmonicaLayout = {
  [hole: number]: {
    action: HoleAction;
    note: Note;
  };
};

export const HARMONICA_KEYS: HarmonicaKey[] = ['G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#'];

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ALL_NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const NOTE_TO_INDEX: { [note: string]: number } = {};
ALL_NOTES.forEach((note, index) => NOTE_TO_INDEX[note] = index);
ALL_NOTES_FLAT.forEach((note, index) => NOTE_TO_INDEX[note] = index);

const C_HARMONICA_LAYOUT: HarmonicaLayout = {
    1: { action: 'blow', note: 'C4' },
    2: { action: 'draw', note: 'D4' },
    3: { action: 'blow', note: 'E4' },
    4: { action: 'draw', note: 'F4' },
    5: { action: 'blow', note: 'G4' },
    6: { action: 'draw', note: 'A4' },
    7: { action: 'blow', note: 'B4' },
    8: { action: 'draw', note: 'C5' },
    9: { action: 'blow', note: 'D5' },
    10: { action: 'draw', note: 'E5' },
    11: { action: 'blow', note: 'F5' },
    12: { action: 'draw', note: 'G5' },
    13: { action: 'blow', note: 'A5' },
    14: { action: 'draw', note: 'B5' },
    15: { action: 'blow', note: 'C6' },
    16: { action: 'draw', note: 'D6' },
    17: { action: 'blow', note: 'E6' },
    18: { action: 'draw', note: 'F6' },
    19: { action: 'blow', note: 'G6' },
    20: { action: 'draw', note: 'A6' },
    21: { action: 'blow', note: 'B6' },
};


function parseNote(note: Note): { name: string, octave: number } {
  const name = note.replace(/[0-9]/g, '');
  const octave = parseInt(note.slice(name.length), 10);
  return { name, octave };
}

function transposeNote(note: Note, semitones: number): Note {
  const { name, octave } = parseNote(note);
  const noteIndex = NOTE_TO_INDEX[name];
  if (noteIndex === undefined) return note;

  const newIndex = (noteIndex + semitones);
  const newNoteName = ALL_NOTES[((newIndex % 12) + 12) % 12];
  const octaveChange = Math.floor(newIndex / 12);
  const newOctave = octave + octaveChange;

  return `${newNoteName}${newOctave}`;
}

export function getHarmonicaLayout(key: HarmonicaKey): HarmonicaLayout {
  if (key === 'C') {
    return C_HARMONICA_LAYOUT;
  }

  const keyOfCIndex = NOTE_TO_INDEX['C'];
  const targetKeyIndex = NOTE_TO_INDEX[key];
  const semitones = targetKeyIndex - keyOfCIndex;

  const newLayout: HarmonicaLayout = {};
  for (const hole in C_HARMONICA_LAYOUT) {
    newLayout[hole] = {
      action: C_HARMONICA_LAYOUT[hole].action,
      note: transposeNote(C_HARMONICA_LAYOUT[hole].note, semitones),
    };
  }

  return newLayout;
}

export function findTabFromNote(layout: HarmonicaLayout, note: Note): { hole: number, action: HoleAction } | null {
  for (const hole in layout) {
    const holeInfo = layout[hole];
    
    if (holeInfo.note === note) {
      return { hole: parseInt(hole), action: holeInfo.action };
    }
  }

  return null;
}

export function generateNoteOptions(): Note[] {
    const notes: Note[] = [];
    for (let octave = 3; octave <= 7; octave++) {
        for (const noteName of ALL_NOTES) {
            notes.push(`${noteName}${octave}`);
        }
    }
    return notes;
}
