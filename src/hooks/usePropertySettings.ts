import { useEffect, useState } from 'react';
import { contact as fallbackContact } from '@/data/site';
import { supabase } from '@/lib/supabase';
import { subscribeToPropertyDataChanges } from '@/lib/propertyDataEvents';

export function usePropertySettings() {
  const [contact, setContact] = useState(fallbackContact);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('property_settings')
          .select('contact_email, contact_phone, contact_address')
          .eq('id', 1)
          .maybeSingle();
        if (!active) return;
        if (error) throw new Error(`Could not load property contact settings: ${error.message}`);
        if (!data) return;
        setContact({
          email: data.contact_email,
          phone: data.contact_phone,
          address: data.contact_address,
        });
      } catch (cause) {
        if (active) console.error(cause instanceof Error ? cause.message : 'Could not load property contact settings.');
      }
    };
    void loadSettings();
    const unsubscribe = subscribeToPropertyDataChanges(() => { void loadSettings(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  return contact;
}
