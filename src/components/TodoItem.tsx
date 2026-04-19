'use client';

import { useState } from 'react';

type Task = {
  id: string;
  remote_id: string | null;
  title: string;
  done: boolean;
  category_id: string | null;
  due_date: string | null;
  priority: number;
  deleted: boolean;
  updated_at: string;
};

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'border-l-red-400',
  2: 'border-l-orange-400',
  3: 'border-l-yellow-400',
};

export default function TodoItem({ task, onToggle, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);
  const borderColor = PRIORITY_COLORS[task.priority] ?? 'border-l-transparent';

  return (
    <li
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 ${borderColor} hover:bg-gray-50 transition-colors group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onToggle(task)}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${task.done ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
      >
        {task.done && (
          <svg viewBox="0 0 10 10" className="w-full h-full text-white">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
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
