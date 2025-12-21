
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
// Converter types and functions

export type ConversionResult = {
  success: boolean;
  convertedTab: string;
  errors: string[];
  warnings: string[];
};

/**
 * Finds the tremolo hole that produces the same note with the same action
 */
function findTremoloHoleForNote(note: Note, action: HoleAction): number | null {
  for (const [holeStr, holeInfo] of Object.entries(TREMOLO_C_LAYOUT)) {
    if (holeInfo.note === note && holeInfo.action === action) {
      return parseInt(holeStr);
    }
  }
  return null;
}

/**
 * Finds the diatonic hole and action that produces the same note
 */
function findDiatonicHoleForNote(note: Note): { hole: number; action: HoleAction } | null {
  for (const [holeStr, holeInfo] of Object.entries(DIATONIC_C_LAYOUT)) {
    if (holeInfo.blow === note) {
      return { hole: parseInt(holeStr), action: 'blow' };
    }
    if (holeInfo.draw === note) {
      return { hole: parseInt(holeStr), action: 'draw' };
    }
  }
  return null;
}

/**
 * Parse a diatonic tab notation (e.g., "+4 -5 +6" or "+4\n-5")
 * Returns array of { hole: number, action: HoleAction }
 */
function parseDiatonicTab(tab: string): Array<{ hole: number; action: HoleAction; raw: string }> {
  const entries: Array<{ hole: number; action: HoleAction; raw: string }> = [];
  const lines = tab.split('\n');
  
  for (const line of lines) {
    const tokens = line.trim().split(/\s+/);
    for (const token of tokens) {
      if (!token) continue;
      
      const match = token.match(/^([+-])(\d+)$/);
      if (match) {
        const action: HoleAction = match[1] === '+' ? 'blow' : 'draw';
        const hole = parseInt(match[2]);
        entries.push({ hole, action, raw: token });
      }
    }
  }
  
  return entries;
}

/**
 * Parse a tremolo tab notation (e.g., "3 10 13" or "3\n10")
 * Returns array of { hole: number }
 */
function parseTremoloTab(tab: string): Array<{ hole: number; raw: string }> {
  const entries: Array<{ hole: number; raw: string }> = [];
  const lines = tab.split('\n');
  
  for (const line of lines) {
    const tokens = line.trim().split(/\s+/);
    for (const token of tokens) {
      if (!token) continue;
      
      const hole = parseInt(token);
      if (!isNaN(hole) && hole >= 1 && hole <= 24) {
        entries.push({ hole, raw: token });
      }
    }
  }
  
  return entries;
}

/**
 * Convert diatonic tab notation to tremolo tab notation
 * Diatonic: +4 -5 +6 (+ = blow, - = draw)
 * Tremolo: 9 11 13 (hole numbers only)
 */
export function convertDiatonicToTremolo(diatonicTab: string): ConversionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result: string[] = [];
  
  try {
    const entries = parseDiatonicTab(diatonicTab);
    
    if (entries.length === 0) {
      return {
        success: false,
        convertedTab: '',
        errors: ['No valid diatonic notation found'],
        warnings: []
      };
    }
    
    const lines = diatonicTab.split('\n');
    let currentLineEntries: string[] = [];
    let entryIndex = 0;
    
    for (const line of lines) {
      const tokens = line.trim().split(/\s+/).filter(t => t);
      currentLineEntries = [];
      
      for (const token of tokens) {
        if (entryIndex >= entries.length) break;
        const entry = entries[entryIndex];
        
        if (entry.raw === token) {
          const diatonicHole = DIATONIC_C_LAYOUT[entry.hole];
          
          if (!diatonicHole) {
            errors.push(`Invalid diatonic hole: ${entry.hole}`);
            entryIndex++;
            continue;
          }
          
          const note = diatonicHole[entry.action];
          const tremoloHole = findTremoloHoleForNote(note, entry.action);
          
          if (tremoloHole !== null) {
            currentLineEntries.push(tremoloHole.toString());
          } else {
            warnings.push(`Note ${note} (${entry.action}) from ${entry.raw} not available on tremolo harmonica`);
            currentLineEntries.push(`[${entry.raw}]`); // Indicate unconvertible
          }
          
          entryIndex++;
        }
      }
      
      if (currentLineEntries.length > 0) {
        result.push(currentLineEntries.join(' '));
      } else if (line.trim() === '') {
        result.push('');
      }
    }
    
    return {
      success: errors.length === 0,
      convertedTab: result.join('\n'),
      errors,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      convertedTab: '',
      errors: [`Conversion error: ${error}`],
      warnings
    };
  }
}

/**
 * Convert tremolo tab notation to diatonic tab notation
 * Tremolo: 9 11 13 (hole numbers only)
 * Diatonic: +4 +5 +6 (+ = blow, - = draw)
 */
export function convertTremoloToDiatonic(tremoloTab: string): ConversionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result: string[] = [];
  
  try {
    const entries = parseTremoloTab(tremoloTab);
    
    if (entries.length === 0) {
      return {
        success: false,
        convertedTab: '',
        errors: ['No valid tremolo notation found'],
        warnings: []
      };
    }
    
    const lines = tremoloTab.split('\n');
    let currentLineEntries: string[] = [];
    let entryIndex = 0;
    
    for (const line of lines) {
      const tokens = line.trim().split(/\s+/).filter(t => t);
      currentLineEntries = [];
      
      for (const token of tokens) {
        if (entryIndex >= entries.length) break;
        const entry = entries[entryIndex];
        
        if (entry.raw === token) {
          const tremoloHole = TREMOLO_C_LAYOUT[entry.hole];
          
          if (!tremoloHole) {
            errors.push(`Invalid tremolo hole: ${entry.hole}`);
            entryIndex++;
            continue;
          }
          
          const note = tremoloHole.note;
          const action = tremoloHole.action;
          const diatonicMatch = findDiatonicHoleForNote(note);
          
          if (diatonicMatch) {
            const prefix = diatonicMatch.action === 'blow' ? '+' : '-';
            currentLineEntries.push(`${prefix}${diatonicMatch.hole}`);
          } else {
            warnings.push(`Note ${note} from tremolo hole ${entry.hole} not available on diatonic harmonica`);
            currentLineEntries.push(`[${entry.raw}]`); // Indicate unconvertible
          }
          
          entryIndex++;
        }
      }
      
      if (currentLineEntries.length > 0) {
        result.push(currentLineEntries.join(' '));
      } else if (line.trim() === '') {
        result.push('');
      }
    }
    
    return {
      success: errors.length === 0,
      convertedTab: result.join('\n'),
      errors,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      convertedTab: '',
      errors: [`Conversion error: ${error}`],
      warnings
    };
  }
}