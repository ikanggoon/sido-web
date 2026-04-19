'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import TodoList from './TodoList';

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

type Category = {
  id: string;
  remote_id: string | null;
  name: string;
  hidden: boolean;
  sort_order: number;
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task;
          if (!newTask.deleted) {
            setTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Task;
          if (updated.deleted) {
            setTasks(prev => prev.filter(t => t.id !== updated.id));
          } else {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
          }
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== (payload.old as Task).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as Category].sort((a, b) => a.sort_order - b.sort_order));
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

    channelRef.current = channel;
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
