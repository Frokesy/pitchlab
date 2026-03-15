import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { BoardControlsProps } from '../../components/BoardControls';
import {
  createArrow,
  createBenchPlayer,
  findArrowToRemove,
} from './helpers';
import {
  DEFAULT_PLAY_NAME,
  EMPTY_PLAY_NAME,
  SHARED_PLAY_HASH_PREFIX,
} from './constants';
import { usePlayerDrag } from './usePlayerDrag';
import type {
  BoardState,
  FormationKey,
  Point,
  SavedPlay,
  TeamSide,
  ToolMode,
} from './types';
import {
  defaultBoardState,
  decodeBoardState,
  encodeBoardState,
  isSameBoardState,
  loadSavedPlays,
  loadWorkspaceState,
  persistSavedPlays,
  persistWorkspaceState,
} from './utils';

type ExternalBoardOptions = {
  playId?: string | null;
  playName?: string;
  status?: string;
};

export const usePitchLabApp = () => {
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
      : initialWorkspaceState?.playName || DEFAULT_PLAY_NAME,
  );
  const [savedPlays, setSavedPlays] = useState<SavedPlay[]>(initialSavedPlays);
  const [shareStatus, setShareStatus] = useState(
    hadInvalidSharedState ? 'Shared link was invalid' : '',
  );
  const [activePlayId, setActivePlayId] = useState<string | null>(initialActivePlayId);
  const [historyPast, setHistoryPast] = useState<BoardState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BoardState[]>([]);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [placementTeam, setPlacementTeam] = useState<TeamSide>(
    initialWorkspaceState?.placementTeam ?? 'away',
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState(
    initialWorkspaceState?.annotationColor ?? '#22FF88',
  );
  const [annotationThickness, setAnnotationThickness] = useState(
    initialWorkspaceState?.annotationThickness ?? 0.8,
  );
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFocusDrawerExpanded, setIsFocusDrawerExpanded] = useState(false);

  const pitchRef = useRef<HTMLDivElement | null>(null);
  const boardStateRef = useRef(boardState);

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
  const activePlay = savedPlays.find((play) => play.id === activePlayId) ?? null;
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

  const clearSharedHash = useCallback(() => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  const { getRelativePoint, resetDragState, startPlayerDrag } = usePlayerDrag({
    pitchRef,
    boardStateRef,
    setBoardState,
    onDragCommit: (originState, nextState) => {
      setHistoryPast((previous) => [...previous.slice(-49), originState]);
      setHistoryFuture([]);
      boardStateRef.current = nextState;
    },
  });

  const applyExternalBoardState = useCallback((
    nextState: BoardState,
    options?: ExternalBoardOptions,
  ) => {
    setBoardState(nextState);
    setPendingPoint(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setIsMobileControlsOpen(false);
    setSelectedPlayerId(null);
    resetDragState();

    if (options?.playName) {
      setPlayName(options.playName);
    }

    setActivePlayId(options?.playId ?? null);

    if (options?.status) {
      setShareStatus(options.status);
    }
  }, [resetDragState]);

  useEffect(() => {
    if (!hadInvalidSharedState) {
      return;
    }

    clearSharedHash();
  }, [clearSharedHash, hadInvalidSharedState]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith(SHARED_PLAY_HASH_PREFIX)) {
        return;
      }

      const decodedState = decodeBoardState(
        hash.slice(SHARED_PLAY_HASH_PREFIX.length),
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
  }, [applyExternalBoardState, clearSharedHash]);

  const commitBoardState = useCallback((nextState: BoardState) => {
    const currentState = boardStateRef.current;
    if (isSameBoardState(currentState, nextState)) {
      setPendingPoint(null);
      return;
    }

    setHistoryPast((previous) => [...previous.slice(-49), currentState]);
    setHistoryFuture([]);
    setBoardState(nextState);
    setPendingPoint(null);
  }, []);

  const persistCurrentPlay = useCallback(() => {
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
  }, [activePlayId, boardState, playName, savedPlays]);

  const closeMobileControls = useCallback(() => {
    setIsMobileControlsOpen(false);
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((current) => {
      if (current) {
        setIsFocusDrawerExpanded(false);
      }

      return !current;
    });
  }, []);

  const handleToggleFocusDrawer = useCallback(() => {
    setIsFocusDrawerExpanded((current) => !current);
  }, []);

  const handlePitchPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (toolMode === 'erase') {
      const arrowToRemove = findArrowToRemove(point, boardState.arrows);
      if (!arrowToRemove) {
        return;
      }

      commitBoardState({
        ...boardState,
        arrows: boardState.arrows.filter((arrow) => arrow.id !== arrowToRemove.id),
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
      annotationThickness,
    );
    commitBoardState({
      ...boardState,
      arrows: [...boardState.arrows, nextArrow],
    });
  }, [
    annotationColor,
    annotationThickness,
    boardState,
    commitBoardState,
    getRelativePoint,
    pendingPoint,
    toolMode,
  ]);

  const handleSavePlay = useCallback(() => persistCurrentPlay(), [persistCurrentPlay]);

  const handleSaveAndNewBoard = useCallback(() => {
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
  }, [applyExternalBoardState, clearSharedHash, currentFormation, persistCurrentPlay]);

  const handleShare = useCallback(async () => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}${SHARED_PLAY_HASH_PREFIX}${encodeBoardState(boardState)}`,
    );

    try {
      await navigator.clipboard.writeText(activeShareLink);
      setShareStatus('Share link copied');
    } catch {
      setShareStatus('Share link ready in URL');
    }
  }, [activeShareLink, boardState]);

  const handleLoadPlay = useCallback((play: SavedPlay) => {
    applyExternalBoardState(play.state, {
      playId: play.id,
      playName: play.name,
      status: 'Play loaded',
    });
  }, [applyExternalBoardState]);

  const handleDeletePlay = useCallback((play: SavedPlay) => {
    const nextPlays = savedPlays.filter((entry) => entry.id !== play.id);
    setSavedPlays(nextPlays);
    persistSavedPlays(nextPlays);

    if (activePlayId === play.id) {
      setActivePlayId(null);
      setShareStatus('Play deleted. Current board kept as draft');
      return;
    }

    setShareStatus('Play deleted');
  }, [activePlayId, savedPlays]);

  const handleUndo = useCallback(() => {
    if (!canUndo) {
      return;
    }

    const previousState = historyPast[historyPast.length - 1];
    setHistoryPast((previous) => previous.slice(0, -1));
    setHistoryFuture((future) => [boardStateRef.current, ...future].slice(0, 50));
    setBoardState(previousState);
    setPendingPoint(null);
    setSelectedPlayerId(null);
  }, [canUndo, historyPast]);

  const handleRedo = useCallback(() => {
    if (!canRedo) {
      return;
    }

    const [nextState, ...remaining] = historyFuture;
    setHistoryFuture(remaining);
    setHistoryPast((previous) => [...previous.slice(-49), boardStateRef.current]);
    setBoardState(nextState);
    setPendingPoint(null);
    setSelectedPlayerId(null);
  }, [canRedo, historyFuture]);

  const handleAddPlayer = useCallback(() => {
    const nextPlayer = createBenchPlayer(placementTeam, boardState.players);
    commitBoardState({
      ...boardState,
      players: [...boardState.players, nextPlayer],
    });
    setSelectedPlayerId(nextPlayer.id);
    setShareStatus(
      placementTeam === 'home' ? 'Home player added' : 'Opponent player added',
    );
  }, [boardState, commitBoardState, placementTeam]);

  const handleSwitchSelectedPlayerTeam = useCallback(() => {
    if (!selectedPlayer) {
      return;
    }

    commitBoardState({
      ...boardState,
      players: boardState.players.map((player) =>
        player.id === selectedPlayer.id
          ? { ...player, team: player.team === 'home' ? 'away' : 'home' }
          : player,
      ),
    });
    setPlacementTeam(selectedPlayer.team === 'home' ? 'away' : 'home');
  }, [boardState, commitBoardState, selectedPlayer]);

  const handleRemoveSelectedPlayer = useCallback(() => {
    if (!selectedPlayer) {
      return;
    }

    commitBoardState({
      ...boardState,
      players: boardState.players.filter(
        (player) => player.id !== selectedPlayer.id,
      ),
    });
    setSelectedPlayerId(null);
    setShareStatus('Player removed');
  }, [boardState, commitBoardState, selectedPlayer]);

  const handleToolChange = useCallback((tool: ToolMode) => {
    setToolMode(tool);
    setPendingPoint(null);
    closeMobileControls();
  }, [closeMobileControls]);

  const handlePlacementTeamChange = useCallback((team: TeamSide) => {
    setPlacementTeam(team);
    closeMobileControls();
  }, [closeMobileControls]);

  const handleAnnotationColorChange = useCallback((color: string) => {
    setAnnotationColor(color);
    closeMobileControls();
  }, [closeMobileControls]);

  const handleAnnotationThicknessChange = useCallback((thickness: number) => {
    setAnnotationThickness(thickness);
    closeMobileControls();
  }, [closeMobileControls]);

  const handleFormationSelect = useCallback((formation: FormationKey) => {
    commitBoardState(defaultBoardState(formation));
    closeMobileControls();
  }, [closeMobileControls, commitBoardState]);

  const handleClearArrows = useCallback(() => {
    commitBoardState({ ...boardState, arrows: [] });
    closeMobileControls();
  }, [boardState, closeMobileControls, commitBoardState]);

  const handleResetBoard = useCallback(() => {
    commitBoardState(defaultBoardState(currentFormation));
    closeMobileControls();
  }, [closeMobileControls, commitBoardState, currentFormation]);

  const handleAddPlayerFromControls = useCallback(() => {
    handleAddPlayer();
    closeMobileControls();
  }, [closeMobileControls, handleAddPlayer]);

  const handleSwitchSelectedPlayerTeamFromControls = useCallback(() => {
    handleSwitchSelectedPlayerTeam();
    closeMobileControls();
  }, [closeMobileControls, handleSwitchSelectedPlayerTeam]);

  const handleRemoveSelectedPlayerFromControls = useCallback(() => {
    handleRemoveSelectedPlayer();
    closeMobileControls();
  }, [closeMobileControls, handleRemoveSelectedPlayer]);

  const handleMobileControlsOpen = useCallback(() => {
    setIsMobileControlsOpen(true);
  }, []);

  const handlePlayerPointerDown = useCallback((
    playerId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    setSelectedPlayerId(playerId);
    if (toolMode !== 'select') {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    startPlayerDrag(playerId, event);
  }, [startPlayerDrag, toolMode]);

  const boardControlsProps: BoardControlsProps = {
    annotationColor,
    annotationThickness,
    currentFormation,
    placementTeam,
    selectedPlayer,
    toolMode,
    onAddPlayer: handleAddPlayerFromControls,
    onAnnotationColorChange: handleAnnotationColorChange,
    onAnnotationThicknessChange: handleAnnotationThicknessChange,
    onFormationChange: handleFormationSelect,
    onPlacementTeamChange: handlePlacementTeamChange,
    onRemoveSelectedPlayer: handleRemoveSelectedPlayerFromControls,
    onSwitchSelectedPlayerTeam: handleSwitchSelectedPlayerTeamFromControls,
    onToolChange: handleToolChange,
    onClearArrows: handleClearArrows,
    onResetBoard: handleResetBoard,
  };

  return {
    activePlayId,
    activeShareLink,
    boardControlsProps,
    boardState,
    canRedo,
    canUndo,
    handleDeletePlay,
    handleLoadPlay,
    handleMobileControlsOpen,
    handlePitchPointerDown,
    handlePlayerPointerDown,
    handleRedo,
    handleSaveAndNewBoard,
    handleSavePlay,
    handleShare,
    handleToggleFocusDrawer,
    handleToggleFocusMode,
    handleUndo,
    isFocusDrawerExpanded,
    isFocusMode,
    isMobileControlsOpen,
    pendingPoint,
    pitchRef,
    playName,
    saveLabel,
    savedPlays,
    selectedPlayerId,
    setPlayName,
    shareStatus,
    closeMobileControls,
  };
};
