import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ScheduledDays } from '../types/product';

interface ProductSchedule {
  id: string;
  product_id: string;
  enabled: boolean;
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export const useProductScheduling = () => {
  const [schedules, setSchedules] = useState<Record<string, ProductSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_schedules')
        .select('*');

      if (error) throw error;

      // Converter array para objeto indexado por product_id
      const schedulesMap = (data || []).reduce((acc, schedule) => {
        acc[schedule.product_id] = schedule;
        return acc;
      }, {} as Record<string, ProductSchedule>);

      setSchedules(schedulesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar programações');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProductSchedule = useCallback(async (productId: string, scheduledDays: ScheduledDays) => {
    try {
      const { data, error } = await supabase
        .from('product_schedules')
        .upsert({
          product_id: productId,
          enabled: scheduledDays.enabled,
          days: scheduledDays.days,
          start_time: scheduledDays.startTime || '00:00',
          end_time: scheduledDays.endTime || '23:59',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      setSchedules(prev => ({
        ...prev,
        [productId]: data
      }));

      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao salvar programação');
    }
  }, []);

  const getProductSchedule = useCallback((productId: string): ScheduledDays | null => {
    const schedule = schedules[productId];
    if (!schedule) return null;

    return {
      enabled: schedule.enabled,
      days: schedule.days,
      startTime: schedule.start_time,
      endTime: schedule.end_time
    };
  }, [schedules]);

  const deleteProductSchedule = useCallback(async (productId: string) => {
    try {
      const { error } = await supabase
        .from('product_schedules')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      // Remover do estado local
      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[productId];
        return newSchedules;
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir programação');
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    saveProductSchedule,
    getProductSchedule,
    deleteProductSchedule,
    refetch: fetchSchedules
  };
};