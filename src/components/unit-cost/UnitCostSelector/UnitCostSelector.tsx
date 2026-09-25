'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useItemList } from '@/src/use-cases/item/useItemList';
import { useBatchList } from '@/src/use-cases/batch/useBatchList';
import './UnitCostSelector.css';

export type UnitCostView = 'batch' | 'product' | 'service';

interface UnitCostSelectorProps {
  view: UnitCostView;
  onViewChange: (view: UnitCostView) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  companyId: string;
  disabled?: boolean;
}

interface TabOption {
  key: UnitCostView;
  label: string;
}

const TABS: TabOption[] = [
  { key: 'batch', label: 'Lotes' },
  { key: 'product', label: 'Productos' },
  { key: 'service', label: 'Servicios' },
];

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  loading,
  error,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  loading: boolean;
  error: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const term = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((id: string) => {
    onChange(id);
    setIsOpen(false);
    setQuery('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    if (!disabled) setIsOpen(true);
  }, [disabled]);

  return (
    <div className="unit-cost-selector__field">
      <label className="unit-cost-selector__label">{label}</label>
      {loading ? (
        <div className="unit-cost-selector__loading">Cargando opciones…</div>
      ) : error ? (
        <div className="unit-cost-selector__error">{error}</div>
      ) : (
        <div className="unit-cost-selector__search" ref={containerRef}>
          <div className="unit-cost-selector__input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className={`unit-cost-selector__input${disabled ? ' unit-cost-selector__input--disabled' : ''}`}
              placeholder={value ? selectedLabel : placeholder}
              value={query}
              disabled={disabled}
              onFocus={handleInputFocus}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
            />
            {value && !disabled && (
              <button
                type="button"
                className="unit-cost-selector__clear"
                onClick={handleClear}
                aria-label="Limpiar selección"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {isOpen && !disabled && (
            <div className="unit-cost-selector__dropdown">
              {filtered.length > 0 ? (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`unit-cost-selector__option${opt.value === value ? ' unit-cost-selector__option--selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <div className="unit-cost-selector__dropdown-empty">
                  No se encontraron resultados
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatBatchDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export default function UnitCostSelector({
  view,
  onViewChange,
  selectedId,
  onSelect,
  companyId,
  disabled,
}: UnitCostSelectorProps) {
  const { items: products, isLoading: productsLoading, error: productsError } = useItemList(companyId, 'PRODUCT');
  const { items: services, isLoading: servicesLoading, error: servicesError } = useItemList(companyId, 'SERVICE');
  const { batches, isLoading: batchesLoading, error: batchesError } = useBatchList(companyId);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products],
  );
  const serviceOptions = useMemo(
    () => services.map((s) => ({ value: s.id, label: s.name })),
    [services],
  );
  const batchOptions = useMemo(
    () => batches.map((b) => ({
      value: b.id,
      label: b.item?.name
        ? `${b.item.name} — ${b.quantity} uds — ${formatBatchDate(b.batchDate)}`
        : `Lote ${b.id.slice(0, 8)}`,
    })),
    [batches],
  );

  return (
    <div className="unit-cost-selector">
      <div className="unit-cost-selector__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={view === tab.key}
            className={`unit-cost-selector__tab${view === tab.key ? ' unit-cost-selector__tab--active' : ''}`}
            onClick={() => onViewChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="unit-cost-selector__body">
        {view === 'batch' && (
          <SearchableSelect
            label="Lote"
            value={selectedId}
            options={batchOptions}
            placeholder="Buscar lote…"
            loading={batchesLoading}
            error={batchesError}
            onChange={onSelect}
            disabled={disabled}
          />
        )}
        {view === 'product' && (
          <SearchableSelect
            label="Producto"
            value={selectedId}
            options={productOptions}
            placeholder="Buscar producto…"
            loading={productsLoading}
            error={productsError}
            onChange={onSelect}
            disabled={disabled}
          />
        )}
        {view === 'service' && (
          <SearchableSelect
            label="Servicio"
            value={selectedId}
            options={serviceOptions}
            placeholder="Buscar servicio…"
            loading={servicesLoading}
            error={servicesError}
            onChange={onSelect}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
