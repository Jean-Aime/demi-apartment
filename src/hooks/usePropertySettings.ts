import { useEffect, useState } from 'react';
import { contact as fallbackContact } from '@/data/site';
import { supabase } from '@/lib/supabase';

export function usePropertySettings() {
  const [contact, setContact] = useState(fallbackContact);

  useEffect(() => {
    let active = true;
    if (!supabase) return;
    supabase
      .from('property_settings')
      .select('contact_email, contact_phone, contact_address')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error(`Could not load property contact settings: ${error.message}`);
          return;
        }
        if (!data) return;
        setContact({
          email: data.contact_email,
          phone: data.contact_phone,
          address: data.contact_address,
        });
      });
    return () => { active = false; };
  }, []);

  return contact;
}
