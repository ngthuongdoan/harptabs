"use client";

import { usePitchDetector } from "@/hooks/use-pitch-detector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, AlertCircle, Upload, Play, Pause, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useRef } from "react";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PitchDetector() {
  const {
    isListening,
    pitchData,
    error,
    mode,
    isPlaying,
    currentTime,
    duration,
    fileName,
    startListening,
    stopListening,
    loadAudioFile,
    playAudio,
    pauseAudio,
    seekAudio,
  } = usePitchDetector();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadAudioFile(file);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Pitch Detector
        </CardTitle>
        <CardDescription>
          Detect pitch from your microphone or upload an audio file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isListening && (
          <Tabs defaultValue="microphone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="microphone">Microphone</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="microphone" className="space-y-4">
              <div className="flex justify-center py-4">
                <Button size="lg" onClick={startListening} className="w-40">
                  <Mic className="h-5 w-5 mr-2" />
                  Start
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Click "Start" to begin detecting pitch from your microphone</p>
                <p className="text-xs">Make sure to allow microphone access when prompted</p>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="flex justify-center py-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button size="lg" onClick={handleFileUploadClick} className="w-40">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Upload an audio file to analyze pitch</p>
                <p className="text-xs">Supports MP3, WAV, OGG, and other audio formats</p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {isListening && (
          <>
            {/* File info and controls for file mode */}
            {mode === "file" && fileName && (
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={stopListening}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPlaying ? pauseAudio : playAudio}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={([value]) => seekAudio(value)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Microphone controls */}
            {mode === "microphone" && (
              <div className="flex justify-center pb-4 border-b">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopListening}
                  className="w-40"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </div>
            )}

            {/* Pitch display */}
            <div className="space-y-4 min-h-[400px] flex flex-col justify-center">
              {pitchData ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="text-6xl font-bold font-headline">
                      {pitchData.note}
                    </div>
                    <div className="text-2xl text-muted-foreground">
                      {pitchData.frequency} Hz
                    </div>
                    {pitchData.cents !== 0 && (
                      <div className="text-sm text-muted-foreground">
                        {pitchData.cents > 0 ? "+" : ""}
                        {pitchData.cents} cents
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clarity</span>
                      <span>{Math.round(pitchData.clarity * 100)}%</span>
                    </div>
                    <Progress value={pitchData.clarity * 100} className="h-2" />
                  </div>

                  {/* Tuning indicator */}
                  <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary z-10" />
                    <div
                      className="absolute inset-y-0 w-1 bg-foreground transition-all duration-100"
                      style={{
                        left: `calc(50% + ${(pitchData.cents / 50) * 25}%)`,
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
                <div className="text-center text-muted-foreground py-12">
                  <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {mode === "microphone"
                      ? "Play a note on your harmonica..."
                      : isPlaying
                        ? "Listening for pitch..."
                        : "Click play to start analyzing"}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
