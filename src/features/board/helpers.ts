import { distanceToSegment } from './utils';
import type { Arrow, BoardState, Point, TeamSide, ToolMode } from './types';

export const createBenchPlayer = (
  team: TeamSide,
  players: BoardState['players'],
) => {
  const teamPlayers = players.filter((player) => player.team === team);
  const highestNumber = teamPlayers.reduce(
    (maxNumber, player) => Math.max(maxNumber, player.number),
    0,
  );
  const nextIndex = teamPlayers.length + 1;

  return {
    id: `player-${team}-${Date.now()}`,
    label: team === 'home' ? `SUB ${nextIndex}` : `OPP ${nextIndex}`,
    number: highestNumber + 1,
    team,
    x: 50,
    y: team === 'home' ? 74 : 26,
  };
};

export const createArrow = (
  toolMode: Extract<ToolMode, 'straight' | 'curve'>,
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number,
): Arrow => {
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  return {
    id: `arrow-${Date.now()}`,
    type: toolMode,
    color,
    strokeWidth,
    start,
    end,
    control:
      toolMode === 'curve'
        ? {
            x: midPoint.x,
            y: midPoint.y - Math.max(10, Math.abs(end.x - start.x) * 0.18),
          }
        : undefined,
  };
};

export const findArrowToRemove = (point: Point, arrows: Arrow[]): Arrow | null => {
  let closestArrow: Arrow | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  arrows.forEach((arrow) => {
    const threshold = arrow.type === 'curve' ? 7 : 5;
    const control = arrow.control ?? {
      x: (arrow.start.x + arrow.end.x) / 2,
      y: (arrow.start.y + arrow.end.y) / 2,
    };

    const distance =
      arrow.type === 'curve'
        ? Math.min(
            distanceToSegment(point, arrow.start, control),
            distanceToSegment(point, control, arrow.end),
          )
        : distanceToSegment(point, arrow.start, arrow.end);

    if (distance <= threshold && distance < closestDistance) {
      closestArrow = arrow;
      closestDistance = distance;
    }
  });

  return closestArrow;
};
