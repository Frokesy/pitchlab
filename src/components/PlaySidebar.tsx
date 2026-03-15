import type { SavedPlay } from '../features/board/types';

type PlaySidebarProps = {
  activePlayId: string | null;
  activeShareLink: string;
  savedPlays: SavedPlay[];
  shareStatus: string;
  onDeletePlay: (play: SavedPlay) => void;
  onLoadPlay: (play: SavedPlay) => void;
};

const PlaySidebar = ({
  activePlayId,
  activeShareLink,
  savedPlays,
  shareStatus,
  onDeletePlay,
  onLoadPlay,
}: PlaySidebarProps) => (
  <aside className="pitchlab-panel flex flex-col gap-5 px-4 py-5">
    <div>
      <p className="pitchlab-section-label">Saved plays</p>
      <div className="mt-3 space-y-3">
        {savedPlays.length > 0 ? (
          savedPlays.map((play) => (
            <div
              key={play.id}
              className={`saved-play ${
                activePlayId === play.id ? 'saved-play--active' : ''
              }`}
            >
              <button
                className="saved-play__main"
                onClick={() => onLoadPlay(play)}
              >
                <span className="saved-play__name">{play.name}</span>
                <span className="saved-play__meta">
                  {activePlayId === play.id ? 'Current play' : new Date(play.savedAt).toLocaleString()}
                </span>
              </button>
              <button
                className="saved-play__delete"
                onClick={() => onDeletePlay(play)}
                aria-label={`Delete ${play.name}`}
                title={`Delete ${play.name}`}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-[var(--muted)]">
            Saved plays will appear here after the first board save.
          </div>
        )}
      </div>
    </div>

    <div className="rounded-2xl border border-white/8 bg-[var(--panel-strong)] p-4">
      <p className="pitchlab-section-label">Share link</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Copy a shareable board link and send it directly to players or staff.
      </p>
      <textarea className="pitchlab-textarea mt-4" readOnly value={activeShareLink} />
      <p className="mt-3 text-sm font-medium text-[var(--accent)]">{shareStatus || 'Ready'}</p>
    </div>
  </aside>
);

export default PlaySidebar;
