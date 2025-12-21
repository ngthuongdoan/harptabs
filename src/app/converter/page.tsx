import TabConverter from '@/components/tab-converter';

export default function ConverterPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Tab Converter</h1>
          <p className="text-muted-foreground">
            Convert harmonica tabs between diatonic and tremolo formats
          </p>
        </div>
        <TabConverter />
      </div>
    </main>
  );
}
