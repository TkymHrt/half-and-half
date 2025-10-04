'use client';

import { ensureSeed } from '@/lib/mock';
import { useEffect } from 'react';

export function MockDataSeeder() {
  useEffect(() => {
    ensureSeed();
  }, []);

  return null; // This component does not render anything
}