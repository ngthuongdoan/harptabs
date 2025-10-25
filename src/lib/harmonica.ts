export type Note = string;
export type HarmonicaKey = 'G' | 'Ab' | 'A' | 'Bb' | 'B' | 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'F#';
export type HoleAction = 'blow' | 'draw';
export type Hole = {
  [action in HoleAction]: Note;
};
export type HarmonicaLayout = {
  [hole: number]: Hole;
};

export const HARMONICA_KEYS: HarmonicaKey[] = ['G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#'];

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ALL_NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const NOTE_TO_INDEX: { [note: string]: number } = {};
ALL_NOTES.forEach((note, index) => NOTE_TO_INDEX[note] = index);
ALL_NOTES_FLAT.forEach((note, index) => NOTE_TO_INDEX[note] = index);

const C_HARMONICA_LAYOUT: HarmonicaLayout = {
  1: { blow: 'C4', draw: 'D4' },
  2: { blow: 'E4', draw: 'G4' },
  3: { blow: 'G4', draw: 'B4' },
  4: { blow: 'C5', draw: 'D5' },
  5: { blow: 'E5', draw: 'F5' },
  6: { blow: 'G5', draw: 'A5' },
  7: { blow: 'C6', draw: 'B5' },
  8: { blow: 'E6', draw: 'D6' },
  9: { blow: 'G6', draw: 'F6' },
  10: { blow: 'C7', draw: 'A6' },
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
      blow: transposeNote(C_HARMONICA_LAYOUT[hole].blow, semitones),
      draw: transposeNote(C_HARMONICA_LAYOUT[hole].draw, semitones),
    };
  }

  return newLayout;
}

export function findTabFromNote(layout: HarmonicaLayout, note: Note): { hole: number, action: HoleAction } | null {
  for (const hole in layout) {
    const holeActions = layout[hole];
    
    if (holeActions.blow === note) {
      return { hole: parseInt(hole), action: 'blow' };
    }
    if (holeActions.draw === note) {
      return { hole: parseInt(hole), action: 'draw' };
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
