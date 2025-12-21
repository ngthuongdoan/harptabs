# Harmonica Tab Converter

This feature allows you to convert harmonica tabs between diatonic (10-hole) and tremolo (24-hole) notation formats.

## Overview

The tab converter helps you translate tabs written for one type of harmonica to another. This is useful when you have a tab for a diatonic harmonica but want to play it on a tremolo harmonica, or vice versa.

## Notation Formats

### Diatonic Notation
- **Format**: Uses `+` and `-` prefixes to indicate blow and draw
- **Holes**: 1-10
- **Examples**: 
  - `+4` = Hole 4 blow
  - `-5` = Hole 5 draw
  - `+6 -6 +7` = A simple melody

### Tremolo Notation
- **Format**: Uses only hole numbers
- **Holes**: 1-24
- **Examples**:
  - `9` = Hole 9
  - `13` = Hole 13
  - `9 11 13` = A simple melody

## How It Works

The converter uses note mapping between the two harmonica types:

1. **Diatonic to Tremolo**: 
   - Reads the diatonic notation (+/-)
   - Looks up the note for that hole and action
   - Finds the matching tremolo hole that produces the same note

2. **Tremolo to Diatonic**:
   - Reads the tremolo hole number
   - Looks up the note for that hole
   - Finds the matching diatonic hole and action

## Usage

### In the HarpNavigator Component

1. Create a tab using the interactive harmonica diagram
2. Click the **Convert** button in the Tab History section
3. The tab will be converted and the harmonica type will switch automatically

### In the Standalone Converter Page

Visit `/converter` for a dedicated conversion interface:

1. Select the conversion direction (Diatonic ↔ Tremolo)
2. Enter your tab in the input field
3. Click **Convert** to see the result
4. Use **Swap Direction** to reverse the conversion
5. Click **Copy** to copy the converted tab

## API Reference

### Functions

#### `convertDiatonicToTremolo(diatonicTab: string): ConversionResult`

Converts diatonic tab notation to tremolo notation.

**Parameters:**
- `diatonicTab`: String containing diatonic notation (e.g., "+4 -5 +6")

**Returns:** `ConversionResult` object with:
- `success`: Whether conversion completed without errors
- `convertedTab`: The converted tab string
- `errors`: Array of error messages
- `warnings`: Array of warning messages

#### `convertTremoloToDiatonic(tremoloTab: string): ConversionResult`

Converts tremolo tab notation to diatonic notation.

**Parameters:**
- `tremoloTab`: String containing tremolo notation (e.g., "9 11 13")

**Returns:** `ConversionResult` object (same structure as above)

### Types

```typescript
export type ConversionResult = {
  success: boolean;
  convertedTab: string;
  errors: string[];
  warnings: string[];
};
```

## Examples

### Example 1: Simple Melody

**Diatonic Input:**
```
+4 -4 +5 -5 +6
```

**Tremolo Output:**
```
9 10 11 12 13
```

### Example 2: Multi-line Tab

**Diatonic Input:**
```
+4 -5 +6 -6
+7 -7 +8 -8
```

**Tremolo Output:**
```
9 11 13 14
15 16 17 18
```

### Example 3: Round-trip Conversion

```javascript
const original = '+4 -5 +6';
const toTremolo = convertDiatonicToTremolo(original);
// Result: '9 11 13'

const backToDiatonic = convertTremoloToDiatonic(toTremolo.convertedTab);
// Result: '+4 -5 +6'
```

## Limitations

- Some notes available on tremolo harmonicas may not be available on diatonic harmonicas
- Some notes available on diatonic harmonicas may not be available on tremolo harmonicas
- The converter is based on standard C tuning for both harmonica types
- Bends and special techniques are not supported in the conversion

## Warnings and Errors

The converter will provide feedback when:

- **Errors**: Invalid notation format, out-of-range hole numbers
- **Warnings**: Notes that cannot be directly converted (will be marked with `[original]` in the output)

## Testing

Run the test examples to see the converter in action:

```bash
npx tsx examples/tab-converter-test.ts
```

## Components

- **TabConverter** (`src/components/tab-converter.tsx`): Standalone converter UI
- **HarpNavigator** (`src/components/harp-navigator.tsx`): Integrated converter button
- **Converter Functions** (`src/lib/harmonica.ts`): Core conversion logic

## Technical Details

The converter works by:

1. Parsing the input tab notation
2. Looking up each note in the harmonica layout maps
3. Finding the equivalent note on the target harmonica type
4. Preserving line breaks and spacing from the original tab
5. Providing feedback on any conversion issues
