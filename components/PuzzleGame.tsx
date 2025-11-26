import React, { useState, useEffect, useRef } from 'react';
import { PuzzleData, Tile } from '../types';
import { RefreshCw, Trophy, Download, Maximize, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

interface PuzzleGameProps {
  data: PuzzleData;
  onReset: () => void;
}

const ERROR_SOUND_URL = "https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3";

const PuzzleGame: React.FC<PuzzleGameProps> = ({ data, onReset }) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<string[]>([]);
  const [mistakeAnimation, setMistakeAnimation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const puzzleRef = useRef<HTMLDivElement>(null);
  
  // Initialize tiles
  useEffect(() => {
    const newTiles: Tile[] = [];
    data.groups.forEach(group => {
      group.clues.forEach((clue, index) => {
        newTiles.push({
          id: `${group.id}-${index}`,
          text: clue,
          groupId: group.id,
          isSolved: false,
          isSelected: false
        });
      });
    });
    setTiles(shuffleArray(newTiles));
  }, [data]);

  // Sync state with browser fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const shuffleArray = (array: Tile[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const playErrorSound = () => {
    const audio = new Audio(ERROR_SOUND_URL);
    audio.volume = 1.0;
    audio.play().catch(e => console.error("Audio play failed", e));
  };

  const handleTileClick = (tileId: string) => {
    if (isChecking) return;

    const clickedTile = tiles.find(t => t.id === tileId);
    if (!clickedTile || clickedTile.isSolved) return;

    // Toggle selection
    const newTiles = tiles.map(t => 
      t.id === tileId ? { ...t, isSelected: !t.isSelected } : t
    );

    const selectedTiles = newTiles.filter(t => t.isSelected && !t.isSolved);

    if (selectedTiles.length === 3) {
      setTiles(newTiles);
      setIsChecking(true);

      const firstGroupId = selectedTiles[0].groupId;
      const isMatch = selectedTiles.every(t => t.groupId === firstGroupId);

      if (isMatch) {
        // Small delay so user sees the 3rd tile light up before it locks in
        setTimeout(() => {
            handleMatch(newTiles, firstGroupId);
            setIsChecking(false);
        }, 200);
      } else {
        // Mistake made - Wait 500ms then play sound and animate
        setTimeout(() => {
            playErrorSound();
            setMistakeAnimation(true);
            
            // Wait for animation to finish then reset
            setTimeout(() => {
                setTiles(prev => prev.map(t => ({ ...t, isSelected: false })));
                setMistakeAnimation(false);
                setIsChecking(false);
            }, 500);
        }, 500);
      }
    } else {
      setTiles(newTiles);
    }
  };

  const handleMatch = (currentTiles: Tile[], groupId: string) => {
    const updatedTiles = currentTiles.map(t => 
      t.groupId === groupId ? { ...t, isSolved: true, isSelected: false } : t
    );
    
    setTiles(updatedTiles);
    setSolvedGroups(prev => [...prev, groupId]);
    
    const allSolved = updatedTiles.every(t => t.isSolved);
    if (allSolved) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#ff0000'] 
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const downloadPuzzle = async () => {
    if (!puzzleRef.current) return;

    try {
      const canvas = await html2canvas(puzzleRef.current, {
        backgroundColor: '#990000', // Match the red theme background
        scale: 2, // Improve quality
        onclone: (clonedDoc) => {
          // Find the hidden answer container in the CLONED document and make it visible
          const hiddenAnswers = clonedDoc.getElementById('hidden-answers-key');
          if (hiddenAnswers) {
            hiddenAnswers.style.display = 'block';
          }
        }
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `puzzel-${(data.theme || 'slimste').replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Screenshot failed", error);
    }
  };

  const isGameFinished = solvedGroups.length === data.groups.length;

  return (
    <div className={`w-full mx-auto flex flex-col items-center transition-all duration-300 ${isFullscreen ? 'justify-center h-screen' : 'justify-start min-h-[80vh] max-w-5xl px-4'}`}>
      
      {/* Toolbar - Hidden in Fullscreen */}
      {!isFullscreen && (
        <div className="w-full flex justify-end gap-2 mb-4">
          <button 
            onClick={downloadPuzzle}
            className="flex items-center gap-2 px-3 py-2 bg-[#600000] hover:bg-[#700000] text-red-100 rounded text-sm transition-colors border border-[#800000]"
            title="Download Puzzel (PNG)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download (PNG)</span>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-[#600000] hover:bg-[#700000] text-red-100 rounded text-sm transition-colors border border-[#800000]"
            title="Presentatiemodus"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Presentatie</span>
          </button>
        </div>
      )}

      {/* Floating Exit Button for Fullscreen */}
      {isFullscreen && (
        <button 
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white/50 hover:text-white rounded-full transition-all z-50 backdrop-blur-sm"
          title="Sluit Presentatiemodus"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Printable Area Wrapper */}
      <div 
        ref={puzzleRef} 
        className={`w-full flex flex-col items-center ${!isFullscreen ? 'p-4 rounded-lg' : 'p-0'}`}
        // We ensure the background is set here too for the screenshot to pick it up cleanly if 'backgroundColor' option in html2canvas isn't enough for some reason, though the option usually handles it.
        style={{ backgroundColor: '#990000', backgroundImage: 'radial-gradient(circle at center, #b30000 0%, #800000 100%)' }}
      >
        {/* Header Info */}
        <div className={`text-center ${isFullscreen ? 'mb-12 scale-110 pt-12' : 'mb-8 pt-4'}`}>
            <h1 className="text-4xl md:text-5xl font-normal text-white drop-shadow-md">
            Welke 4 begrippen zoeken we?
            </h1>
            {data.theme && (
            <p className="text-red-200 mt-2 text-lg uppercase tracking-widest opacity-80">{data.theme}</p>
            )}
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-1 relative ${isFullscreen ? 'w-full max-w-6xl px-8' : 'w-full'} ${mistakeAnimation ? 'animate-shake' : ''}`}>
            <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            {tiles.map(tile => {
                let bgColor = "bg-[#600000]"; // Dark red base color
                let textColor = "text-white";
                let borderColor = "border-transparent";

                if (tile.isSolved) {
                    bgColor = "bg-green-700";
                    borderColor = "border-green-600";
                    textColor = "text-white opacity-50"; 
                } else if (tile.isSelected) {
                    bgColor = "bg-white"; // High contrast selection
                    textColor = "text-[#800000]";
                    borderColor = "border-white";
                }

                // In presentation mode, scale text up slightly
                const textSizeClass = isFullscreen ? 'text-2xl md:text-3xl' : 'text-lg md:text-2xl';
                const heightClass = isFullscreen ? 'min-h-[140px]' : 'min-h-[100px] md:min-h-[120px]';

                return (
                    <button
                        key={tile.id}
                        onClick={() => handleTileClick(tile.id)}
                        disabled={tile.isSolved || isGameFinished}
                        className={`
                            ${heightClass} p-4 flex items-center justify-center text-center 
                            transition-all duration-150
                            shadow-md
                            ${bgColor} ${textColor} ${borderColor}
                            ${!tile.isSolved && !tile.isSelected ? 'hover:bg-[#700000]' : ''}
                            ${tile.isSolved ? 'cursor-default' : 'cursor-pointer'}
                        `}
                    >
                        <span className={`${textSizeClass} font-normal leading-tight select-none`}>
                            {tile.text}
                        </span>
                    </button>
                );
            })}
        </div>

        {/* Solutions found (Interactive game UI) */}
        <div className={`mt-8 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 ${isFullscreen ? 'w-full max-w-6xl px-8' : 'w-full'}`}>
            {data.groups.map(group => {
                const isSolved = solvedGroups.includes(group.id);
                return (
                    <div 
                        key={group.id} 
                        className={`
                            p-4 text-center transition-all duration-500 border
                            ${isSolved 
                                ? 'bg-green-900 border-green-700 text-white' 
                                : 'bg-[#500000] border-[#600000] text-[#800000]'}
                        `}
                    >
                        <span className="font-bold text-lg uppercase block">
                            {isSolved ? group.term : '???'}
                        </span>
                    </div>
                )
            })}
        </div>

        {/* HIDDEN ANSWER KEY - ONLY VISIBLE IN PNG DOWNLOAD */}
        <div id="hidden-answers-key" className="hidden w-full mt-8 pt-6 border-t border-red-800/50 pb-4 px-8">
           <h3 className="text-center text-white/40 uppercase tracking-widest text-sm mb-6">Antwoordmodel</h3>
           <div className="grid grid-cols-4 gap-4">
              {data.groups.map(group => (
                 <div key={group.id} className="bg-black/20 p-4 rounded border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="font-bold text-xl text-white uppercase mb-1">{group.term}</span>
                    <span className="text-xs text-red-200">{group.clues.join(" • ")}</span>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* Game Over Actions */}
      {isGameFinished && (
        <div className="mt-12 animate-fade-in-up">
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                    <Trophy className="w-8 h-8" />
                    <span className="text-2xl font-bold uppercase">Puzzel Compleet!</span>
                </div>
                
                {!isFullscreen && (
                    <button 
                        onClick={onReset}
                        className="flex items-center gap-2 bg-white text-[#900000] hover:bg-gray-100 px-8 py-3 rounded font-bold uppercase tracking-wider transition-colors shadow-lg"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Nieuwe Puzzel
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleGame;