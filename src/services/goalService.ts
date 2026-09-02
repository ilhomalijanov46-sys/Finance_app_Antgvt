import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { Goal } from '../types';

export const goalService = {
  getAll: async (userId: string): Promise<Goal[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Goal[];
      }
    }
    // Fallback
    return localDemoStore.getGoals().filter((g) => !userId || g.user_id === userId || userId === 'demo-user-777');
  },

  create: async (goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (!error && data) {
        return data as Goal;
      }
    }
    // Fallback
    const newGoal: Goal = {
      ...goal,
      id: 'goal-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getGoals();
    localDemoStore.setGoals([newGoal, ...current]);
    return newGoal;
  },

  update: async (id: string, updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>): Promise<Goal> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Goal;
      }
    }
    // Fallback
    const current = localDemoStore.getGoals();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setGoals(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Goal not found');
    return result;
  },

  // Returns the updated goal together with the amount that was actually credited to it.
  // A deposit is capped at the goal's target, so the caller must know the real figure —
  // charging the requested amount instead would silently lose the surplus.
  deposit: async (id: string, amount: number): Promise<{ goal: Goal; applied: number }> => {
    let goal: Goal | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
      if (!error && data) {
        goal = data as Goal;
      }
    }

    // Fall back to the local store whenever the remote lookup produced nothing — the same
    // shape every other method here uses. Reading it only in an `else` branch meant that a
    // configured but empty Supabase made every deposit throw "Goal not found", because the
    // demo goals exist only in local storage.
    if (!goal) {
      goal = localDemoStore.getGoals().find((g) => g.id === id);
    }

    if (!goal) throw new Error('Goal not found');

    const previousAmount = Number(goal.current_amount || 0);
    const newAmount = Math.min(goal.target_amount, previousAmount + amount);
    const updated = await goalService.update(id, { current_amount: newAmount });
    return { goal: updated, applied: newAmount - previousAmount };
  },

  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (!error) return;
    }
    // Fallback
    const current = localDemoStore.getGoals();
    localDemoStore.setGoals(current.filter((item) => item.id !== id));
  },
};
