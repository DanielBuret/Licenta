import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useStationsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('public:reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['stations'] });
          const stationId =
            (payload.new as { station_id?: number } | null)?.station_id ??
            (payload.old as { station_id?: number } | null)?.station_id;
          if (stationId != null) {
            qc.invalidateQueries({ queryKey: ['station', stationId] });
          }
        },
      )
      .subscribe();

    const stationsChannel = supabase
      .channel('public:stations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, () => {
        qc.invalidateQueries({ queryKey: ['stations'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(stationsChannel);
    };
  }, [qc]);
}
