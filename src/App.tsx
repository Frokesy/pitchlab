import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import AppHeader from './components/AppHeader';
import BoardControls from './components/BoardControls';
import PitchBoard from './components/PitchBoard';
import PlaySidebar from './components/PlaySidebar';
import {
  defaultBoardState,
  decodeBoardState,
  distanceToSegment,
  encodeBoardState,
  loadSavedPlays,
  persistSavedPlays,
  clamp,
  isSameBoardState,
} from './features/board/utils';
import type {
  Arrow,
  BoardState,
  FormationKey,
  Point,
  SavedPlay,
  ToolMode,
} from './features/board/types';
type TeamSide = 'home' | 'away';

const App = () => {
  const initialSharedState = useMemo(() => {
    const shareValue = window.location.hash.startsWith('#play=')
      ? window.location.hash.slice(6)
      : '';
    return shareValue ? decodeBoardState(shareValue) : null;
  }, []);

  const [boardState, setBoardState] = useState<BoardState>(
    initialSharedState ?? defaultBoardState('4-3-3')
  );
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);
  const [playName, setPlayName] = useState('Wing overload');
  const [savedPlays, setSavedPlays] = useState<SavedPlay[]>(() =>
    loadSavedPlays()
  );
  const [shareStatus, setShareStatus] = useState('');
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [historyPast, setHistoryPast] = useState<BoardState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BoardState[]>([]);
  const [placementTeam, setPlacementTeam] = useState<TeamSide>('away');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState('#22FF88');
  const [annotationThickness, setAnnotationThickness] = useState(0.8);
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const boardStateRef = useRef(boardState);
  const dragOriginRef = useRef<BoardState | null>(null);

  useEffect(() => {
    boardStateRef.current = boardState;
  }, [boardState]);

  useEffect(() => {
    if (!shareStatus) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setShareStatus(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  const currentFormation = boardState.formation;
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;
  const selectedPlayer =
    boardState.players.find((player) => player.id === selectedPlayerId) ?? null;

  const activeShareLink = useMemo(() => {
    const encoded = encodeBoardState(boardState);
    return `${window.location.origin}${window.location.pathname}#play=${encoded}`;
  }, [boardState]);

  const commitBoardState = (nextState: BoardState) => {
    const currentState = boardStateRef.current;
    if (isSameBoardState(currentState, nextState)) {
      setPendingPoint(null);
      return;
    }

    setHistoryPast((previous) => [...previous.slice(-49), currentState]);
    setHistoryFuture([]);
    setBoardState(nextState);
    setPendingPoint(null);
  };

  const getRelativePoint = (clientX: number, clientY: number): Point | null => {
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
  };

  useEffect(() => {
    if (!draggingPlayerId) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const point = getRelativePoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      setBoardState((current) => ({
        ...current,
        players: current.players.map((player) =>
          player.id === draggingPlayerId ? { ...player, ...point } : player
        ),
      }));
    };

    const handlePointerUp = () => {
      const dragOrigin = dragOriginRef.current;
      const currentState = boardStateRef.current;

      if (dragOrigin && !isSameBoardState(dragOrigin, currentState)) {
        setHistoryPast((previous) => [...previous.slice(-49), dragOrigin]);
        setHistoryFuture([]);
      }

      dragOriginRef.current = null;
      setDraggingPlayerId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingPlayerId]);

  const handleFormationChange = (formation: FormationKey) => {
    commitBoardState(defaultBoardState(formation));
  };

  const handlePitchPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (toolMode === 'erase') {
      commitBoardState({
        ...boardState,
        arrows: boardState.arrows.filter((arrow) =>
          shouldKeepArrow(point, arrow)
        ),
      });
      return;
    }

    if (toolMode === 'select') {
      setSelectedPlayerId(null);
      setPendingPoint(null);
      return;
    }

    if (!pendingPoint) {
      setPendingPoint(point);
      return;
    }

    const nextArrow = createArrow(
      toolMode,
      pendingPoint,
      point,
      annotationColor,
      annotationThickness
    );
    commitBoardState({
      ...boardState,
      arrows: [...boardState.arrows, nextArrow],
    });
  };

  const handleSavePlay = () => {
    const name = playName.trim();
    if (!name) {
      setShareStatus('Name the play first');
      return;
    }

    const nextPlay: SavedPlay = {
      id: `play-${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      state: boardState,
    };
    const nextPlays = [nextPlay, ...savedPlays].slice(0, 8);
    setSavedPlays(nextPlays);
    persistSavedPlays(nextPlays);
    setShareStatus('Play saved');
  };

  const handleLoadPlay = (play: SavedPlay) => {
    commitBoardState(play.state);
    setPlayName(play.name);
  };

  const handleShare = async () => {
    window.history.replaceState(
      {},
      '',
      `#play=${encodeBoardState(boardState)}`
    );

    try {
      await navigator.clipboard.writeText(activeShareLink);
      setShareStatus('Share link copied');
    } catch {
      setShareStatus('Share link ready in URL');
    }
  };

  const handleUndo = () => {
    if (!canUndo) {
      return;
    }

    const previousState = historyPast[historyPast.length - 1];
    setHistoryPast((previous) => previous.slice(0, -1));
    setHistoryFuture((future) =>
      [boardStateRef.current, ...future].slice(0, 50)
    );
    setBoardState(previousState);
    setPendingPoint(null);
  };

  const handleRedo = () => {
    if (!canRedo) {
      return;
    }

    const [nextState, ...remaining] = historyFuture;
    setHistoryFuture(remaining);
    setHistoryPast((previous) => [
      ...previous.slice(-49),
      boardStateRef.current,
    ]);
    setBoardState(nextState);
    setPendingPoint(null);
  };

  const handleAddPlayer = () => {
    const nextPlayer = createBenchPlayer(placementTeam, boardState.players);
    commitBoardState({
      ...boardState,
      players: [...boardState.players, nextPlayer],
    });
    setSelectedPlayerId(nextPlayer.id);
    setShareStatus(
      placementTeam === 'home' ? 'Home player added' : 'Opponent player added'
    );
  };

  const handleSwitchSelectedPlayerTeam = () => {
    if (!selectedPlayer) {
      return;
    }

    commitBoardState({
      ...boardState,
      players: boardState.players.map((player) =>
        player.id === selectedPlayer.id
          ? { ...player, team: player.team === 'home' ? 'away' : 'home' }
          : player
      ),
    });
    setPlacementTeam(selectedPlayer.team === 'home' ? 'away' : 'home');
  };

  const handleRemoveSelectedPlayer = () => {
    if (!selectedPlayer) {
      return;
    }

    commitBoardState({
      ...boardState,
      players: boardState.players.filter(
        (player) => player.id !== selectedPlayer.id
      ),
    });
    setSelectedPlayerId(null);
    setShareStatus('Player removed');
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:px-6">
        <AppHeader
          boardState={boardState}
          canRedo={canRedo}
          canUndo={canUndo}
          playName={playName}
          shareStatus={shareStatus}
          onRedo={handleRedo}
          onPlayNameChange={setPlayName}
          onSavePlay={handleSavePlay}
          onShare={handleShare}
          onUndo={handleUndo}
        />

        <section className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <BoardControls
            annotationColor={annotationColor}
            annotationThickness={annotationThickness}
            currentFormation={currentFormation}
            placementTeam={placementTeam}
            selectedPlayer={selectedPlayer}
            toolMode={toolMode}
            onAddPlayer={handleAddPlayer}
            onAnnotationColorChange={setAnnotationColor}
            onAnnotationThicknessChange={setAnnotationThickness}
            onFormationChange={handleFormationChange}
            onPlacementTeamChange={setPlacementTeam}
            onRemoveSelectedPlayer={handleRemoveSelectedPlayer}
            onSwitchSelectedPlayerTeam={handleSwitchSelectedPlayerTeam}
            onToolChange={(tool) => {
              setToolMode(tool);
              setPendingPoint(null);
            }}
            onClearArrows={() =>
              commitBoardState({ ...boardState, arrows: [] })
            }
            onResetBoard={() =>
              commitBoardState(defaultBoardState(currentFormation))
            }
          />

          <PitchBoard
            boardState={boardState}
            pendingPoint={pendingPoint}
            pitchRef={pitchRef}
            selectedPlayerId={selectedPlayerId}
            toolMode={toolMode}
            onPitchPointerDown={handlePitchPointerDown}
            onPlayerPointerDown={(playerId, event) => {
              setSelectedPlayerId(playerId);
              if (toolMode !== 'select') {
                event.stopPropagation();
                return;
              }

              event.stopPropagation();
              dragOriginRef.current = boardStateRef.current;
              setDraggingPlayerId(playerId);
            }}
          />

          <PlaySidebar
            activeShareLink={activeShareLink}
            savedPlays={savedPlays}
            shareStatus={shareStatus}
            onLoadPlay={handleLoadPlay}
          />
        </section>
      </div>
    </main>
  );
};

const createBenchPlayer = (team: TeamSide, players: BoardState['players']) => {
  const teamPlayers = players.filter((player) => player.team === team);
  const highestNumber = teamPlayers.reduce(
    (maxNumber, player) => Math.max(maxNumber, player.number),
    0
  );
  const nextIndex = teamPlayers.length + 1;

  return {
    id: `player-${team}-${Date.now()}`,
    label: team === 'home' ? `SUB ${nextIndex}` : `OPP ${nextIndex}`,
    number: highestNumber + 1,
    team,
    x: team === 'home' ? 50 : 50,
    y: team === 'home' ? 68 : 32,
  };
};

const createArrow = (
  toolMode: Extract<ToolMode, 'straight' | 'curve'>,
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
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

const shouldKeepArrow = (point: Point, arrow: Arrow) => {
  const threshold = arrow.type === 'curve' ? 7 : 5;
  const control = arrow.control ?? {
    x: (arrow.start.x + arrow.end.x) / 2,
    y: (arrow.start.y + arrow.end.y) / 2,
  };

  if (arrow.type === 'curve') {
    return (
      distanceToSegment(point, arrow.start, control) > threshold &&
      distanceToSegment(point, control, arrow.end) > threshold
    );
  }

  return distanceToSegment(point, arrow.start, arrow.end) > threshold;
};

export default App;
