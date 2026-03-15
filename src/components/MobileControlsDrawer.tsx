import { AnimatePresence, motion } from 'framer-motion';

import BoardControls from './BoardControls';
import type { BoardControlsProps } from './BoardControls';

type MobileControlsDrawerProps = BoardControlsProps & {
  isOpen: boolean;
  onClose: () => void;
};

const MobileControlsDrawer = ({
  isOpen,
  onClose,
  ...controlsProps
}: MobileControlsDrawerProps) => (
  <AnimatePresence>
    {isOpen ? (
      <>
        <motion.button
          key="mobile-controls-backdrop"
          className="pitchlab-mobile-backdrop md:hidden"
          aria-label="Close controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onClose}
        />
        <motion.div
          key="mobile-controls-drawer"
          className="pitchlab-mobile-drawer md:hidden"
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.985 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <BoardControls
            {...controlsProps}
            className="pitchlab-mobile-drawer__panel"
          />
        </motion.div>
      </>
    ) : null}
  </AnimatePresence>
);

export default MobileControlsDrawer;
