
export type Note = string;
export type HoleAction = 'blow' | 'draw';

// This layout supports one action per hole.
export type HarmonicaLayout = {
  [hole: number]: {
    action: HoleAction;
    note: Note;
  };
};

const C_HARMONICA_LAYOUT: HarmonicaLayout = {
    1: { action: 'blow', note: 'G3' },
    2: { action: 'draw', note: 'D4' },
    3: { action: 'blow', note: 'C4' },
    4: { action: 'draw', note: 'F4' },
    5: { action: 'blow', note: 'E4' },
    6: { action: 'draw', note: 'A4' },
    7: { action: 'blow', note: 'G4' },
    8: { action: 'draw', note: 'B4' },
    9: { action: 'blow', note: 'C5' },
    10: { action: 'draw', note: 'D5' },
    11: { action: 'blow', note: 'E5' },
    12: { action: 'draw', note: 'F5' },
    13: { action: 'blow', note: 'G5' },
    14: { action: 'draw', note: 'A5' },
    15: { action: 'blow', note: 'C6' },
    16: { action: 'draw', note: 'B5' },
    17: { action: 'blow', note: 'E6' },
    18: { action: 'draw', note: 'D6' },
    19: { action: 'blow', note: 'G6' },
    20: { action: 'draw', note: 'F6' },
    21: { action: 'blow', note: 'C7' },
    22: { action: 'draw', note: 'A6' },
    23: { action: 'blow', note: 'E7' },
    24: { action: 'draw', note: 'B6' }
};

export function getHarmonicaLayout(): HarmonicaLayout {
  return C_HARMONICA_LAYOUT;
}
