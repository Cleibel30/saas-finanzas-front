'use client';

import { useState, useCallback, useMemo } from 'react';
import { startOfMonth, format } from 'date-fns';
import { useUnitCostByBatch } from '@/src/use-cases/unit-cost/useUnitCostByBatch';
import { useUnitCostByProduct } from '@/src/use-cases/unit-cost/useUnitCostByProduct';
import { useUnitCostByService } from '@/src/use-cases/unit-cost/useUnitCostByService';
import UnitCostCard from '@/src/components/unit-cost/UnitCostCard';
import UnitCostFilters from '@/src/components/unit-cost/UnitCostFilters';
import UnitCostChart from '@/src/components/unit-cost/UnitCostChart';
import UnitCostSelector, { type UnitCostView } from '@/src/components/unit-cost/UnitCostSelector';
import { PriceMarginModal } from '@/src/components/unit-cost/PriceMarginModal';
import Modal from '@/src/components/shared/Modal';
import type { ChartDataPoint, UnitCostProductResult, UnitCostServiceResult, UnitCostResult } from '@/src/domain/repositories/IUnitCostRepository';
import './UnitCostScreen.css';

interface UnitCostScreenProps {
  companyId: string;
}

function Skeleton() {
  return (
    <div className='unit-cost-screen'>
      <div className='unit-cost-screen__header'>
        <div className='unit-cost-screen__skeleton' style={{ width: 200, height: 28 }} />
        <div className='unit-cost-screen__skeleton' style={{ width: 300, height: 16, marginTop: 8 }} />
      </div>
      <div className='unit-cost-screen__section'>
        <div className='unit-cost-card__grid'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='unit-cost-screen__skeleton-card'>
              <div className='unit-cost-screen__skeleton' style={{ width: 80, height: 11, marginBottom: 12 }} />
              <div className='unit-cost-screen__skeleton' style={{ width: 120, height: 24, marginBottom: 4 }} />
              <div className='unit-cost-screen__skeleton' style={{ width: 90, height: 13 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className='unit-cost-screen'>
      <div className='unit-cost-screen__error'>
        <svg className='unit-cost-screen__error-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' width='40' height='40'>
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
        <p className='unit-cost-screen__error-text'>{message}</p>
        <button className='unit-cost-screen__error-btn' onClick={onRetry}>
          Reintentar
        </button>
      </div>
    </div>
  );
}

const today = new Date();
const defaultStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
const defaultEndDate = format(today, 'yyyy-MM-dd');

export default function UnitCostScreen({ companyId }: UnitCostScreenProps) {
  const [view, setView] = useState<UnitCostView>('batch');
  const [selectedId, setSelectedId] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const isBatch = view === 'batch';

  const {
    data: batchData,
    isLoading: batchCostLoading,
    error: batchCostError,
    refetch: refetchBatch,
  } = useUnitCostByBatch(isBatch ? selectedId || undefined : undefined, companyId, startDate, endDate);

  const {
    data: productData,
    isLoading: productCostLoading,
    error: productCostError,
    refetch: refetchProduct,
  } = useUnitCostByProduct(
    view === 'product' ? selectedId || undefined : undefined,
    companyId,
    startDate,
    endDate,
  );

  const {
    data: serviceData,
    isLoading: serviceCostLoading,
    error: serviceCostError,
    refetch: refetchService,
  } = useUnitCostByService(
    view === 'service' ? selectedId || undefined : undefined,
    companyId,
    startDate,
    endDate,
  );

  const handleRetry = useCallback(() => {
    if (isBatch) refetchBatch();
    else if (view === 'product') refetchProduct();
    else refetchService();
  }, [isBatch, view, refetchBatch, refetchProduct, refetchService]);

  const handleViewChange = useCallback((nextView: UnitCostView) => {
    setView(nextView);
    setSelectedId('');
  }, []);

  const handleItemSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const currentData = isBatch ? batchData : view === 'product' ? productData : serviceData;
  const currentLoading = isBatch ? batchCostLoading : view === 'product' ? productCostLoading : serviceCostLoading;
  const currentError = isBatch ? batchCostError : view === 'product' ? productCostError : serviceCostError;

const hasSelection = !!selectedId;

  const [isPriceMarginOpen, setIsPriceMarginOpen] = useState(false);
  const [selectedUnitCostData, setSelectedUnitCostData] = useState<(UnitCostResult & { batchStatus?: string; totalServicesSold?: number }) | null>(null);

  const openPriceMargin = useCallback((data: UnitCostResult & { batchStatus?: string; totalServicesSold?: number }) => {
    setSelectedUnitCostData(data);
    setIsPriceMarginOpen(true);
  }, []);

  const closePriceMargin = useCallback(() => {
    setIsPriceMarginOpen(false);
    setSelectedUnitCostData(null);
  }, []);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!currentData) return [];
    if (view === 'product' && 'chartData' in currentData) return (currentData as UnitCostProductResult).chartData ?? [];
    if (view === 'service' && 'chartData' in currentData) return (currentData as UnitCostServiceResult).chartData ?? [];
    return [];
  }, [currentData, view]);

  const chartIsValid = useMemo(() => {
    if (!currentData) return true;
    if (view === 'product' && 'isValid' in currentData) return (currentData as UnitCostProductResult).isValid ?? true;
    if (view === 'service' && 'isValid' in currentData) return (currentData as UnitCostServiceResult).isValid ?? true;
    return true;
  }, [currentData, view]);

  const variant = isBatch ? 'batch' : view === 'service' ? 'service' : 'product';

  if (batchCostLoading && !currentData) return <Skeleton />;

  if (currentError && !currentData && hasSelection) {
    return (
      <ErrorState
        message={currentError ?? 'No se pudieron cargar los datos'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className='unit-cost-screen'>
      <div className='unit-cost-screen__header'>
        <h1 className='unit-cost-screen__title'>Costo Unitario</h1>
        <p className='unit-cost-screen__subtitle'>
          Análisis de costo por unidad por lote, producto o servicio.
        </p>
      </div>

      <div className='unit-cost-screen__filters-wrapper'>
        <UnitCostFilters startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
      </div>

      <UnitCostSelector
        view={view}
        onViewChange={handleViewChange}
        selectedId={selectedId}
        onSelect={handleItemSelect}
        companyId={companyId}
      />

      <div className='unit-cost-screen__section'>
        {currentLoading && hasSelection ? (
          <div className='unit-cost-card__grid'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className='unit-cost-screen__skeleton-card'>
                <div className='unit-cost-screen__skeleton' style={{ width: 80, height: 11, marginBottom: 12 }} />
                <div className='unit-cost-screen__skeleton' style={{ width: 120, height: 24, marginBottom: 4 }} />
                <div className='unit-cost-screen__skeleton' style={{ width: 90, height: 13 }} />
              </div>
            ))}
          </div>
) : currentData ? (
          <>
            <div className='unit-cost-screen__item-header'>
              <div className='unit-cost-screen__item-info'>
                <span className='unit-cost-screen__item-label'>
                  {isBatch ? 'Lote de producci\u00f3n' : view === 'product' ? 'Producto' : 'Servicio'}
                </span>
                <span className='unit-cost-screen__item-name'>{currentData.itemName}</span>
              </div>
              <button
                className='unit-cost-screen__action-btn'
                onClick={() => openPriceMargin(currentData)}
                aria-label='Calcular precio con margen'
              >
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                </svg>
                <span>Calcular precio con margen</span>
              </button>
            </div>
            <UnitCostCard data={currentData} variant={variant} />
          </>
        ) : (
          <div className='unit-cost-screen__placeholder'>
            {isBatch
              ? 'Selecciona un lote para ver su costo unitario.'
              : 'Selecciona un producto o servicio para ver su costo unitario.'}
          </div>
        )}
      </div>

{!isBatch && hasSelection && currentData && (
        <div className='unit-cost-screen__section'>
          <UnitCostChart
            data={chartData}
            isValid={chartIsValid}
            isLoading={currentLoading}
          />
        </div>
      )}

      <Modal open={isPriceMarginOpen} onClose={closePriceMargin} title='Calcular Precio con Margen'>
        <PriceMarginModal
          data={selectedUnitCostData}
          variant={variant}
          onClose={closePriceMargin}
        />
      </Modal>
    </div>
  );
}
