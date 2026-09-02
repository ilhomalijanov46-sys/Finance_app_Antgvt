import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { Goal } from '../types';

export const goalService = {
  getAll: async (userId: string): Promise<Goal[]> => {
    // If Demo user mode
    if (userId === 'demo-user-777' || !isSupabaseConfigured || !supabase) {
      return localDemoStore.getGoals();
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error('Failed to fetch goals from Supabase:', error);
      throw error;
    }

    return (data as Goal[]) || [];
  },

  create: async (goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal> => {
    if (isSupabaseConfigured && supabase && goal.user_id !== 'demo-user-777') {
      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (error) {
        console.error('Failed to create goal in Supabase:', error);
        throw error;
      }

      if (data) {
        return data as Goal;
      }
    }

    // Fallback for Demo mode
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
    if (!isDemoContext() && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update goal in Supabase:', error);
        throw error;
      }

      if (!data) throw new Error('Goal not found');
      return data as Goal;
    }

    // Demo mode
    const current = localDemoStore.getGoals();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setGoals(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Goal not found');
    return result;
  },

  deposit: async (id: string, amount: number): Promise<{ goal: Goal; applied: number }> => {
    let goal: Goal | undefined;
    if (!isDemoContext() && supabase) {
      const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
      if (error) {
        console.error('Failed to read goal from Supabase:', error);
        throw error;
      }
      goal = data as Goal;
    } else {
      goal = localDemoStore.getGoals().find((g) => g.id === id);
    }

    if (!goal) throw new Error('Goal not found');

    const previousAmount = Number(goal.current_amount || 0);
    const newAmount = Math.min(goal.target_amount, previousAmount + amount);
    const updated = await goalService.update(id, { current_amount: newAmount });
    return { goal: updated, applied: newAmount - previousAmount };
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext() && supabase) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete goal in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getGoals();
    localDemoStore.setGoals(current.filter((item) => item.id !== id));
  },
};
