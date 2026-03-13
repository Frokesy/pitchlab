import type { BoardState } from '../features/board/types';

type AppHeaderProps = {
  boardState: BoardState;
  canRedo: boolean;
  canUndo: boolean;
  playName: string;
  shareStatus: string;
  onRedo: () => void;
  onPlayNameChange: (value: string) => void;
  onSavePlay: () => void;
  onShare: () => void;
  onUndo: () => void;
};

const AppHeader = ({
  boardState,
  canRedo,
  canUndo,
  playName,
  shareStatus,
  onRedo,
  onPlayNameChange,
  onSavePlay,
  onShare,
  onUndo,
}: AppHeaderProps) => (
  <header className="pitchlab-header">
    <div className="pitchlab-header__intro">
      <div className="pitchlab-header__brand">
        <span className="pitchlab-header__brand-mark" />
        <span className="pitchlab-header__brand-text">PitchLab</span>
      </div>
      <div>
        <h1 className="pitchlab-header__title">Design smarter football.</h1>
        <p className="pitchlab-header__copy">
          Build, adjust, and share tactical boards without leaving the pitch view.
        </p>
      </div>
    </div>

    <div className="pitchlab-header__meta">
      <div className="pitchlab-header__stats" role="status" aria-live="polite">
        <div className="pitchlab-header__stat">
          <span className="pitchlab-header__stat-label">Formation</span>
          <strong className="pitchlab-header__stat-value">{boardState.formation}</strong>
        </div>
        <div className="pitchlab-header__stat">
          <span className="pitchlab-header__stat-label">Players</span>
          <strong className="pitchlab-header__stat-value">{boardState.players.length}</strong>
        </div>
        <div className="pitchlab-header__stat">
          <span className="pitchlab-header__stat-label">Lines</span>
          <strong className="pitchlab-header__stat-value">{boardState.arrows.length}</strong>
        </div>
      </div>
      <p className="pitchlab-header__status">{shareStatus || 'Ready'}</p>
    </div>

    <div className="pitchlab-header__actions">
      <label className="pitchlab-header__field">
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
          Play name
        </span>
        <input
          className="pitchlab-input"
          value={playName}
          onChange={(event) => onPlayNameChange(event.target.value)}
          placeholder="Name this play"
        />
      </label>

      <div className="pitchlab-header__buttons">
        <button className="pitchlab-button pitchlab-button--ghost" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button className="pitchlab-button pitchlab-button--ghost" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button className="pitchlab-button" onClick={onSavePlay}>
          Save play
        </button>
        <button className="pitchlab-button pitchlab-button--ghost" onClick={onShare}>
          Copy share link
        </button>
      </div>
    </div>
  </header>
);

export default AppHeader;
