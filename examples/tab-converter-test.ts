/**
 * Test examples for the harmonica tab converter
 */

import { convertDiatonicToTremolo, convertTremoloToDiatonic } from '@/lib/harmonica';

// Example 1: Simple diatonic to tremolo conversion
console.log('=== Example 1: Diatonic to Tremolo ===');
const diatonicTab1 = '+4 -5 +6 -6 +7';
const result1 = convertDiatonicToTremolo(diatonicTab1);
console.log('Input (Diatonic):', diatonicTab1);
console.log('Output (Tremolo):', result1.convertedTab);
console.log('Success:', result1.success);
console.log('Errors:', result1.errors);
console.log('Warnings:', result1.warnings);
console.log('');

// Example 2: Tremolo to diatonic conversion
console.log('=== Example 2: Tremolo to Diatonic ===');
const tremoloTab1 = '9 11 13 14 15';
const result2 = convertTremoloToDiatonic(tremoloTab1);
console.log('Input (Tremolo):', tremoloTab1);
console.log('Output (Diatonic):', result2.convertedTab);
console.log('Success:', result2.success);
console.log('Errors:', result2.errors);
console.log('Warnings:', result2.warnings);
console.log('');

// Example 3: Multi-line conversion
console.log('=== Example 3: Multi-line Diatonic to Tremolo ===');
const diatonicTab2 = `+4 -4 +5 -5
+6 -6 +7 -7`;
const result3 = convertDiatonicToTremolo(diatonicTab2);
console.log('Input (Diatonic):');
console.log(diatonicTab2);
console.log('Output (Tremolo):');
console.log(result3.convertedTab);
console.log('Success:', result3.success);
console.log('');

// Example 4: Round-trip conversion test
console.log('=== Example 4: Round-trip Test ===');
const originalDiatonic = '+1 -1 +2 -2 +3';
console.log('Original Diatonic:', originalDiatonic);

const toTremolo = convertDiatonicToTremolo(originalDiatonic);
console.log('Converted to Tremolo:', toTremolo.convertedTab);

const backToDiatonic = convertTremoloToDiatonic(toTremolo.convertedTab);
console.log('Converted back to Diatonic:', backToDiatonic.convertedTab);
console.log('Match:', originalDiatonic === backToDiatonic.convertedTab);
console.log('');

// Example 5: Test with note that may have warnings
console.log('=== Example 5: Testing Notes Coverage ===');
const fullScale = '+1 -1 +2 -2 +3 -3 +4 -4 +5 -5 +6 -6 +7 -7 +8 -8 +9 -9 +10 -10';
const result5 = convertDiatonicToTremolo(fullScale);
console.log('Input (Full diatonic scale):', fullScale);
console.log('Output (Tremolo):', result5.convertedTab);
console.log('Warnings:', result5.warnings);
