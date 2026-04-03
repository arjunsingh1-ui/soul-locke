'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EncountersDashboard } from '@/components/tracker/encounters-dashboard';
import { TeamManagement } from '@/components/tracker/team-management';
import { BossPlannerTab } from '@/components/tracker/boss-planner-tab';
import { useTracker, TrackerProvider } from '@/lib/context/tracker-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  return (
    <TrackerProvider>
      <TrackerContent />
    </TrackerProvider>
  );
}

function TrackerContent() {
  const { runCode, initializeRun, loading } = useTracker();
  const [showJoinDialog, setShowJoinDialog] = useState(!runCode);
  const [inputCode, setInputCode] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database tables on first load
    const initDb = async () => {
      try {
        const response = await fetch('/api/init-db', { method: 'POST' });
        if (!response.ok) {
          console.error('Database initialization warning:', await response.text());
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDb();
  }, []);

  const handleStartRun = async () => {
    if (inputCode.trim()) {
      try {
        setInitError(null);
        await initializeRun(inputCode.toUpperCase());
        setShowJoinDialog(false);
      } catch (error) {
        setInitError('Failed to initialize run. Please try again.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pokémon Platinum Soul-Locke Tracker</h1>
          {runCode && (
            <p className="text-lg text-muted-foreground">
              Run Code: <span className="font-mono font-bold text-foreground">{runCode}</span>
            </p>
          )}
        </div>

        {showJoinDialog ? (
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start or Join a Soul-Locke Run</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter a unique code to start a new run or join an existing one. Both players will use the same code to sync their progress.
                </p>
                {initError && <p className="text-sm text-red-600">{initError}</p>}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter run code (e.g., PLAT01)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    maxLength={8}
                    onKeyPress={(e) => e.key === 'Enter' && handleStartRun()}
                    disabled={loading}
                  />
                  <Button onClick={handleStartRun} disabled={!inputCode.trim() || loading}>
                    {loading ? <Spinner className="w-4 h-4" /> : 'Start'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Tabs defaultValue="encounters" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="encounters">Encounters</TabsTrigger>
              <TabsTrigger value="team">Active Team</TabsTrigger>
              <TabsTrigger value="boss">Boss Planner</TabsTrigger>
            </TabsList>

            <TabsContent value="encounters">
              <EncountersDashboard />
            </TabsContent>

            <TabsContent value="team">
              <TeamManagement />
            </TabsContent>

            <TabsContent value="boss">
              <BossPlannerTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}

