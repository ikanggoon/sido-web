'use client';

import { createClient } from '@/lib/supabase/client';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';

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

type Category = { id: string; name: string };

type Props = {
  tasks: Task[];
  categories: Category[];
  selectedCategoryId: string | null;
  userId: string;
  onTasksChange: (updater: (prev: Task[]) => Task[]) => void;
  onSyncStart: () => void;
  onSyncEnd: (ok: boolean) => void;
};

export default function TodoList({ tasks, categories, selectedCategoryId, userId, onTasksChange, onSyncStart, onSyncEnd }: Props) {
  const supabase = createClient();

  const filtered = tasks.filter(t =>
    !t.deleted &&
    (selectedCategoryId === null || t.category_id === selectedCategoryId)
  );

  const active = filtered.filter(t => !t.done);
  const done = filtered.filter(t => t.done);

  const categoryName = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)?.name ?? '카테고리'
    : '전체';

  const handleToggle = async (task: Task) => {
    const newDone = !task.done;
    onTasksChange(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t));
    onSyncStart();
    const { error } = await supabase
      .from('tasks')
      .update({ done: newDone, updated_at: new Date().toISOString(), dirty: true })
      .eq('id', task.id);
    onSyncEnd(!error);
  };

  const handleDelete = async (task: Task) => {
    onTasksChange(prev => prev.filter(t => t.id !== task.id));
    onSyncStart();
    const { error } = await supabase
      .from('tasks')
      .update({ deleted: true, updated_at: new Date().toISOString(), dirty: true })
      .eq('id', task.id);
    onSyncEnd(!error);
  };

  const handleAdd = async (title: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      remote_id: null,
      title,
      done: false,
      category_id: selectedCategoryId,
      due_date: null,
      priority: 0,
      deleted: false,
      updated_at: new Date().toISOString(),
    };
    onTasksChange(prev => [newTask, ...prev]);
    onSyncStart();
    const { error } = await supabase
      .from('tasks')
      .insert({ ...newTask, user_id: userId, dirty: true });
    onSyncEnd(!error);
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
