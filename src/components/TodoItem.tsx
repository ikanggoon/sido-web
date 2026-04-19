'use client';

import { useState } from 'react';
import type { Task } from './AppShell';

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function TodoItem({ task, onToggle, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onToggle(task)}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${task.is_done ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
      >
        {task.is_done && (
          <svg viewBox="0 0 10 10" className="w-full h-full text-white">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm ${task.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.title}
      </span>

      {hovered && (
        <button
          onClick={() => onDelete(task)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs px-1"
        >
          ✕
        </button>
      )}
    </li>
  );
}
