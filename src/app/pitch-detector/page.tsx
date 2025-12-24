import PitchDetector from '@/components/pitch-detector';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PitchDetectorPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Pitch Detector</h1>
            <p className="text-muted-foreground">
              Tune your harmonica or practice playing specific notes
            </p>
          </div>
        </div>
        <PitchDetector />
      </div>
    </main>
  );
}
