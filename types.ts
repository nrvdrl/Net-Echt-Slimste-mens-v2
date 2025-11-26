export interface TermInput {
  id: string;
  term: string;
  userClues: string[]; // Up to 3 user defined clues
}

export interface PuzzleGroup {
  id: string;
  term: string;
  clues: string[];
}

export interface PuzzleData {
  theme: string;
  groups: PuzzleGroup[];
}

export interface Tile {
  id: string;
  text: string;
  groupId: string; // ID of the term it belongs to
  isSolved: boolean;
  isSelected: boolean;
}

export enum AppState {
  SETUP = 'SETUP',
  GENERATING = 'GENERATING',
  REVIEW = 'REVIEW',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}