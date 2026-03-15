export type ToolMode = 'select' | 'straight' | 'curve' | 'erase';
export type FormationKey = '4-3-3' | '4-2-3-1' | '4-4-2';
export type TeamSide = 'home' | 'away';

export type Player = {
  id: string;
  label: string;
  number: number;
  x: number;
  y: number;
  team: TeamSide;
};

export type Point = {
  x: number;
  y: number;
};

export type Arrow = {
  id: string;
  type: 'straight' | 'curve';
  color: string;
  strokeWidth?: number;
  start: Point;
  end: Point;
  control?: Point;
};

export type BoardState = {
  formation: FormationKey;
  players: Player[];
  arrows: Arrow[];
};

export type SavedPlay = {
  id: string;
  name: string;
  savedAt: string;
  state: BoardState;
};
