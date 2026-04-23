'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const SYNC_CHANNEL = (uid: string) => `sido-sync-${uid}`;

export default function AppShell({ user, initialTasks, initialCategories }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const refetch = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tasks').select('*').order('position'),
      supabase.from('categories').select('*').order('position'),
    ]);
    if (t) setTasks(t as Task[]);
    if (c) setCategories(c as Category[]);
    setSyncStatus('synced');
  }, [supabase]);

  const broadcastRefresh = useCallback(async (deletedIds: string[] = []) => {
    await supabase.channel(SYNC_CHANNEL(user.id)).send({
      type: 'broadcast', event: 'refresh',
      payload: { deleted_ids: deletedIds },
    });
  }, [supabase, user.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const channel = supabase
      .channel(SYNC_CHANNEL(user.id))
      .on('broadcast', { event: 'refresh' }, () => {
        setSyncStatus('syncing');
        refetch();
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
          onBroadcast={broadcastRefresh}
        />
      </main>
    </div>
  );
}
