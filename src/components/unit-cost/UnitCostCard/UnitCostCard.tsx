'use client';

import { formatUSD, formatBs, formatNumber } from '@/src/shared/utils/numberUtils';
import type { UnitCostResult } from '@/src/domain/repositories/IUnitCostRepository';
import './UnitCostCard.css';

interface UnitCostCardProps {
  data: UnitCostResult & { batchStatus?: string; totalServicesSold?: number };
  variant?: 'batch' | 'product' | 'service';
}

const BATCH_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completado',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  CANCELLED: 'Cancelado',
};

export default function UnitCostCard({ data, variant = 'product' }: UnitCostCardProps) {
  return (
    <div className="unit-cost-card__grid">
      <div className="unit-cost-card">
        <div className="unit-cost-card__header">
          <div className="unit-cost-card__icon unit-cost-card__icon--cost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="unit-cost-card__currency-badge">$</span>
        </div>
        <span className="unit-cost-card__label">Costo Total</span>
        <span className="unit-cost-card__primary">{formatUSD(data.totalCostUSD)}</span>
      </div>

      <div className="unit-cost-card">
        <div className="unit-cost-card__header">
          <div className="unit-cost-card__icon unit-cost-card__icon--cost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="unit-cost-card__currency-badge unit-cost-card__currency-badge--bs">Bs</span>
        </div>
        <span className="unit-cost-card__label">Costo Total</span>
        <span className="unit-cost-card__primary">{formatBs(data.totalCostBs)}</span>
      </div>

      {variant !== 'service' && (
      <div className="unit-cost-card">
        <div className="unit-cost-card__header">
          <div className="unit-cost-card__icon unit-cost-card__icon--qty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </div>
          <span className="unit-cost-card__badge">Unds</span>
        </div>
        <span className="unit-cost-card__label">Cantidad</span>
        <span className="unit-cost-card__primary">{formatNumber(data.totalQuantity, 0)}</span>
      </div>
      )}

      <div className="unit-cost-card unit-cost-card--highlight">
        <div className="unit-cost-card__glow" />
        <div className="unit-cost-card__header">
          <div className="unit-cost-card__icon unit-cost-card__icon--unit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M21 12a9 9 0 1 1-9-9" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="unit-cost-card__currency-badge">$</span>
        </div>
        <span className="unit-cost-card__label">Costo Unitario</span>
        <span className="unit-cost-card__primary unit-cost-card__primary--accent">
          {formatUSD(data.weightedAvgUnitCostUSD)}
        </span>
      </div>

      <div className="unit-cost-card unit-cost-card--highlight">
        <div className="unit-cost-card__glow" />
        <div className="unit-cost-card__header">
          <div className="unit-cost-card__icon unit-cost-card__icon--unit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M21 12a9 9 0 1 1-9-9" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span className="unit-cost-card__currency-badge unit-cost-card__currency-badge--bs">Bs</span>
        </div>
        <span className="unit-cost-card__label">Costo Unitario</span>
        <span className="unit-cost-card__primary unit-cost-card__primary--accent">
          {formatBs(data.weightedAvgUnitCostBs)}
        </span>
      </div>

      {variant === 'batch' && data.batchStatus && (
        <div className="unit-cost-card">
          <div className="unit-cost-card__header">
            <div className="unit-cost-card__icon unit-cost-card__icon--qty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="unit-cost-card__badge">Estado</span>
          </div>
          <span className="unit-cost-card__label">Status del Lote</span>
          <span className="unit-cost-card__primary" style={{ fontSize: '1.125rem' }}>
            {BATCH_STATUS_LABELS[data.batchStatus] ?? data.batchStatus}
          </span>
        </div>
      )}

      {variant === 'service' && (
        <div className="unit-cost-card">
          <div className="unit-cost-card__header">
            <div className="unit-cost-card__icon unit-cost-card__icon--qty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="unit-cost-card__badge">Servicios</span>
          </div>
          <span className="unit-cost-card__label">Servicios Vendidos</span>
          <span className="unit-cost-card__primary">{formatNumber(data.totalServicesSold ?? 0, 0)}</span>
        </div>
      )}
    </div>
  );
}