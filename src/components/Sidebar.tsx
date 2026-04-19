'use client';

import type { User } from '@supabase/supabase-js';

type Task = { id: string; category_id: string | null; done: boolean; deleted: boolean };
type Category = { id: string; name: string; hidden: boolean; sort_order: number };

type Props = {
  categories: Category[];
  tasks: Task[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
  user: User;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onSignOut: () => void;
};

const SYNC_ICONS = {
  idle: '',
  syncing: '↻',
  synced: '✓',
  error: '✕',
};

const SYNC_COLORS = {
  idle: 'text-gray-400',
  syncing: 'text-blue-400 animate-spin',
  synced: 'text-green-500',
  error: 'text-red-400',
};

export default function Sidebar({ categories, tasks, selectedCategoryId, onSelect, user, syncStatus, onSignOut }: Props) {
  const activeTasks = tasks.filter(t => !t.deleted);
  const allCount = activeTasks.filter(t => !t.done).length;

  const countFor = (catId: string) =>
    activeTasks.filter(t => t.category_id === catId && !t.done).length;

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">SIDO</span>
        <span className={`text-xs ml-auto ${SYNC_COLORS[syncStatus]}`}>
          {SYNC_ICONS[syncStatus]}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedCategoryId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span>전체</span>
          {allCount > 0 && <span className="text-xs text-gray-400">{allCount}</span>}
        </button>

        {categories.filter(c => !c.hidden).map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="truncate">{cat.name}</span>
            {countFor(cat.id) > 0 && (
              <span className="text-xs text-gray-400">{countFor(cat.id)}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        <button
          onClick={onSignOut}
          className="mt-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
