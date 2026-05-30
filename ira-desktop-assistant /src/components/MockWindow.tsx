/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useRef } from 'react';
import { motion } from 'motion/react';
import { Minimize2, X, Maximize2 } from 'lucide-react';

interface MockWindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  initialX: number;
  initialY: number;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  icon?: ReactNode;
  children: ReactNode;
  width?: string;
  height?: string;
}

export default function MockWindow({
  id,
  title,
  isOpen,
  isMinimized,
  zIndex,
  initialX,
  initialY,
  onClose,
  onMinimize,
  onFocus,
  icon,
  children,
  width = 'w-[640px]',
  height = 'h-[420px]',
}: MockWindowProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  if (!isOpen || isMinimized) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: initialX, y: initialY }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ zIndex }}
      onClick={onFocus}
      drag
      dragHandleClassName="window-title-drag"
      dragMomentum={false}
      dragElastic={0.15}
      className={`absolute ${width} ${height} rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden font-sans select-none pointer-events-auto`}
      id={`mock-window-${id}`}
    >
      {/* Title Bar dragging handle */}
      <div
        className="window-title-drag h-12 bg-zinc-900/60 border-b border-white/5 px-4 flex items-center justify-between cursor-move"
        onMouseDown={onFocus}
      >
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-zinc-400 flex items-center justify-center">{icon}</div>}
          <span className="text-xs font-semibold tracking-wide text-zinc-300 font-display">{title}</span>
        </div>

        {/* Operating System Style Window Actions */}
        <div className="flex items-center gap-2 drag-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize Window"
            className="w-6 h-6 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close Window"
            className="w-6 h-6 rounded-full hover:bg-red-500/20 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Internal Content of Window */}
      <div className="flex-1 overflow-y-auto" onMouseDown={onFocus}>
        {children}
      </div>
    </motion.div>
  );
}
