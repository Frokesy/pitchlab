import type { FormationKey, Player, ToolMode } from './types';

export const STORAGE_KEY = 'pitchlab.mvp.saved-plays';

export const formationTemplates: Record<FormationKey, Omit<Player, 'id'>[]> = {
  '4-3-3': [
    { label: 'GK', number: 1, x: 50, y: 94, team: 'home' },
    { label: 'LB', number: 3, x: 18, y: 78, team: 'home' },
    { label: 'LCB', number: 4, x: 38, y: 81, team: 'home' },
    { label: 'RCB', number: 5, x: 62, y: 81, team: 'home' },
    { label: 'RB', number: 2, x: 82, y: 78, team: 'home' },
    { label: 'LCM', number: 8, x: 31, y: 58, team: 'home' },
    { label: 'CM', number: 6, x: 50, y: 52, team: 'home' },
    { label: 'RCM', number: 10, x: 69, y: 58, team: 'home' },
    { label: 'LW', number: 11, x: 20, y: 24, team: 'home' },
    { label: 'ST', number: 9, x: 50, y: 14, team: 'home' },
    { label: 'RW', number: 7, x: 80, y: 24, team: 'home' },
  ],
  '4-2-3-1': [
    { label: 'GK', number: 1, x: 50, y: 94, team: 'home' },
    { label: 'LB', number: 3, x: 18, y: 78, team: 'home' },
    { label: 'LCB', number: 4, x: 38, y: 81, team: 'home' },
    { label: 'RCB', number: 5, x: 62, y: 81, team: 'home' },
    { label: 'RB', number: 2, x: 82, y: 78, team: 'home' },
    { label: 'LDM', number: 6, x: 40, y: 61, team: 'home' },
    { label: 'RDM', number: 8, x: 60, y: 61, team: 'home' },
    { label: 'LAM', number: 11, x: 23, y: 38, team: 'home' },
    { label: 'CAM', number: 10, x: 50, y: 33, team: 'home' },
    { label: 'RAM', number: 7, x: 77, y: 38, team: 'home' },
    { label: 'ST', number: 9, x: 50, y: 15, team: 'home' },
  ],
  '4-4-2': [
    { label: 'GK', number: 1, x: 50, y: 94, team: 'home' },
    { label: 'LB', number: 3, x: 18, y: 78, team: 'home' },
    { label: 'LCB', number: 4, x: 38, y: 81, team: 'home' },
    { label: 'RCB', number: 5, x: 62, y: 81, team: 'home' },
    { label: 'RB', number: 2, x: 82, y: 78, team: 'home' },
    { label: 'LM', number: 11, x: 16, y: 54, team: 'home' },
    { label: 'LCM', number: 6, x: 39, y: 57, team: 'home' },
    { label: 'RCM', number: 8, x: 61, y: 57, team: 'home' },
    { label: 'RM', number: 7, x: 84, y: 54, team: 'home' },
    { label: 'LS', number: 10, x: 41, y: 19, team: 'home' },
    { label: 'RS', number: 9, x: 59, y: 19, team: 'home' },
  ],
};

export const toolOptions: Array<{ value: ToolMode; label: string; description: string }> = [
  {
    value: 'select',
    label: 'Move',
    description: 'Drag players directly on the pitch to adjust shape and spacing.',
  },
  {
    value: 'straight',
    label: 'Straight',
    description: 'Click a start point, then click an end point to place a passing or run arrow.',
  },
  {
    value: 'curve',
    label: 'Curve',
    description: 'Click twice to place a curved movement line for overlaps or third-man runs.',
  },
  {
    value: 'erase',
    label: 'Erase',
    description: 'Click near an arrow to remove it from the board.',
  },
];

export const annotationColorOptions = [
  { value: '#22FF88', label: 'Run', hint: 'Primary movements' },
  { value: '#3DA9FC', label: 'Pass', hint: 'Passing patterns' },
  { value: '#FFB020', label: 'Press', hint: 'Pressing cues' },
  { value: '#FF6B6B', label: 'Alert', hint: 'Critical triggers' },
] as const;

export const annotationThicknessOptions = [
  { value: 0.5, label: 'Thin' },
  { value: 0.8, label: 'Medium' },
  { value: 1.15, label: 'Bold' },
] as const;
