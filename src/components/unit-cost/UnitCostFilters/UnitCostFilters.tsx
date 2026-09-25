'use client';

import { useState, useMemo } from 'react';
import { subDays, subMonths, startOfMonth, format, addDays, parse, differenceInCalendarDays } from 'date-fns';
import { formatPeriodLabel } from '@/src/shared/utils/dateUtils';
import './UnitCostFilters.css';

const MAX_RANGE_DAYS = 730;

interface UnitCostFiltersProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

interface QuickRange {
  key: string;
  label: string;
  start: string;
  end: string;
}

function buildQuickRange(key: string, label: string, start: Date, end: Date): QuickRange {
  return { key, label, start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}

function getQuickRanges(): QuickRange[] {
  const end = new Date();
  return [
    buildQuickRange('month', 'Este mes', startOfMonth(end), end),
    buildQuickRange('7d', 'Últimos 7 días', subDays(end, 6), end),
    buildQuickRange('15d', 'Últimos 15 días', subDays(end, 14), end),
    buildQuickRange('30d', 'Últimos 30 días', subDays(end, 29), end),
    buildQuickRange('3m', 'Últimos 3 meses', subMonths(end, 3), end),
    buildQuickRange('6m', 'Últimos 6 meses', subMonths(end, 6), end),
  ];
}

export default function UnitCostFilters({ startDate, endDate, onChange }: UnitCostFiltersProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const ranges = getQuickRanges();
  const activeKey = ranges.find((r) => r.start === startDate && r.end === endDate)?.key;

  const maxEndDate = useMemo(() => {
    if (!localStart) return '';
    const start = parse(localStart, 'yyyy-MM-dd', new Date());
    return format(addDays(start, MAX_RANGE_DAYS), 'yyyy-MM-dd');
  }, [localStart]);

  const isOutOfRange = useMemo(() => {
    if (!localStart || !localEnd) return false;
    const start = parse(localStart, 'yyyy-MM-dd', new Date());
    const end = parse(localEnd, 'yyyy-MM-dd', new Date());
    return differenceInCalendarDays(end, start) > MAX_RANGE_DAYS;
  }, [localStart, localEnd]);

  const handleQuick = (range: QuickRange) => {
    setLocalStart(range.start);
    setLocalEnd(range.end);
    onChange(range.start, range.end);
  };

  const handleApply = () => {
    if (localStart && localEnd && localStart <= localEnd && !isOutOfRange) {
      onChange(localStart, localEnd);
    }
  };

  return (
    <div className="unit-cost-filters">
      <div className="unit-cost-filters__quick">
        {ranges.map((r) => (
          <button
            key={r.key}
            className={`unit-cost-filters__quick-btn${activeKey === r.key ? ' unit-cost-filters__quick-btn--active' : ''}`}
            onClick={() => handleQuick(r)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="unit-cost-filters__custom">
        <div className="unit-cost-filters__field">
          <label className="unit-cost-filters__label">Desde</label>
          <input
            type="date"
            className="unit-cost-filters__input"
            value={localStart}
            max={localEnd}
            onChange={(e) => setLocalStart(e.target.value)}
          />
        </div>

        <div className="unit-cost-filters__field">
          <label className="unit-cost-filters__label">Hasta</label>
          <input
            type="date"
            className="unit-cost-filters__input"
            value={localEnd}
            min={localStart}
            max={maxEndDate}
            onChange={(e) => setLocalEnd(e.target.value)}
          />
        </div>

        <button
          className={`unit-cost-filters__apply${isOutOfRange ? ' unit-cost-filters__apply--disabled' : ''}`}
          onClick={handleApply}
          disabled={isOutOfRange}
        >
          Aplicar
        </button>
      </div>

      {isOutOfRange && (
        <p className="unit-cost-filters__warning" role="alert">
          El rango no puede superar 2 años (730 días).
        </p>
      )}

      <p className="unit-cost-filters__period" aria-live="polite">
        {formatPeriodLabel(startDate, endDate)}
      </p>
    </div>
  );
}
