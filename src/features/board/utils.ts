import { STORAGE_KEY, formationTemplates } from './data';
import type {
  BoardState,
  FormationKey,
  Point,
  SavedPlay,
  TeamSide,
} from './types';

const WORKSPACE_STORAGE_KEY = 'pitchlab.mvp.workspace';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const createPlayersFromFormation = (formation: FormationKey) =>
  formationTemplates[formation].map((player, index) => ({
    ...player,
    id: `player-${formation}-${index + 1}`,
  }));

export const defaultBoardState = (formation: FormationKey): BoardState => ({
  formation,
  players: createPlayersFromFormation(formation),
  arrows: [],
});

export const encodeBoardState = (state: BoardState) => {
  const json = JSON.stringify(state);
  return window.btoa(encodeURIComponent(json));
};

export const decodeBoardState = (value: string): BoardState | null => {
  try {
    const json = decodeURIComponent(window.atob(value));
    const parsed = JSON.parse(json) as BoardState;
    if (!parsed || !Array.isArray(parsed.players) || !Array.isArray(parsed.arrows)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const loadSavedPlays = (): SavedPlay[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedPlay[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistSavedPlays = (plays: SavedPlay[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
};

type PersistedWorkspace = {
  activePlayId: string | null;
  annotationColor: string;
  annotationThickness: number;
  boardState: BoardState;
  placementTeam: TeamSide;
  playName: string;
};

export const loadWorkspaceState = (): PersistedWorkspace | null => {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedWorkspace;
    if (
      !parsed ||
      typeof parsed.playName !== 'string' ||
      typeof parsed.annotationColor !== 'string' ||
      typeof parsed.annotationThickness !== 'number' ||
      (parsed.placementTeam !== 'home' && parsed.placementTeam !== 'away')
    ) {
      return null;
    }

    if (
      !parsed.boardState ||
      !Array.isArray(parsed.boardState.players) ||
      !Array.isArray(parsed.boardState.arrows)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const persistWorkspaceState = (workspace: PersistedWorkspace) => {
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
};

export const distanceToSegment = (point: Point, start: Point, end: Point) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1,
  );
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
};

export const isSameBoardState = (left: BoardState, right: BoardState) =>
  JSON.stringify(left) === JSON.stringify(right);
