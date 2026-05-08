import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HealthRecord } from '../types/health';

export function useHealthData(userId?: string) {
  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Safety timeout to prevent indefinite loading (10 seconds)
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Health data fetch exceeding timeout. Forcing loading state to false.');
          setLoading(false);
        }
      }, 10000);

      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);

      if (error) throw error;

      if (data) {
        setLatestRecord(data.length > 0 ? data[0] : null);
        setHistory(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  return { latestRecord, history, loading, error, refetch: fetchData };
}
