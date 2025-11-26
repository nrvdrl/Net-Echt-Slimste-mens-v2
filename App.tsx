import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import PuzzleGame from './components/PuzzleGame';
import ReviewPuzzle from './components/ReviewPuzzle';
import { generatePuzzleData } from './services/geminiService';
import { TermInput, PuzzleData, AppState } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);

  const handleGenerate = async (theme: string, terms: TermInput[]) => {
    setAppState(AppState.GENERATING);
    try {
      const data = await generatePuzzleData(theme, terms);
      setPuzzleData(data);
      setAppState(AppState.REVIEW); // Go to review instead of playing immediately
    } catch (error) {
      console.error(error);
      alert("Er ging iets mis bij het genereren. Controleer je API key en probeer het opnieuw.");
      setAppState(AppState.SETUP);
    }
  };

  const handleConfirmPuzzle = (finalData: PuzzleData) => {
    setPuzzleData(finalData);
    setAppState(AppState.PLAYING);
  };

  const handleReset = () => {
    setAppState(AppState.SETUP);
    setPuzzleData(null);
  };

  return (
    <div className="min-h-screen slimste-red-bg text-white overflow-x-hidden selection:bg-white selection:text-[#900000]">
      <main className="container mx-auto px-4 py-8 md:py-12">
        {appState === AppState.SETUP || appState === AppState.GENERATING ? (
          <div className="animate-fade-in">
            <SetupForm onGenerate={handleGenerate} isGenerating={appState === AppState.GENERATING} />
          </div>
        ) : appState === AppState.REVIEW && puzzleData ? (
          <div className="animate-fade-in">
            <ReviewPuzzle 
              data={puzzleData} 
              onConfirm={handleConfirmPuzzle} 
              onBack={() => setAppState(AppState.SETUP)} 
            />
          </div>
        ) : (
          puzzleData && (
            <div className="animate-fade-in">
                <PuzzleGame data={puzzleData} onReset={handleReset} />
            </div>
          )
        )}
      </main>
      
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}