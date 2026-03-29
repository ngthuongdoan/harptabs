"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRightLeft, Copy, AlertCircle, Info } from 'lucide-react';
import { convertDiatonicToTremolo, convertTremoloToDiatonic } from '@/lib/harmonica';
import { Badge } from '@/components/ui/badge';

export default function TabConverter() {
  const [inputTab, setInputTab] = useState('');
  const [outputTab, setOutputTab] = useState('');
  const [conversionMode, setConversionMode] = useState<'diatonic-to-tremolo' | 'tremolo-to-diatonic'>('diatonic-to-tremolo');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleConvert = () => {
    if (!inputTab.trim()) {
      setErrors(['Please enter a tab to convert']);
      setOutputTab('');
      setWarnings([]);
      return;
    }

    const result = conversionMode === 'diatonic-to-tremolo'
      ? convertDiatonicToTremolo(inputTab)
      : convertTremoloToDiatonic(inputTab);

    setOutputTab(result.convertedTab);
    setErrors(result.errors);
    setWarnings(result.warnings);
  };

  const handleSwapMode = () => {
    setConversionMode(prev =>
      prev === 'diatonic-to-tremolo' ? 'tremolo-to-diatonic' : 'diatonic-to-tremolo'
    );
    // Swap input and output
    setInputTab(outputTab);
    setOutputTab(inputTab);
    setErrors([]);
    setWarnings([]);
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputTab);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sourceType = conversionMode === 'diatonic-to-tremolo' ? 'Diatonic' : 'Tremolo';
  const targetType = conversionMode === 'diatonic-to-tremolo' ? 'Tremolo' : 'Diatonic';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Harmonica Tab Converter
        </CardTitle>
        <CardDescription>
          Convert harmonica tabs between diatonic and tremolo notation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversion Mode Indicator */}
        <div className="flex items-center justify-center gap-3 p-3 bg-muted rounded-lg">
          <Badge variant="outline" className="text-sm">
            {sourceType}
          </Badge>
          <ArrowRightLeft className="h-4 w-4" />
          <Badge variant="outline" className="text-sm">
            {targetType}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwapMode}
            className="ml-2"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Swap Direction
          </Button>
        </div>

        {/* Format Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {conversionMode === 'diatonic-to-tremolo' ? (
              <>
                <strong>Diatonic format:</strong> Use +/- prefix for blow/draw (e.g., <code className="px-1 py-0.5 bg-muted rounded">+4 -5 +6</code>)
              </>
            ) : (
              <>
                <strong>Tremolo format:</strong> Use hole numbers only (e.g., <code className="px-1 py-0.5 bg-muted rounded">9 11 13</code>)
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Input Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {sourceType} Tab Input
          </label>
          <Textarea
            value={inputTab}
            onChange={(e) => setInputTab(e.target.value)}
            placeholder={
              conversionMode === 'diatonic-to-tremolo'
                ? 'Enter diatonic tab (e.g., +4 -5 +6 -6 +7)'
                : 'Enter tremolo tab (e.g., 9 11 13 14 15)'
            }
            className="font-mono min-h-[120px]"
          />
        </div>

        {/* Convert Button */}
        <Button onClick={handleConvert} className="w-full" size="lg">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Convert to {targetType}
        </Button>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Errors:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Warnings:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Output Section */}
        {outputTab && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {targetType} Tab Output
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOutput}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea
              value={outputTab}
              readOnly
              className="font-mono min-h-[120px] bg-muted"
            />
          </div>
        )}

        {/* Format Reference */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <h4 className="text-sm font-semibold">Format Reference:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">Diatonic Notation:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code className="px-1 py-0.5 bg-muted rounded">+4</code> = Hole 4 blow</li>
                <li><code className="px-1 py-0.5 bg-muted rounded">-5</code> = Hole 5 draw</li>
                <li>Holes: 1-10</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Tremolo Notation:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code className="px-1 py-0.5 bg-muted rounded">9</code> = Hole 9</li>
                <li><code className="px-1 py-0.5 bg-muted rounded">13</code> = Hole 13</li>
                <li>Holes: 1-24</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
