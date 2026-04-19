import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';

export default async function AppPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  return (
    <AppShell
      user={user!}
      initialTasks={tasks ?? []}
      initialCategories={categories ?? []}
    />
  );
}
