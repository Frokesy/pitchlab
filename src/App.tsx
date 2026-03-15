import AppHeader from './components/AppHeader';
import BoardControls from './components/BoardControls';
import FocusModeSidebar from './components/FocusModeSidebar';
import MobileControlsDrawer from './components/MobileControlsDrawer';
import PitchBoard from './components/PitchBoard';
import PlaySidebar from './components/PlaySidebar';
import { usePitchLabApp } from './features/board/usePitchLabApp';

const App = () => {
  const {
    activePlayId,
    activeShareLink,
    boardControlsProps,
    boardState,
    canRedo,
    canUndo,
    closeMobileControls,
    handleDeletePlay,
    handleLoadPlay,
    handleMobileControlsOpen,
    handlePitchPointerDown,
    handlePlayerPointerDown,
    handleRedo,
    handleSaveAndNewBoard,
    handleSavePlay,
    handleShare,
    handleToggleOrientation,
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
  } = usePitchLabApp();

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:px-6">
        <AppHeader
          boardState={boardState}
          canRedo={canRedo}
          canUndo={canUndo}
          isFocusMode={isFocusMode}
          playName={playName}
          saveLabel={saveLabel}
          shareStatus={shareStatus}
          onToggleOrientation={handleToggleOrientation}
          onToggleFocusMode={handleToggleFocusMode}
          onRedo={handleRedo}
          onPlayNameChange={setPlayName}
          onSaveAndNewBoard={handleSaveAndNewBoard}
          onSavePlay={handleSavePlay}
          onShare={handleShare}
          onUndo={handleUndo}
        />

        <section
          className={`grid flex-1 gap-6 ${
            isFocusMode
              ? 'md:grid-cols-[minmax(72px,auto)_minmax(0,1fr)]'
              : 'xl:grid-cols-[280px_minmax(0,1fr)_320px]'
          }`}
        >
          <div
            className={`order-2 hidden md:block ${
              isFocusMode ? 'md:order-1' : 'xl:order-1'
            }`}
          >
            {isFocusMode ? (
              <FocusModeSidebar
                {...boardControlsProps}
                isExpanded={isFocusDrawerExpanded}
                onAddPlayer={boardControlsProps.onAddPlayer}
                onClearArrows={boardControlsProps.onClearArrows}
                onExitFocusMode={handleToggleFocusMode}
                onResetBoard={boardControlsProps.onResetBoard}
                onToggleExpanded={handleToggleFocusDrawer}
              />
            ) : (
              <BoardControls {...boardControlsProps} />
            )}
          </div>

          <div className={`order-1 relative ${isFocusMode ? 'md:order-2' : 'xl:order-2'}`}>
            <button
              className="pitchlab-mobile-toggle md:hidden"
              onClick={handleMobileControlsOpen}
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

            <MobileControlsDrawer
              {...boardControlsProps}
              isOpen={isMobileControlsOpen}
              onClose={closeMobileControls}
            />

            <PitchBoard
              boardState={boardState}
              isFocusMode={isFocusMode}
              pendingPoint={pendingPoint}
              pitchRef={pitchRef}
              selectedPlayerId={selectedPlayerId}
              toolMode={boardControlsProps.toolMode}
              onPitchPointerDown={handlePitchPointerDown}
              onPlayerPointerDown={handlePlayerPointerDown}
            />
          </div>

          {isFocusMode ? null : (
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
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
