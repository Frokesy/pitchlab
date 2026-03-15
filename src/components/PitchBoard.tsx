import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import type { BoardState, Point, ToolMode } from '../features/board/types';

type PitchBoardProps = {
  boardState: BoardState;
  pendingPoint: Point | null;
  pitchRef: RefObject<HTMLDivElement | null>;
  selectedPlayerId: string | null;
  toolMode: ToolMode;
  onPitchPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPlayerPointerDown: (playerId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
};

const PitchBoard = ({
  boardState,
  pendingPoint,
  pitchRef,
  selectedPlayerId,
  toolMode,
  onPitchPointerDown,
  onPlayerPointerDown,
}: PitchBoardProps) => (
  <section className="pitchlab-panel flex min-h-[720px] flex-col overflow-hidden px-4 py-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="pitchlab-section-label">Board</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {pendingPoint
            ? 'Select the second point to finish the annotation.'
            : 'Primary team in green. Markups layer over live player positions.'}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        Home
        <span className="ml-3 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-alt)]" />
        Opponent
      </div>
    </div>

    <div
      ref={pitchRef}
      className="pitch relative flex-1 overflow-hidden rounded-[28px]"
      onPointerDown={onPitchPointerDown}
    >
      <PitchMarkings />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <marker id="arrowhead-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#22FF88" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#3DA9FC" />
          </marker>
        </defs>
        {boardState.arrows.map((arrow) =>
          arrow.type === 'curve' && arrow.control ? (
            <path
              key={arrow.id}
              d={`M ${arrow.start.x} ${arrow.start.y} Q ${arrow.control.x} ${arrow.control.y} ${arrow.end.x} ${arrow.end.y}`}
              fill="none"
              stroke={arrow.color}
              strokeWidth={arrow.strokeWidth ?? 0.75}
              strokeLinecap="round"
              markerEnd={arrow.color === '#3DA9FC' ? 'url(#arrowhead-blue)' : 'url(#arrowhead-green)'}
            />
          ) : (
            <line
              key={arrow.id}
              x1={arrow.start.x}
              y1={arrow.start.y}
              x2={arrow.end.x}
              y2={arrow.end.y}
              stroke={arrow.color}
              strokeWidth={arrow.strokeWidth ?? 0.75}
              strokeLinecap="round"
              markerEnd={arrow.color === '#3DA9FC' ? 'url(#arrowhead-blue)' : 'url(#arrowhead-green)'}
            />
          ),
        )}

        {pendingPoint && toolMode !== 'select' && toolMode !== 'erase' ? (
          <circle
            cx={pendingPoint.x}
            cy={pendingPoint.y}
            r="1.1"
            fill={toolMode === 'curve' ? '#3DA9FC' : '#22FF88'}
          />
        ) : null}
      </svg>

      {boardState.players.map((player) => (
        <button
          key={player.id}
          className={`player-token ${
            player.team === 'home' ? 'player-token--home' : 'player-token--away'
          } ${selectedPlayerId === player.id ? 'player-token--selected' : ''}`}
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
          onPointerDown={(event) => onPlayerPointerDown(player.id, event)}
        >
          <span className="player-token__number">{player.number}</span>
          <span className="player-token__label">{player.label}</span>
        </button>
      ))}
    </div>
  </section>
);

const PitchMarkings = () => (
  <>
    <div className="absolute inset-[2.5%] rounded-[24px] border border-white/70" />
    <div className="absolute left-1/2 top-[2.5%] h-[95%] w-px -translate-x-1/2 bg-white/70" />
    <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
    <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
    <div className="absolute left-1/2 top-[14%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
    <div className="absolute left-1/2 top-[86%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
    <div className="absolute left-1/2 top-[2.5%] h-[16%] w-[36%] -translate-x-1/2 rounded-b-[18px] border border-t-0 border-white/70" />
    <div className="absolute left-1/2 top-[2.5%] h-[7%] w-[16%] -translate-x-1/2 rounded-b-[12px] border border-t-0 border-white/70" />
    <div className="absolute left-1/2 bottom-[2.5%] h-[16%] w-[36%] -translate-x-1/2 rounded-t-[18px] border border-b-0 border-white/70" />
    <div className="absolute left-1/2 bottom-[2.5%] h-[7%] w-[16%] -translate-x-1/2 rounded-t-[12px] border border-b-0 border-white/70" />
    <div className="absolute left-1/2 top-[2.5%] h-[2.6%] w-[10%] -translate-x-1/2 border-x border-b border-white/70" />
    <div className="absolute left-1/2 bottom-[2.5%] h-[2.6%] w-[10%] -translate-x-1/2 border-x border-t border-white/70" />
    <div className="absolute left-[2.5%] top-[43.5%] h-[13%] w-[6%] rounded-r-full border border-l-0 border-white/70" />
    <div className="absolute right-[2.5%] top-[43.5%] h-[13%] w-[6%] rounded-l-full border border-r-0 border-white/70" />
  </>
);

export default PitchBoard;
