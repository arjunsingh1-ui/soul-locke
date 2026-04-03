'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EncountersDashboard } from '@/components/tracker/encounters-dashboard';
import { TeamManagement } from '@/components/tracker/team-management';
import { BossPlannerTab } from '@/components/tracker/boss-planner-tab';
import { useTracker, TrackerProvider } from '@/lib/context/tracker-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

const RUN_CODE_KEY = 'soul-locke-run-code';

export default function Home() {
  return (
    <TrackerProvider>
      <TrackerContent />
    </TrackerProvider>
  );
}

function TrackerContent() {
  const { runCode, initializeRun, loading, error } = useTracker();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  // On mount: try to restore a previous run code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RUN_CODE_KEY);
    if (saved) {
      initializeRun(saved).catch(() => {
        // If restore fails, show the join dialog so the user can try again
        localStorage.removeItem(RUN_CODE_KEY);
        setShowJoinDialog(true);
      });
    } else {
      setShowJoinDialog(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once a run is active, hide the dialog and persist the code
  useEffect(() => {
    if (runCode) {
      localStorage.setItem(RUN_CODE_KEY, runCode);
      setShowJoinDialog(false);
    }
  }, [runCode]);

  const handleStartRun = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setInitError(null);
    try {
      await initializeRun(code);
      setInputCode('');
    } catch {
      setInitError('Failed to initialize run. Check your connection and try again.');
    }
  };

  const handleSwitchRun = () => {
    localStorage.removeItem(RUN_CODE_KEY);
    setInputCode('');
    setInitError(null);
    setShowJoinDialog(true);
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Pokémon Platinum Soul-Locke Tracker
            </h1>
            {runCode && (
              <p className="text-lg text-muted-foreground">
                Run Code:{' '}
                <span className="font-mono font-bold text-foreground">
                  {runCode}
                </span>
              </p>
            )}
          </div>
          {runCode && (
            <Button variant="outline" size="sm" onClick={handleSwitchRun}>
              Switch Run
            </Button>
          )}
        </div>

        {/* Loading state while auto-restoring a saved run */}
        {loading && !showJoinDialog && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Spinner />
            <span>Loading your run…</span>
          </div>
        )}

        {/* Join / start dialog */}
        <Dialog
          open={showJoinDialog}
          onOpenChange={(open) => {
            // Don't let the user close the dialog without a run code
            if (!open && !runCode) return;
            setShowJoinDialog(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start or Join a Soul-Locke Run</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a unique code to start a new run or rejoin an existing
                one. Both players use the same code to share progress.
              </p>
              {(initError ?? error) && (
                <p className="text-sm text-red-600">{initError ?? error}</p>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter run code (e.g., PLAT01)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength={8}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartRun()}
                  disabled={loading}
                />
                <Button
                  onClick={handleStartRun}
                  disabled={!inputCode.trim() || loading}
                >
                  {loading ? <Spinner className="w-4 h-4" /> : 'Start'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main app — only shown once we have an active run */}
        {runCode && !showJoinDialog && (
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
