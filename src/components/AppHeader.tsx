import { useState } from 'react';

import type { BoardState } from '../features/board/types';

type AppHeaderProps = {
  boardState: BoardState;
  canRedo: boolean;
  canUndo: boolean;
  isFocusMode: boolean;
  playName: string;
  saveLabel: string;
  shareStatus: string;
  onToggleFocusMode: () => void;
  onRedo: () => void;
  onPlayNameChange: (value: string) => void;
  onSaveAndNewBoard: () => void;
  onSavePlay: () => void;
  onShare: () => void;
  onUndo: () => void;
};

const AppHeader = ({
  boardState,
  canRedo,
  canUndo,
  isFocusMode,
  playName,
  saveLabel,
  shareStatus,
  onToggleFocusMode,
  onRedo,
  onPlayNameChange,
  onSaveAndNewBoard,
  onSavePlay,
  onShare,
  onUndo,
}: AppHeaderProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const compactPlayLabel = playName.trim() || 'Untitled play';

  return (
    <header className={`pitchlab-header${isFocusMode ? ' pitchlab-header--focus' : ''}`}>
      <div className="pitchlab-header__bar">
        <div className="pitchlab-header__bar-copy">
          <div className="pitchlab-header__brand">
            <img
              className="pitchlab-header__brand-logo"
              src="/assets/logo.png"
              alt="PitchLab"
            />
            <span className="pitchlab-header__brand-text">PitchLab</span>
          </div>
          <div>
            <p className="pitchlab-header__bar-title">{compactPlayLabel}</p>
            <p className="pitchlab-header__bar-subtitle">
              {shareStatus || `${boardState.formation} board ready`}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="pitchlab-header__accordion"
          aria-expanded={isExpanded}
          aria-controls="pitchlab-header-content"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span>{isExpanded ? 'Hide' : 'Open'}</span>
          <span
            className={`pitchlab-header__accordion-icon${
              isExpanded ? ' pitchlab-header__accordion-icon--open' : ''
            }`}
            aria-hidden="true"
          >
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        id="pitchlab-header-content"
        className={`pitchlab-header__content${
          isExpanded ? ' pitchlab-header__content--expanded' : ''
        }`}
      >
        <div className="pitchlab-header__summary">
          <div className="pitchlab-header__intro">
            <div className="pitchlab-header__brand">
              <img
                className="pitchlab-header__brand-logo"
                src="/assets/logo.png"
                alt="PitchLab"
              />
              <span className="pitchlab-header__brand-text">PitchLab</span>
            </div>
            <div>
              <h1 className="pitchlab-header__title">Design smarter football.</h1>
              <p className="pitchlab-header__copy">
                Shape the team, map the movement, and share a board players can read at
                a glance.
              </p>
            </div>
          </div>

          <div className="pitchlab-header__meta">
            <div className="pitchlab-header__stats" role="status" aria-live="polite">
              <div className="pitchlab-header__stat">
                <span className="pitchlab-header__stat-label">Formation</span>
                <strong className="pitchlab-header__stat-value">
                  {boardState.formation}
                </strong>
              </div>
              <div className="pitchlab-header__stat">
                <span className="pitchlab-header__stat-label">Players</span>
                <strong className="pitchlab-header__stat-value">
                  {boardState.players.length}
                </strong>
              </div>
              <div className="pitchlab-header__stat">
                <span className="pitchlab-header__stat-label">Lines</span>
                <strong className="pitchlab-header__stat-value">
                  {boardState.arrows.length}
                </strong>
              </div>
            </div>
            <p className="pitchlab-header__status">{shareStatus || 'Board ready'}</p>
          </div>
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
              placeholder="e.g. Wing overload"
            />
          </label>

          <div className="pitchlab-header__action-row">
            <div className="pitchlab-header__history">
              <button
                className="pitchlab-header__history-button"
                onClick={onUndo}
                disabled={!canUndo}
              >
                Undo
              </button>
              <button
                className="pitchlab-header__history-button"
                onClick={onRedo}
                disabled={!canRedo}
              >
                Redo
              </button>
            </div>

            <button className="pitchlab-button pitchlab-header__primary" onClick={onSavePlay}>
              {saveLabel}
            </button>
          </div>

          <div className="pitchlab-header__secondary">
            <button
              className="pitchlab-button pitchlab-button--ghost pitchlab-header__focus-toggle"
              onClick={onToggleFocusMode}
            >
              {isFocusMode ? 'Exit focus mode' : 'Focus mode'}
            </button>
            <button
              className="pitchlab-button pitchlab-button--ghost"
              onClick={onSaveAndNewBoard}
            >
              Save + new board
            </button>
            <button className="pitchlab-button pitchlab-button--ghost" onClick={onShare}>
              Copy share link
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
