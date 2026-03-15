import BoardControls from './BoardControls';
import type { BoardControlsProps } from './BoardControls';
import type { ToolMode } from '../features/board/types';

type FocusModeSidebarProps = BoardControlsProps & {
  isExpanded: boolean;
  onAddPlayer: () => void;
  onClearArrows: () => void;
  onResetBoard: () => void;
  onToggleExpanded: () => void;
  onExitFocusMode: () => void;
};

const toolIcons: Record<ToolMode, string> = {
  select:
    'M12 4v16m0 0-5-5m5 5 5-5',
  straight:
    'M5 19 19 5m0 0h-6m6 0v6',
  curve:
    'M5 16c4-8 10-8 14 0m0 0-2-5m2 5-5-1',
  erase:
    'm6 6 12 12m0-12L6 18',
};

const FocusModeSidebar = ({
  isExpanded,
  onAddPlayer,
  onClearArrows,
  onExitFocusMode,
  onResetBoard,
  onToggleExpanded,
  onToolChange,
  toolMode,
  ...controlsProps
}: FocusModeSidebarProps) => (
  <aside
    className={`pitchlab-focus-sidebar${isExpanded ? ' pitchlab-focus-sidebar--expanded' : ''}`}
  >
    <div className="pitchlab-focus-sidebar__rail">
      <div className="pitchlab-focus-sidebar__stack">
        {(
          [
            ['select', 'Move'],
            ['straight', 'Line'],
            ['curve', 'Curve'],
            ['erase', 'Erase'],
          ] as Array<[ToolMode, string]>
        ).map(([tool, label]) => (
          <button
            key={tool}
            type="button"
            className={`pitchlab-focus-sidebar__icon-button${
              toolMode === tool ? ' pitchlab-focus-sidebar__icon-button--active' : ''
            }`}
            onClick={() => onToolChange(tool)}
            aria-label={label}
            title={label}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={toolIcons[tool]} />
            </svg>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="pitchlab-focus-sidebar__divider" />

      <div className="pitchlab-focus-sidebar__stack">
        <button
          type="button"
          className="pitchlab-focus-sidebar__icon-button"
          onClick={onAddPlayer}
          aria-label="Add player"
          title="Add player"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          <span>Add</span>
        </button>
        <button
          type="button"
          className="pitchlab-focus-sidebar__icon-button"
          onClick={onClearArrows}
          aria-label="Clear lines"
          title="Clear lines"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 7h12M9 7V5h6v2m-7 4v6m4-6v6m4-6v6M7 7l1 12h8l1-12" />
          </svg>
          <span>Clear</span>
        </button>
        <button
          type="button"
          className="pitchlab-focus-sidebar__icon-button"
          onClick={onResetBoard}
          aria-label="Reset board"
          title="Reset board"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      <div className="pitchlab-focus-sidebar__spacer" />

      <div className="pitchlab-focus-sidebar__stack">
        <button
          type="button"
          className="pitchlab-focus-sidebar__icon-button"
          onClick={onToggleExpanded}
          aria-label={isExpanded ? 'Collapse tools drawer' : 'Expand tools drawer'}
          title={isExpanded ? 'Collapse tools' : 'Expand tools'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={isExpanded ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
          </svg>
          <span>{isExpanded ? 'Hide' : 'Tools'}</span>
        </button>
        <button
          type="button"
          className="pitchlab-focus-sidebar__icon-button"
          onClick={onExitFocusMode}
          aria-label="Exit focus mode"
          title="Exit focus mode"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5H5v4m0 6v4h4m6 0h4v-4m0-6V5h-4" />
          </svg>
          <span>Exit</span>
        </button>
      </div>
    </div>

    <div className="pitchlab-focus-sidebar__drawer">
      <BoardControls
        {...controlsProps}
        onAddPlayer={onAddPlayer}
        onClearArrows={onClearArrows}
        onResetBoard={onResetBoard}
        toolMode={toolMode}
        onToolChange={onToolChange}
      />
    </div>
  </aside>
);

export default FocusModeSidebar;
