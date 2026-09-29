'use client';

import { useState, useMemo, useCallback } from 'react';
import { divide, formatUSD, formatBs } from '@/src/shared/utils/numberUtils';
import type { UnitCostResult } from '@/src/domain/repositories/IUnitCostRepository';
import './PriceMarginModal.css';

export interface PriceMarginModalProps {
  data: (UnitCostResult & { batchStatus?: string; totalServicesSold?: number }) | null;
  variant: 'batch' | 'product' | 'service';
  onClose: () => void;
}

const VARIANT_LABELS: Record<string, string> = {
  batch: 'Lote de producción',
  product: 'Producto',
  service: 'Servicio',
};

export default function PriceMarginModal({ data, variant, onClose }: PriceMarginModalProps) {
  const [inputValue, setInputValue] = useState('30');
  const [marginPercent, setMarginPercent] = useState(30);

  const unitCostUSD = data?.weightedAvgUnitCostUSD ?? 0;
  const unitCostBs = data?.weightedAvgUnitCostBs ?? 0;

  const { suggestedUSD, suggestedBs, isValid } = useMemo(() => {
    const margin = marginPercent / 100;
    const divisor = 1 - margin;
    if (divisor <= 0 || unitCostUSD <= 0 || unitCostBs <= 0) {
      return { suggestedUSD: Infinity, suggestedBs: Infinity, isValid: false };
    }
    return {
      suggestedUSD: divide(unitCostUSD, divisor),
      suggestedBs: divide(unitCostBs, divisor),
      isValid: true,
    };
  }, [marginPercent, unitCostUSD, unitCostBs]);

  const handleMarginChange = useCallback((value: string) => {
    setInputValue(value);
    if (value === '' || value === '-') {
      setMarginPercent(0);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setMarginPercent(num);
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (inputValue === '' || inputValue === '-') {
      setInputValue('0');
      setMarginPercent(0);
    }
  }, [inputValue]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  if (!data) return null;

  return (
    <div className='price-margin-modal'>
      <div className='price-margin-modal__header'>
        <div className='price-margin-modal__item-info'>
          <span className='price-margin-modal__item-type'>{VARIANT_LABELS[variant]}</span>
          <h3 className='price-margin-modal__item-name'>{data.itemName}</h3>
        </div>
      </div>

      <div className='price-margin-modal__section price-margin-modal__section--costs'>
        <div className='price-margin-modal__cost-row'>
          <span className='price-margin-modal__cost-label'>Costo Unitario</span>
          <span className='price-margin-modal__cost-value price-margin-modal__cost-value--usd'>{formatUSD(unitCostUSD)}</span>
        </div>
        <div className='price-margin-modal__cost-row'>
          <span className='price-margin-modal__cost-label'>Costo Unitario (Bs)</span>
          <span className='price-margin-modal__cost-value price-margin-modal__cost-value--bs'>{formatBs(unitCostBs)}</span>
        </div>
      </div>

      <div className='price-margin-modal__section price-margin-modal__section--input'>
        <label className='price-margin-modal__input-label' htmlFor='margin-input'>
          Margen de ganancia (%)
        </label>
        <div className='price-margin-modal__input-wrapper'>
          <input
            id='margin-input'
            type='number'
            className='price-margin-modal__input'
            value={inputValue}
            onChange={(e) => handleMarginChange(e.target.value)}
            onBlur={handleBlur}
            min='0'
            step='0.1'
            aria-label='Margen de ganancia en porcentaje'
            inputMode='decimal'
          />
          <span className='price-margin-modal__input-suffix'>%</span>
        </div>
      </div>

      <div className='price-margin-modal__section price-margin-modal__section--results'>
        <div className='price-margin-modal__result-row'>
          <span className='price-margin-modal__result-label'>Precio Sugerido</span>
          <div className='price-margin-modal__result-value-wrapper'>
            <span className={`price-margin-modal__result-value price-margin-modal__result-value--usd ${!isValid ? 'price-margin-modal__result-value--invalid' : ''}`}>
              {isValid ? formatUSD(suggestedUSD) : '—'}
            </span>
            {isValid && suggestedUSD !== Infinity && (
              <button
                className='price-margin-modal__copy-btn'
                onClick={() => copyToClipboard(formatUSD(suggestedUSD))}
                aria-label='Copiar precio USD'
                title='Copiar'
              >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                  <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className='price-margin-modal__result-row'>
          <span className='price-margin-modal__result-label'>Precio Sugerido (Bs)</span>
          <div className='price-margin-modal__result-value-wrapper'>
            <span className={`price-margin-modal__result-value price-margin-modal__result-value--bs ${!isValid ? 'price-margin-modal__result-value--invalid' : ''}`}>
              {isValid ? formatBs(suggestedBs) : '—'}
            </span>
            {isValid && suggestedBs !== Infinity && (
              <button
                className='price-margin-modal__copy-btn'
                onClick={() => copyToClipboard(formatBs(suggestedBs))}
                aria-label='Copiar precio Bs'
                title='Copiar'
              >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                  <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='price-margin-modal__footer'>
        <button className='price-margin-modal__close-btn' onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}