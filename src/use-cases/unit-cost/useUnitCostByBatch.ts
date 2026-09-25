'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/src/use-cases/auth/useSession';
import { UnitCostRepositoryImpl } from '@/src/infrastructure/repositories/UnitCostRepositoryImpl';
import type { UnitCostResult } from '@/src/domain/repositories/IUnitCostRepository';

interface UnitCostByBatchState {
  data: UnitCostResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useUnitCostByBatch(
  batchId: string | undefined,
  companyId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  const { session, isAuthenticated, isLoading: sessionLoading } = useSession();
  const [state, setState] = useState<UnitCostByBatchState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchByBatch = useCallback(async (): Promise<UnitCostResult | null> => {
    if (!session || !isAuthenticated || !companyId || !batchId) return null;

    const token = (session as { access_token: string }).access_token;
    const repo = new UnitCostRepositoryImpl(token);

    return repo.getByBatch(batchId, companyId, startDate, endDate);
  }, [session, isAuthenticated, companyId, batchId, startDate, endDate]);

  const refetch = useCallback(() => {
    void (async () => {
      if (!session || !isAuthenticated || !companyId || !batchId) {
        setState({ data: null, isLoading: false, error: null });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetchByBatch();
        setState({ data, isLoading: false, error: null });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al cargar costo unitario por lote';
        setState({ data: null, isLoading: false, error: message });
      }
    })();
  }, [session, isAuthenticated, companyId, batchId, fetchByBatch]);

  useEffect(() => {
    if (!sessionLoading) {
      void refetch();
    }
  }, [sessionLoading, refetch]);

  return { ...state, refetch };
}
