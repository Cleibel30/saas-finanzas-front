'use client';

import { useEffect, useState, useCallback } from 'react';
import { startOfMonth, format } from 'date-fns';
import { useSession } from '@/src/use-cases/auth/useSession';
import { UnitCostRepositoryImpl } from '@/src/infrastructure/repositories/UnitCostRepositoryImpl';
import type { UnitCostResult, UnitCostServiceResult } from '@/src/domain/repositories/IUnitCostRepository';

const today = new Date();
const defaultStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
const defaultEndDate = format(today, 'yyyy-MM-dd');

interface UnitCostByServiceState {
  data: (UnitCostResult & { chartData?: UnitCostServiceResult['chartData']; isValid?: boolean; totalServicesSold?: number }) | null;
  isLoading: boolean;
  error: string | null;
}

export function useUnitCostByService(
  itemId: string | undefined,
  companyId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  const { session, isAuthenticated, isLoading: sessionLoading } = useSession();
  const [state, setState] = useState<UnitCostByServiceState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchByService = useCallback(async (): Promise<UnitCostResult | null> => {
    if (!session || !isAuthenticated || !companyId || !itemId) return null;

    const token = (session as { access_token: string }).access_token;
    const repo = new UnitCostRepositoryImpl(token);

    // Siempre usar endpoint con date range
    const start = startDate ?? defaultStartDate;
    const end = endDate ?? defaultEndDate;
    return repo.getByServiceWithDateRange(itemId, companyId, start, end);
  }, [session, isAuthenticated, companyId, itemId, startDate, endDate]);

  const refetch = useCallback(() => {
    void (async () => {
      if (!session || !isAuthenticated || !companyId || !itemId) {
        setState({ data: null, isLoading: false, error: null });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetchByService();
        setState({ data, isLoading: false, error: null });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al cargar costo unitario por servicio';
        setState({ data: null, isLoading: false, error: message });
      }
    })();
  }, [session, isAuthenticated, companyId, itemId, fetchByService]);

  useEffect(() => {
    if (!sessionLoading) {
      void refetch();
    }
  }, [sessionLoading, refetch]);

  return { ...state, refetch };
}
