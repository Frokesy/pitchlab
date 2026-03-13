import { formationTemplates, toolOptions } from '../features/board/data';
import type { FormationKey, ToolMode } from '../features/board/types';

type BoardControlsProps = {
  currentFormation: FormationKey;
  toolMode: ToolMode;
  onFormationChange: (formation: FormationKey) => void;
  onToolChange: (tool: ToolMode) => void;
  onClearArrows: () => void;
  onResetBoard: () => void;
};

const BoardControls = ({
  currentFormation,
  toolMode,
  onFormationChange,
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
