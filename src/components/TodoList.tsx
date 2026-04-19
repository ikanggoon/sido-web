'use client';

import { createClient } from '@/lib/supabase/client';
import type { Task, Category } from './AppShell';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

type Props = {
  tasks: Task[];
  categories: Category[];
  selectedCategoryId: string | null;
  userId: string;
  onTasksChange: (updater: (prev: Task[]) => Task[]) => void;
  onSyncStart: () => void;
  onSyncEnd: (ok: boolean) => void;
  onBroadcast: () => Promise<void>;
};

export default function TodoList({ tasks, categories, selectedCategoryId, userId, onTasksChange, onSyncStart, onSyncEnd, onBroadcast }: Props) {
  const supabase = createClient();

  const filtered = tasks.filter(t =>
    selectedCategoryId === null || t.category_id === selectedCategoryId
  );

  const active = filtered.filter(t => !t.is_done);
  const done = filtered.filter(t => t.is_done);

  const categoryName = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)?.name ?? '카테고리'
    : '전체';

  const handleToggle = async (task: Task) => {
    const newDone = !task.is_done;
    onTasksChange(prev => prev.map(t => t.id === task.id ? { ...t, is_done: newDone } : t));
    onSyncStart();
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: newDone, done_date: newDone ? new Date().toISOString() : null })
      .eq('id', task.id);
    onSyncEnd(!error);
    if (!error) onBroadcast();
  };

  const handleDelete = async (task: Task) => {
    onTasksChange(prev => prev.filter(t => t.id !== task.id));
    onSyncStart();
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    onSyncEnd(!error);
    if (!error) onBroadcast();
  };

  const handleAdd = async (title: string) => {
    const tempId = crypto.randomUUID();
    const optimistic: Task = {
      id: tempId, user_id: userId, category_id: selectedCategoryId,
      title, detail: null, priority: 'nu', due: null,
      is_done: false, done_date: null, position: 0,
      updated_at: new Date().toISOString(),
    };
    onTasksChange(prev => [optimistic, ...prev]);
    onSyncStart();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, category_id: selectedCategoryId, title, priority: 'nu', position: 0 })
      .select()
      .single();
    if (!error && data) {
      onTasksChange(prev => prev.map(t => t.id === tempId ? data as Task : t));
    } else {
      onTasksChange(prev => prev.filter(t => t.id !== tempId));
    }
    onSyncEnd(!error);
    if (!error) onBroadcast();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-base font-semibold text-gray-900">{categoryName}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{active.length}개 남음</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AddTodo onAdd={handleAdd} />
        <ul className="px-4 pb-4">
          {active.map(task => (
            <TodoItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
          {done.length > 0 && (
            <>
              <li className="text-xs text-gray-400 px-2 py-3 mt-2">완료된 항목 {done.length}개</li>
              {done.map(task => (
                <TodoItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </>
          )}
          {filtered.length === 0 && (
            <li className="text-center text-sm text-gray-400 py-16">할 일이 없습니다</li>
          )}
        </ul>
      </div>
    </div>
  );
}
