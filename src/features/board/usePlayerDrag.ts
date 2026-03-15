import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from 'react';

import { clamp, isSameBoardState } from './utils';
import type { BoardState, Point } from './types';

const PLAYER_DRAG_THRESHOLD = 6;

type UsePlayerDragOptions = {
  pitchRef: RefObject<HTMLDivElement | null>;
  boardStateRef: RefObject<BoardState>;
  setBoardState: Dispatch<SetStateAction<BoardState>>;
  onDragCommit: (originState: BoardState, nextState: BoardState) => void;
};

export const usePlayerDrag = ({
  pitchRef,
  boardStateRef,
  setBoardState,
  onDragCommit,
}: UsePlayerDragOptions) => {
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const dragOriginRef = useRef<BoardState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartClientRef = useRef<Point | null>(null);
  const didDragPlayerRef = useRef(false);

  const getRelativePoint = useCallback((clientX: number, clientY: number): Point | null => {
    const element = pitchRef.current;
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: clamp(x, 4, 96),
      y: clamp(y, 4, 96),
    };
  }, [pitchRef]);

  const resetDragState = () => {
    dragOriginRef.current = null;
    dragPointerIdRef.current = null;
    dragStartClientRef.current = null;
    didDragPlayerRef.current = false;
    setDraggingPlayerId(null);
  };

  useEffect(() => {
    if (!draggingPlayerId) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (
        dragPointerIdRef.current !== null &&
        event.pointerId !== dragPointerIdRef.current
      ) {
        return;
      }

      const point = getRelativePoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      const dragStartClient = dragStartClientRef.current;
      if (dragStartClient && !didDragPlayerRef.current) {
        const distance = Math.hypot(
          event.clientX - dragStartClient.x,
          event.clientY - dragStartClient.y,
        );

        if (distance < PLAYER_DRAG_THRESHOLD) {
          return;
        }

        didDragPlayerRef.current = true;
      }

      setBoardState((current) => ({
        ...current,
        players: current.players.map((player) =>
          player.id === draggingPlayerId ? { ...player, ...point } : player,
        ),
      }));
    };

    const handlePointerUp = () => {
      const dragOrigin = dragOriginRef.current;
      const currentState = boardStateRef.current;

      if (
        didDragPlayerRef.current &&
        dragOrigin &&
        !isSameBoardState(dragOrigin, currentState)
      ) {
        onDragCommit(dragOrigin, currentState);
      }

      resetDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [boardStateRef, draggingPlayerId, getRelativePoint, onDragCommit, setBoardState]);

  const startPlayerDrag = (
    playerId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    dragOriginRef.current = boardStateRef.current;
    dragPointerIdRef.current = event.pointerId;
    dragStartClientRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    didDragPlayerRef.current = false;
    setDraggingPlayerId(playerId);
  };

  return {
    getRelativePoint,
    resetDragState,
    startPlayerDrag,
  };
};
