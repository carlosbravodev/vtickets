import { supabase } from '$lib/supabase';

export const load = async () => {
  const { data: events, error } = await supabase.from('events').select('*');

  if (error) {
    console.error('Error fetching events:', error);
    return { events: [], error: error.message };
  }

  return {
    events,
    error: null
  };
};
