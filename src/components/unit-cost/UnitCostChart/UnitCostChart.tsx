'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatUSD, formatBs } from '@/src/shared/utils/numberUtils';
import type { ChartDataPoint } from '@/src/domain/repositories/IUnitCostRepository';
import './UnitCostChart.css';

interface UnitCostChartProps {
  data: ChartDataPoint[];
  isValid: boolean;
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="unit-cost-chart__tooltip">
      <p className="unit-cost-chart__tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="unit-cost-chart__tooltip-value"
          style={{ color: entry.dataKey === 'unitCostUSD' ? '#00e479' : '#d2bbff' }}
        >
          {entry.dataKey === 'unitCostUSD' ? `USD: ${formatUSD(entry.value)}` : `Bs: ${formatBs(entry.value)}`}
        </p>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="unit-cost-chart">
      <div className="unit-cost-chart__header">
        <div className="unit-cost-chart__skeleton" style={{ width: 220, height: 20 }} />
        <div className="unit-cost-chart__skeleton" style={{ width: 300, height: 14, marginTop: 4 }} />
      </div>
      <div className="unit-cost-chart__skeleton" style={{ width: '100%', height: 250, borderRadius: 8 }} />
    </div>
  );
}

export default function UnitCostChart({ data, isValid, isLoading }: UnitCostChartProps) {
  const hasData = useMemo(
    () => data.length > 0 && data.some((d) => d.unitCostUSD > 0 || d.unitCostBs > 0),
    [data],
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="unit-cost-chart">
      <div className="unit-cost-chart__header">
        <div>
          <h3 className="unit-cost-chart__title">Evolución del Costo Unitario</h3>
          <p className="unit-cost-chart__subtitle">
            Costo unitario por período en USD y Bs.
          </p>
        </div>
        <div className="unit-cost-chart__legend">
          <span className="unit-cost-chart__legend-item">
            <span className="unit-cost-chart__legend-dot" style={{ background: '#00e479' }} />
            USD
          </span>
          <span className="unit-cost-chart__legend-item">
            <span className="unit-cost-chart__legend-dot" style={{ background: '#d2bbff' }} />
            Bs
          </span>
        </div>
      </div>

      {!isValid ? (
        <div className="unit-cost-chart__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>El rango seleccionado excede 2 años. Seleccione un período menor para ver la gráfica.</p>
        </div>
      ) : !hasData ? (
        <div className="unit-cost-chart__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No hay datos disponibles para el período seleccionado.</p>
        </div>
      ) : (
        <div className="unit-cost-chart__container">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e479" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00e479" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d2bbff" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#d2bbff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="period"
                tick={{ fill: 'rgba(186,202,195,0.4)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(186,202,195,0.4)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatUSD(v)}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="unitCostUSD"
                stroke="#00e479"
                strokeWidth={2}
                fill="url(#gradUSD)"
                dot={data.length <= 15 ? { r: 3, fill: '#00e479' } : false}
                activeDot={{ r: 5, fill: '#00e479' }}
              />
              <Area
                type="monotone"
                dataKey="unitCostBs"
                stroke="#d2bbff"
                strokeWidth={2}
                fill="url(#gradBs)"
                dot={data.length <= 15 ? { r: 3, fill: '#d2bbff' } : false}
                activeDot={{ r: 5, fill: '#d2bbff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
