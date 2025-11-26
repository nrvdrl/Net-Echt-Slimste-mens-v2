import React, { useState } from 'react';
import { PuzzleData } from '../types';
import { Play, ArrowLeft, Pencil } from 'lucide-react';

interface ReviewPuzzleProps {
  data: PuzzleData;
  onConfirm: (finalData: PuzzleData) => void;
  onBack: () => void;
}

const ReviewPuzzle: React.FC<ReviewPuzzleProps> = ({ data, onConfirm, onBack }) => {
  const [editableData, setEditableData] = useState<PuzzleData>(data);

  const handleThemeChange = (val: string) => {
    setEditableData(prev => ({ ...prev, theme: val }));
  };

  const handleTermChange = (groupIndex: number, val: string) => {
    const newGroups = [...editableData.groups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], term: val };
    setEditableData(prev => ({ ...prev, groups: newGroups }));
  };

  const handleClueChange = (groupIndex: number, clueIndex: number, val: string) => {
    const newGroups = [...editableData.groups];
    const newClues = [...newGroups[groupIndex].clues];
    newClues[clueIndex] = val;
    newGroups[groupIndex] = { ...newGroups[groupIndex], clues: newClues };
    setEditableData(prev => ({ ...prev, groups: newGroups }));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-[#600000] border border-[#700000] rounded shadow-2xl">
      <div className="mb-6 flex justify-between items-center border-b border-[#800000] pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Controleer Puzzel</h2>
          <p className="text-red-200 text-sm">Pas de omschrijvingen aan waar nodig voordat je start.</p>
        </div>
        <button 
          onClick={onBack}
          className="text-red-300 hover:text-white flex items-center gap-2 text-sm uppercase font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
      </div>

      <div className="space-y-6">
        {/* Theme Input */}
        <div>
          <label className="block text-xs font-bold text-red-200 uppercase mb-1">Thema</label>
          <input
            type="text"
            value={editableData.theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full bg-[#4a0000] border-[#5a0000] text-white text-lg rounded px-4 py-2 focus:ring-2 focus:ring-white/20 outline-none"
          />
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {editableData.groups.map((group, groupIndex) => (
            <div key={group.id} className="bg-[#500000] p-4 rounded border border-[#600000]">
              <div className="mb-4">
                <label className="block text-xs font-bold text-red-300 uppercase mb-1">Begrip {groupIndex + 1}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={group.term}
                    onChange={(e) => handleTermChange(groupIndex, e.target.value)}
                    className="w-full bg-[#400000] border border-[#5a0000] text-white font-bold rounded px-3 py-2 pr-8 focus:ring-1 focus:ring-white/20 outline-none"
                  />
                  <Pencil className="w-4 h-4 text-red-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-red-300 uppercase">Omschrijvingen</label>
                {group.clues.map((clue, clueIndex) => (
                  <input
                    key={clueIndex}
                    type="text"
                    value={clue}
                    onChange={(e) => handleClueChange(groupIndex, clueIndex, e.target.value)}
                    className="w-full bg-[#4a0000] border-b border-[#600000] text-red-100 text-sm px-2 py-2 focus:bg-[#5a0000] focus:border-red-400 outline-none transition-colors"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[#800000] flex justify-end">
        <button
          onClick={() => onConfirm(editableData)}
          className="bg-white text-[#900000] hover:bg-gray-100 px-8 py-3 rounded font-bold text-xl uppercase tracking-widest flex items-center gap-3 transition-transform transform hover:scale-[1.02] shadow-xl"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Spel
        </button>
      </div>
    </div>
  );
};

export default ReviewPuzzle;