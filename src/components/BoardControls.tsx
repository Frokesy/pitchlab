import { formationTemplates, toolOptions } from '../features/board/data';
import type { FormationKey, Player, TeamSide, ToolMode } from '../features/board/types';

type BoardControlsProps = {
  currentFormation: FormationKey;
  placementTeam: TeamSide;
  selectedPlayer: Player | null;
  toolMode: ToolMode;
  onAddPlayer: () => void;
  onFormationChange: (formation: FormationKey) => void;
  onPlacementTeamChange: (team: TeamSide) => void;
  onRemoveSelectedPlayer: () => void;
  onSwitchSelectedPlayerTeam: () => void;
  onToolChange: (tool: ToolMode) => void;
  onClearArrows: () => void;
  onResetBoard: () => void;
};

const BoardControls = ({
  currentFormation,
  placementTeam,
  selectedPlayer,
  toolMode,
  onAddPlayer,
  onFormationChange,
  onPlacementTeamChange,
  onRemoveSelectedPlayer,
  onSwitchSelectedPlayerTeam,
  onToolChange,
  onClearArrows,
  onResetBoard,
}: BoardControlsProps) => {
  const activeTool = toolOptions.find((tool) => tool.value === toolMode);

  return (
    <aside className="pitchlab-panel flex flex-col gap-6 px-4 py-5">
      <div>
        <p className="pitchlab-section-label">Tools</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {toolOptions.map((tool) => (
            <button
              key={tool.value}
              className={`pitchlab-tool ${toolMode === tool.value ? 'pitchlab-tool--active' : ''}`}
              onClick={() => onToolChange(tool.value)}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {activeTool?.description}
        </p>
      </div>

      <div>
        <p className="pitchlab-section-label">Formation</p>
        <div className="mt-3 grid gap-2">
          {(Object.keys(formationTemplates) as FormationKey[]).map((formation) => (
            <button
              key={formation}
              className={`pitchlab-tool ${
                currentFormation === formation ? 'pitchlab-tool--active' : ''
              }`}
              onClick={() => onFormationChange(formation)}
            >
              {formation}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="pitchlab-section-label">Players</p>
        <div className="mt-3 flex gap-2">
          {(['home', 'away'] as TeamSide[]).map((team) => (
            <button
              key={team}
              className={`pitchlab-chip ${
                placementTeam === team ? 'pitchlab-chip--active' : ''
              }`}
              onClick={() => onPlacementTeamChange(team)}
            >
              {team === 'home' ? 'Home team' : 'Opponent'}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2">
          <button className="pitchlab-button pitchlab-button--ghost" onClick={onAddPlayer}>
            Add {placementTeam === 'home' ? 'home' : 'opponent'} player
          </button>
          <button
            className="pitchlab-button pitchlab-button--ghost"
            onClick={onSwitchSelectedPlayerTeam}
            disabled={!selectedPlayer}
          >
            {selectedPlayer
              ? `Move ${selectedPlayer.label} to ${
                  selectedPlayer.team === 'home' ? 'opponent' : 'home'
                }`
              : 'Switch selected team'}
          </button>
          <button
            className="pitchlab-button pitchlab-button--ghost"
            onClick={onRemoveSelectedPlayer}
            disabled={!selectedPlayer}
          >
            {selectedPlayer ? `Remove ${selectedPlayer.label}` : 'Remove selected player'}
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {selectedPlayer
            ? `${selectedPlayer.label} #${selectedPlayer.number} is selected. Drag to reposition or move between teams.`
            : 'Select a player on the board to switch teams or remove them.'}
        </p>
      </div>

      <div>
        <p className="pitchlab-section-label">Quick actions</p>
        <div className="mt-3 grid gap-2">
          <button className="pitchlab-button pitchlab-button--ghost" onClick={onClearArrows}>
            Clear arrows
          </button>
          <button className="pitchlab-button pitchlab-button--ghost" onClick={onResetBoard}>
            Reset formation
          </button>
        </div>
      </div>
    </aside>
  );
};

export default BoardControls;
