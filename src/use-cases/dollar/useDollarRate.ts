'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getStoredRate, setStoredRate, clearStoredRate, isFromToday } from '@/src/shared/utils/dollarRateStorage';

export interface DollarRate {
  compra: number;
  venta: number;
  promedio: number;
  nombre: string;
  fechaActualizacion: string;
}

export function useDollarRate(companyId?: string, initialDollarRate?: DollarRate | null) {
  const [dollarRate, setDollarRate] = useState<DollarRate | null>(initialDollarRate ?? null);
  const [isLoading, setIsLoading] = useState(initialDollarRate ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'official' | 'manual'>('official');

  useEffect(() => {
    // If we have initial data, don't fetch again unless companyId changes
    if (initialDollarRate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource('official');
      return;
    }

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      if (companyId) {
        const stored = getStoredRate(companyId);
        if (stored && isFromToday(stored.date)) {
          if (!cancelled) {
            setDollarRate({
              compra: stored.rate,
              venta: stored.rate,
              promedio: stored.rate,
              nombre: 'Manual',
              fechaActualizacion: stored.date,
            });
            setSource('manual');
            setIsLoading(false);
          }
          return;
        }
        if (stored && !isFromToday(stored.date)) {
          clearStoredRate(companyId);
        }
      }

      try {
        const { data } = await axios.get<DollarRate>('/api/dollar-rate');
        if (!cancelled) {
          setDollarRate(data);
          setSource('official');
        }
      } catch {
        if (!cancelled) {
          setError('Error al obtener la tasa');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [companyId, initialDollarRate]);

  const setManualRate = useCallback((rate: number) => {
    if (!companyId) return;
    setStoredRate(companyId, rate);
    const isoDate = new Date().toISOString().split('T')[0];
    setDollarRate({
      compra: rate,
      venta: rate,
      promedio: rate,
      nombre: 'Manual',
      fechaActualizacion: isoDate,
    });
    setSource('manual');
  }, [companyId]);

  const resetToOfficial = useCallback(async () => {
    if (!companyId) return;
    clearStoredRate(companyId);
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<DollarRate>('/api/dollar-rate');
      setDollarRate(data);
      setSource('official');
    } catch {
      setError('Error al obtener la tasa oficial');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  return { dollarRate, isLoading, error, source, setManualRate, resetToOfficial };
}
