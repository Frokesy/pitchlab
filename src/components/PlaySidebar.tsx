import type { SavedPlay } from '../features/board/types';

type PlaySidebarProps = {
  activeShareLink: string;
  savedPlays: SavedPlay[];
  shareStatus: string;
  onLoadPlay: (play: SavedPlay) => void;
};

const PlaySidebar = ({
  activeShareLink,
  savedPlays,
  shareStatus,
  onLoadPlay,
}: PlaySidebarProps) => (
  <aside className="pitchlab-panel flex flex-col gap-5 px-4 py-5">
    <div>
      <p className="pitchlab-section-label">Saved plays</p>
      <div className="mt-3 space-y-3">
        {savedPlays.length > 0 ? (
          savedPlays.map((play) => (
            <button key={play.id} className="saved-play" onClick={() => onLoadPlay(play)}>
              <span className="saved-play__name">{play.name}</span>
              <span className="saved-play__meta">{new Date(play.savedAt).toLocaleString()}</span>
            </button>
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
