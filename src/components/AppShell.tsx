'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import TodoList from './TodoList';

export type Task = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  detail: string | null;
  priority: string;
  due: string | null;
  is_done: boolean;
  done_date: string | null;
  position: number;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  hidden: boolean;
  position: number;
  updated_at: string;
};

type Props = {
  user: User;
  initialTasks: Task[];
  initialCategories: Category[];
};

export default function AppShell({ user, initialTasks, initialCategories }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const uid = (payload.new as Task)?.user_id ?? (payload.old as Task)?.user_id;
        if (uid && uid !== user.id) return;
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev.filter(t => t.id !== (payload.new as Task).id)]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === (payload.new as Task).id ? payload.new as Task : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== (payload.old as Task).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        const uid = (payload.new as Category)?.user_id ?? (payload.old as Category)?.user_id;
        if (uid && uid !== user.id) return;
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as Category].sort((a, b) => a.position - b.position));
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === (payload.new as Category).id ? payload.new as Category : c));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== (payload.old as Category).id));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSyncStatus('synced');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('error');
      });

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        categories={categories}
        tasks={tasks}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        user={user}
        syncStatus={syncStatus}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-hidden">
        <TodoList
          tasks={tasks}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          userId={user.id}
          onTasksChange={setTasks}
          onSyncStart={() => setSyncStatus('syncing')}
          onSyncEnd={(ok) => setSyncStatus(ok ? 'synced' : 'error')}
        />
      </main>
    </div>
  );
}
