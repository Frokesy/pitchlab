import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
  loadWorkspaceState,
  persistSavedPlays,
  persistWorkspaceState,
  clamp,
  isSameBoardState,
} from './features/board/utils';
import type {
  Arrow,
  BoardState,
  FormationKey,
  Point,
  SavedPlay,
  TeamSide,
  ToolMode,
} from './features/board/types';

const PLAYER_DRAG_THRESHOLD = 6;
const SHARED_PLAY_HASH_PREFIX = '#play=';
const DEFAULT_PLAY_NAME = 'Wing overload';
const EMPTY_PLAY_NAME = 'Untitled play';

const App = () => {
  const initialSavedPlays = loadSavedPlays();
  const initialWorkspaceState = loadWorkspaceState();
  const initialHash = window.location.hash;
  const initialSharedState = useMemo(() => {
    const shareValue = initialHash.startsWith(SHARED_PLAY_HASH_PREFIX)
      ? initialHash.slice(SHARED_PLAY_HASH_PREFIX.length)
      : '';
    return shareValue ? decodeBoardState(shareValue) : null;
  }, [initialHash]);
  const hadInvalidSharedState =
    initialHash.startsWith(SHARED_PLAY_HASH_PREFIX) && !initialSharedState;
  const initialActivePlayId =
    initialWorkspaceState?.activePlayId &&
    initialSavedPlays.some((play) => play.id === initialWorkspaceState.activePlayId)
      ? initialWorkspaceState.activePlayId
      : null;
  const initialBoardState =
    initialSharedState ??
    initialWorkspaceState?.boardState ??
    defaultBoardState('4-3-3');

  const [boardState, setBoardState] = useState<BoardState>(initialBoardState);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);
  const [playName, setPlayName] = useState(
    initialSharedState
      ? 'Shared board'
      : initialWorkspaceState?.playName || DEFAULT_PLAY_NAME
  );
  const [savedPlays, setSavedPlays] = useState<SavedPlay[]>(initialSavedPlays);
  const [shareStatus, setShareStatus] = useState(
    hadInvalidSharedState ? 'Shared link was invalid' : ''
  );
  const [activePlayId, setActivePlayId] = useState<string | null>(initialActivePlayId);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [historyPast, setHistoryPast] = useState<BoardState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BoardState[]>([]);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [placementTeam, setPlacementTeam] = useState<TeamSide>(
    initialWorkspaceState?.placementTeam ?? 'away'
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState(
    initialWorkspaceState?.annotationColor ?? '#22FF88'
  );
  const [annotationThickness, setAnnotationThickness] = useState(
    initialWorkspaceState?.annotationThickness ?? 0.8
  );
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const boardStateRef = useRef(boardState);
  const dragOriginRef = useRef<BoardState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartClientRef = useRef<Point | null>(null);
  const didDragPlayerRef = useRef(false);

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

  useEffect(() => {
    persistWorkspaceState({
      activePlayId,
      annotationColor,
      annotationThickness,
      boardState,
      placementTeam,
      playName,
    });
  }, [
    activePlayId,
    annotationColor,
    annotationThickness,
    boardState,
    placementTeam,
    playName,
  ]);

  const currentFormation = boardState.formation;
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;
  const activePlay =
    savedPlays.find((play) => play.id === activePlayId) ?? null;
  const isActivePlayDirty = activePlay
    ? activePlay.name !== playName || !isSameBoardState(activePlay.state, boardState)
    : false;
  const saveLabel = activePlayId
    ? isActivePlayDirty
      ? 'Update play'
      : 'Saved'
    : 'Save play';
  const selectedPlayer =
    boardState.players.find((player) => player.id === selectedPlayerId) ?? null;

  const activeShareLink = useMemo(() => {
    const encoded = encodeBoardState(boardState);
    return `${window.location.origin}${window.location.pathname}${window.location.search}${SHARED_PLAY_HASH_PREFIX}${encoded}`;
  }, [boardState]);

  const clearSharedHash = () => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}`
    );
  };

  const applyExternalBoardState = (
    nextState: BoardState,
    options?: {
      playId?: string | null;
      playName?: string;
      status?: string;
    }
  ) => {
    setBoardState(nextState);
    setPendingPoint(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setDraggingPlayerId(null);
    setIsMobileControlsOpen(false);
    setSelectedPlayerId(null);
    dragOriginRef.current = null;
    dragPointerIdRef.current = null;
    dragStartClientRef.current = null;
    didDragPlayerRef.current = false;

    if (options?.playName) {
      setPlayName(options.playName);
    }

    setActivePlayId(options?.playId ?? null);

    if (options?.status) {
      setShareStatus(options.status);
    }
  };

  useEffect(() => {
    if (!hadInvalidSharedState) {
      return;
    }

    clearSharedHash();
  }, [hadInvalidSharedState]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith(SHARED_PLAY_HASH_PREFIX)) {
        return;
      }

      const decodedState = decodeBoardState(
        hash.slice(SHARED_PLAY_HASH_PREFIX.length)
      );

      if (!decodedState) {
        clearSharedHash();
        setShareStatus('Shared link was invalid');
        return;
      }

      applyExternalBoardState(decodedState, {
        playName: 'Shared board',
        status: 'Shared board loaded',
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
          event.clientY - dragStartClient.y
        );

        if (distance < PLAYER_DRAG_THRESHOLD) {
          return;
        }

        didDragPlayerRef.current = true;
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

      if (
        didDragPlayerRef.current &&
        dragOrigin &&
        !isSameBoardState(dragOrigin, currentState)
      ) {
        setHistoryPast((previous) => [...previous.slice(-49), dragOrigin]);
        setHistoryFuture([]);
      }

      dragOriginRef.current = null;
      dragPointerIdRef.current = null;
      dragStartClientRef.current = null;
      didDragPlayerRef.current = false;
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
      const arrowToRemove = findArrowToRemove(point, boardState.arrows);
      if (!arrowToRemove) {
        return;
      }
      const arrowToRemoveId = arrowToRemove.id;

      commitBoardState({
        ...boardState,
        arrows: boardState.arrows.filter((arrow) => arrow.id !== arrowToRemoveId),
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
    return persistCurrentPlay();
  };

  const persistCurrentPlay = () => {
    const name = playName.trim();
    if (!name) {
      setShareStatus('Name the play first');
      return null;
    }

    const playId = activePlayId ?? `play-${Date.now()}`;
    const nextPlay: SavedPlay = {
      id: playId,
      name,
      savedAt: new Date().toISOString(),
      state: boardState,
    };
    const filteredPlays = savedPlays.filter((play) => play.id !== playId);
    const nextPlays = [nextPlay, ...filteredPlays].slice(0, 8);
    setSavedPlays(nextPlays);
    persistSavedPlays(nextPlays);
    setActivePlayId(playId);
    setShareStatus(activePlayId ? 'Play updated' : 'Play saved');
    return playId;
  };

  const handleLoadPlay = (play: SavedPlay) => {
    applyExternalBoardState(play.state, {
      playId: play.id,
      playName: play.name,
      status: 'Play loaded',
    });
  };

  const handleDeletePlay = (play: SavedPlay) => {
    const nextPlays = savedPlays.filter((entry) => entry.id !== play.id);
    setSavedPlays(nextPlays);
    persistSavedPlays(nextPlays);

    if (activePlayId === play.id) {
      setActivePlayId(null);
      setShareStatus('Play deleted. Current board kept as draft');
      return;
    }

    setShareStatus('Play deleted');
  };

  const handleShare = async () => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}${SHARED_PLAY_HASH_PREFIX}${encodeBoardState(boardState)}`
    );

    try {
      await navigator.clipboard.writeText(activeShareLink);
      setShareStatus('Share link copied');
    } catch {
      setShareStatus('Share link ready in URL');
    }
  };

  const handleSaveAndNewBoard = () => {
    const savedPlayId = persistCurrentPlay();
    if (!savedPlayId) {
      return;
    }

    applyExternalBoardState(defaultBoardState(currentFormation), {
      playId: null,
      playName: EMPTY_PLAY_NAME,
      status: 'Saved. New board ready',
    });
    clearSharedHash();
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
    setSelectedPlayerId(null);
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
    setSelectedPlayerId(null);
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

  const closeMobileControls = () => {
    setIsMobileControlsOpen(false);
  };

  const handleToolChange = (tool: ToolMode) => {
    setToolMode(tool);
    setPendingPoint(null);
    closeMobileControls();
  };

  const handlePlacementTeamChange = (team: TeamSide) => {
    setPlacementTeam(team);
    closeMobileControls();
  };

  const handleAnnotationColorChange = (color: string) => {
    setAnnotationColor(color);
    closeMobileControls();
  };

  const handleAnnotationThicknessChange = (thickness: number) => {
    setAnnotationThickness(thickness);
    closeMobileControls();
  };

  const handleFormationSelect = (formation: FormationKey) => {
    handleFormationChange(formation);
    closeMobileControls();
  };

  const handleClearArrows = () => {
    commitBoardState({ ...boardState, arrows: [] });
    closeMobileControls();
  };

  const handleResetBoard = () => {
    commitBoardState(defaultBoardState(currentFormation));
    closeMobileControls();
  };

  const handleAddPlayerFromControls = () => {
    handleAddPlayer();
    closeMobileControls();
  };

  const handleSwitchSelectedPlayerTeamFromControls = () => {
    handleSwitchSelectedPlayerTeam();
    closeMobileControls();
  };

  const handleRemoveSelectedPlayerFromControls = () => {
    handleRemoveSelectedPlayer();
    closeMobileControls();
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:px-6">
        <AppHeader
          boardState={boardState}
          canRedo={canRedo}
          canUndo={canUndo}
          playName={playName}
          saveLabel={saveLabel}
          shareStatus={shareStatus}
          onRedo={handleRedo}
          onPlayNameChange={setPlayName}
          onSaveAndNewBoard={handleSaveAndNewBoard}
          onSavePlay={handleSavePlay}
          onShare={handleShare}
          onUndo={handleUndo}
        />

        <section className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <div className="order-2 hidden md:block xl:order-1">
            <BoardControls
              annotationColor={annotationColor}
              annotationThickness={annotationThickness}
              currentFormation={currentFormation}
              placementTeam={placementTeam}
              selectedPlayer={selectedPlayer}
              toolMode={toolMode}
              onAddPlayer={handleAddPlayerFromControls}
              onAnnotationColorChange={handleAnnotationColorChange}
              onAnnotationThicknessChange={handleAnnotationThicknessChange}
              onFormationChange={handleFormationSelect}
              onPlacementTeamChange={handlePlacementTeamChange}
              onRemoveSelectedPlayer={handleRemoveSelectedPlayerFromControls}
              onSwitchSelectedPlayerTeam={handleSwitchSelectedPlayerTeamFromControls}
              onToolChange={handleToolChange}
              onClearArrows={handleClearArrows}
              onResetBoard={handleResetBoard}
            />
          </div>

          <div className="order-1 relative xl:order-2">
            <button
              className="pitchlab-mobile-toggle md:hidden"
              onClick={() => setIsMobileControlsOpen((open) => !open)}
              aria-expanded={isMobileControlsOpen}
              aria-label={isMobileControlsOpen ? 'Close controls' : 'Open controls'}
            >
              <span className="pitchlab-mobile-toggle__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="pitchlab-mobile-toggle__label">
                {isMobileControlsOpen ? 'Close' : 'Controls'}
              </span>
            </button>

            <AnimatePresence>
              {isMobileControlsOpen ? (
                <>
                  <motion.button
                    key="mobile-controls-backdrop"
                    className="pitchlab-mobile-backdrop md:hidden"
                    aria-label="Close controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={closeMobileControls}
                  />
                  <motion.div
                    key="mobile-controls-drawer"
                    className="pitchlab-mobile-drawer md:hidden"
                    initial={{ opacity: 0, y: -18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.985 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <BoardControls
                      annotationColor={annotationColor}
                      annotationThickness={annotationThickness}
                      className="pitchlab-mobile-drawer__panel"
                      currentFormation={currentFormation}
                      placementTeam={placementTeam}
                      selectedPlayer={selectedPlayer}
                      toolMode={toolMode}
                      onAddPlayer={handleAddPlayerFromControls}
                      onAnnotationColorChange={handleAnnotationColorChange}
                      onAnnotationThicknessChange={handleAnnotationThicknessChange}
                      onFormationChange={handleFormationSelect}
                      onPlacementTeamChange={handlePlacementTeamChange}
                      onRemoveSelectedPlayer={handleRemoveSelectedPlayerFromControls}
                      onSwitchSelectedPlayerTeam={handleSwitchSelectedPlayerTeamFromControls}
                      onToolChange={handleToolChange}
                      onClearArrows={handleClearArrows}
                      onResetBoard={handleResetBoard}
                    />
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>

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
                dragPointerIdRef.current = event.pointerId;
                dragStartClientRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                };
                didDragPlayerRef.current = false;
                setDraggingPlayerId(playerId);
              }}
            />
          </div>

          <div className="order-3 xl:order-3">
            <PlaySidebar
              activePlayId={activePlayId}
              activeShareLink={activeShareLink}
              savedPlays={savedPlays}
              shareStatus={shareStatus}
              onDeletePlay={handleDeletePlay}
              onLoadPlay={handleLoadPlay}
            />
          </div>
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
    y: team === 'home' ? 74 : 26,
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

const findArrowToRemove = (point: Point, arrows: Arrow[]): Arrow | null => {
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
            distanceToSegment(point, control, arrow.end)
          )
        : distanceToSegment(point, arrow.start, arrow.end);

    if (distance <= threshold && distance < closestDistance) {
      closestArrow = arrow;
      closestDistance = distance;
    }
  });

  return closestArrow;
};

export default App;
