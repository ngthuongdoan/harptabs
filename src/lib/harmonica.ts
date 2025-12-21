
export type Note = string;
export type HoleAction = 'blow' | 'draw';

export type HarmonicaType = 'diatonic' | 'tremolo';

// Diatonic harmonica - each hole has both blow and draw notes
export type DiatonicHole = {
  blow: Note;
  draw: Note;
};

export type DiatonicLayout = {
  [hole: number]: DiatonicHole;
};

// Tremolo harmonica - each hole has single action
export type TremoloHole = {
  action: HoleAction;
  note: Note;
};

export type TremoloLayout = {
  [hole: number]: TremoloHole;
};

export type HarmonicaLayout = DiatonicLayout | TremoloLayout;

// Standard 10-hole diatonic harmonica in key of C (Richter tuning)
const DIATONIC_C_LAYOUT: DiatonicLayout = {
  1: { blow: 'C4', draw: 'D4' },
  2: { blow: 'E4', draw: 'G4' },
  3: { blow: 'G4', draw: 'B4' },
  4: { blow: 'C5', draw: 'D5' },
  5: { blow: 'E5', draw: 'F5' },
  6: { blow: 'G5', draw: 'A5' },
  7: { blow: 'C6', draw: 'B5' },
  8: { blow: 'E6', draw: 'D6' },
  9: { blow: 'G6', draw: 'F6' },
  10: { blow: 'C7', draw: 'A6' }
};

// Tremolo harmonica (24-hole)
const TREMOLO_C_LAYOUT: TremoloLayout = {
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

export function getHarmonicaLayout(type: HarmonicaType = 'diatonic'): HarmonicaLayout {
  return type === 'diatonic' ? DIATONIC_C_LAYOUT : TREMOLO_C_LAYOUT;
}

export function isDiatonicLayout(layout: HarmonicaLayout): layout is DiatonicLayout {
  const firstHole = layout[Object.keys(layout)[0] as any];
  return firstHole && 'blow' in firstHole && 'draw' in firstHole;
}

export function isTremoloLayout(layout: HarmonicaLayout): layout is TremoloLayout {
  const firstHole = layout[Object.keys(layout)[0] as any];
  return firstHole && 'action' in firstHole && 'note' in firstHole;
}
