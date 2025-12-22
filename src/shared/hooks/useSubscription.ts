// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from './use-toast';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  billing_period: 'monthly' | 'yearly';
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });

  // Check if user has active subscription
  const hasActiveSubscription = subscription?.status === 'active';
  const isProUser = hasActiveSubscription && subscription?.plan_id.includes('pro');
  const isPremiumUser = hasActiveSubscription && subscription?.plan_id.includes('premium');

  // Get user credits
  const { data: credits } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.credits || 0;
    },
    enabled: !!user,
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error('No active subscription');

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription.id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. You will still have access until the end of your billing period.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Resume subscription mutation
  const resumeSubscription = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error('No subscription to resume');

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', cancelled_at: null })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been reactivated.',
      });
    },
  });

  // Use credits
  const useCredits = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      
      if (credits !== -1 && credits < amount) {
        throw new Error('Insufficient credits');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          credits: credits === -1 ? -1 : credits - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (error) => {
      toast({
        title: 'Credit Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    subscription,
    hasActiveSubscription,
    isProUser,
    isPremiumUser,
    credits: credits || 0,
    hasUnlimitedCredits: credits === -1,
    isLoading,
    error,
    cancelSubscription: cancelSubscription.mutate,
    resumeSubscription: resumeSubscription.mutate,
    useCredits: useCredits.mutate,
  };
};
