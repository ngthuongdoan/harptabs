"use client";

import { useMemo, useRef, useState } from "react";
import { Mic, MicOff, Upload } from "lucide-react";

import { usePitchDetector } from "@/hooks/use-pitch-detector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PitchDetector() {
  const {
    pitch,
    clarity,
    note,
    cents,
    pitchData,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    getPitchAtTime,
    playPreviewAtTime,
  } = usePitchDetector();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(0);

  const analyzedDuration = useMemo(() => {
    const lastFrame = [...(pitchData ?? [])].reverse().find(Boolean);
    return lastFrame?.time ?? 0;
  }, [pitchData]);

  const selectedPitchFrame = useMemo(() => {
    if (!pitchData) return null;
    return getPitchAtTime(selectedTime);
  }, [getPitchAtTime, pitchData, selectedTime]);

  const handleStartMicrophone = async () => {
    await startMicrophone();
    setIsMicActive(true);
  };

  const handleStopMicrophone = () => {
    stopMicrophone();
    setIsMicActive(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingFile(true);
    setSelectedFileName(file.name);
    setSelectedTime(0);

    try {
      await loadAudioFile(file);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectedTimeChange = async (value: number) => {
    setSelectedTime(value);
    await playPreviewAtTime(value);
  };

  const livePitchAvailable =
    pitch !== null && clarity !== null && note !== null && cents !== null;

  const filePitchAvailable = !!selectedPitchFrame;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Pitch Detector
        </CardTitle>
        <CardDescription>
          Detect pitch from your microphone or analyze an uploaded audio file frame by frame
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="microphone" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="microphone">Microphone</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="microphone" className="space-y-6">
            <div className="flex justify-center py-4">
              {isMicActive ? (
                <Button size="lg" variant="destructive" onClick={handleStopMicrophone} className="w-40">
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              ) : (
                <Button size="lg" onClick={handleStartMicrophone} className="w-40">
                  <Mic className="mr-2 h-5 w-5" />
                  Start
                </Button>
              )}
            </div>

            <div className="min-h-[320px] space-y-4">
              {livePitchAvailable ? (
                <>
                  <div className="space-y-2 text-center">
                    <div className="text-6xl font-bold font-headline">{note}</div>
                    <div className="text-2xl text-muted-foreground">{pitch.toFixed(1)} Hz</div>
                    {cents !== 0 && (
                      <div className="text-sm text-muted-foreground">
                        {cents > 0 ? "+" : ""}
                        {cents} cents
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clarity</span>
                      <span>{Math.round(clarity * 100)}%</span>
                    </div>
                    <Progress value={clarity * 100} className="h-2" />
                  </div>

                  <div className="relative h-12 overflow-hidden rounded-lg bg-muted">
                    <div className="absolute inset-y-0 left-1/2 z-10 w-0.5 bg-primary" />
                    <div
                      className="absolute inset-y-0 w-1 bg-foreground transition-all duration-100"
                      style={{
                        left: `calc(50% + ${(Math.max(-50, Math.min(50, cents)) / 50) * 25}%)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-muted-foreground">
                      <span>♭ Flat</span>
                      <span>In Tune</span>
                      <span>Sharp ♯</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Mic className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>{isMicActive ? "Play a note on your harmonica..." : 'Click "Start" to begin detecting pitch'}</p>
                  <p className="mt-2 text-xs">Make sure to allow microphone access when prompted</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-6">
            <div className="flex justify-center py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button size="lg" onClick={handleFileUploadClick} className="w-40" disabled={isAnalyzingFile}>
                <Upload className="mr-2 h-5 w-5" />
                {isAnalyzingFile ? "Analyzing..." : "Upload"}
              </Button>
            </div>

            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{selectedFileName ?? "No file selected"}</p>
                  <p className="text-xs text-muted-foreground">
                    {pitchData ? `${formatTime(selectedTime)} / ${formatTime(analyzedDuration)}` : "Upload an audio file to analyze pitch"}
                  </p>
                </div>
                {pitchData && <span className="text-xs text-muted-foreground">{pitchData.filter(Boolean).length} detected frames</span>}
              </div>

              {pitchData && analyzedDuration > 0 && (
                <Slider
                  value={[selectedTime]}
                  max={analyzedDuration}
                  step={0.01}
                  onValueChange={([value]) => {
                    void handleSelectedTimeChange(value);
                  }}
                  className="cursor-pointer"
                />
              )}
            </div>

            <div className="min-h-[320px] space-y-4">
              {isAnalyzingFile ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Upload className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Analyzing uploaded audio...</p>
                </div>
              ) : filePitchAvailable ? (
                <>
                  <div className="space-y-2 text-center">
                    <div className="text-6xl font-bold font-headline">{selectedPitchFrame.note}</div>
                    <div className="text-2xl text-muted-foreground">
                      {selectedPitchFrame.frequency.toFixed(1)} Hz
                    </div>
                    {selectedPitchFrame.cents !== 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedPitchFrame.cents > 0 ? "+" : ""}
                        {selectedPitchFrame.cents} cents
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clarity</span>
                      <span>{Math.round(selectedPitchFrame.clarity * 100)}%</span>
                    </div>
                    <Progress value={selectedPitchFrame.clarity * 100} className="h-2" />
                  </div>

                  <div className="relative h-12 overflow-hidden rounded-lg bg-muted">
                    <div className="absolute inset-y-0 left-1/2 z-10 w-0.5 bg-primary" />
                    <div
                      className="absolute inset-y-0 w-1 bg-foreground transition-all duration-100"
                      style={{
                        left: `calc(50% + ${(Math.max(-50, Math.min(50, selectedPitchFrame.cents)) / 50) * 25}%)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-muted-foreground">
                      <span>♭ Flat</span>
                      <span>In Tune</span>
                      <span>Sharp ♯</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Upload className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>
                    {pitchData
                      ? "No reliable pitch at the selected time. Move the slider to inspect another frame."
                      : "Upload an audio file to analyze pitch"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
