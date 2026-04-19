import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';

export default async function AppPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .order('position', { ascending: true }),
  ]);

  return (
    <AppShell
      user={user!}
      initialTasks={tasks ?? []}
      initialCategories={categories ?? []}
    />
  );
}
