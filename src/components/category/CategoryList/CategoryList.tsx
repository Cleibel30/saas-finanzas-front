'use client';

import { useCallback, useState } from 'react';
import { useCategoryList } from '@/src/use-cases/category/useCategoryList';
import { useDeleteCategory } from '@/src/use-cases/category/useDeleteCategory';
import type { Category } from '@/src/domain/entities/Category';
import Button from '@/src/components/shared/Button';
import Skeleton from '@/src/components/shared/Skeleton';
import ConfirmDialog from '@/src/components/shared/ConfirmDialog';
import './CategoryList.css';

interface CategoryListProps {
  companyId: string;
  onNew?: () => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

const TYPE_LABELS: Record<string, string> = {
  OPERATING: 'Operación',
  INVESTING: 'Inversión',
  FINANCING: 'Financiamiento',
};

const FLOW_LABELS: Record<string, string> = {
  INFLOW: 'Ingreso',
  OUTFLOW: 'Egreso',
};

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export default function CategoryList({ companyId, onNew, onEdit, onDelete }: CategoryListProps) {
  const { categories, meta, isLoading, error, page, refetch, goToPage } = useCategoryList(companyId);
  const { deleteCategory, loading: deleting, error: deleteError } = useDeleteCategory();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;

  const stats = {
    total,
    inflows: categories.filter((c) => c.flowDirection === 'INFLOW').length,
    variables: categories.filter((c) => c.isVariable).length,
    operating: categories.filter((c) => c.type === 'OPERATING').length,
  };

  const handleDelete = useCallback((category: Category) => {
    if (onDelete) {
      onDelete(category);
    } else {
      setDeleteTarget(category);
    }
  }, [onDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const success = await deleteCategory(companyId, deleteTarget.id);
    if (success) {
      setDeleteTarget(null);
      refetch();
    }
  }, [companyId, deleteTarget, deleteCategory, refetch]);

  console.log('CategoryList', { companyId, categories, isLoading, error, page, total, totalPages, stats, deleteTarget, deleting, deleteError });

  return (
    <div className="category-list">
      <div className="category-list__header">
        <div>
          <h1 className="category-list__title">Categorías</h1>
          <p className="category-list__subtitle">
            Administra la estructura de tus flujos financieros en USD y Bs.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={onNew}>
          <span className="material-symbols-outlined">add_circle</span>
          Nueva Categoría
        </Button>
      </div>

      <div className="category-list__stats">
        <div className="category-list__stat-card">
          <div className="category-list__stat-label">
            <span className="material-symbols-outlined category-list__stat-icon category-list__stat-icon--primary">
              account_tree
            </span>
            <span>Total Categorías</span>
          </div>
          <div className="category-list__stat-value">{total}</div>
        </div>
        <div className="category-list__stat-card">
          <div className="category-list__stat-label">
            <span className="material-symbols-outlined category-list__stat-icon category-list__stat-icon--secondary">
              trending_up
            </span>
            <span>Ingresos Activos</span>
          </div>
          <div className="category-list__stat-value">{stats.inflows}</div>
        </div>
        <div className="category-list__stat-card">
          <div className="category-list__stat-label">
            <span className="material-symbols-outlined category-list__stat-icon category-list__stat-icon--danger">
              trending_down
            </span>
            <span>Gastos Variables</span>
          </div>
          <div className="category-list__stat-value">{stats.variables}</div>
        </div>
        <div className="category-list__stat-card">
          <div className="category-list__stat-label">
            <span className="material-symbols-outlined category-list__stat-icon category-list__stat-icon--tertiary">
              category
            </span>
            <span>Operativas</span>
          </div>
          <div className="category-list__stat-value">{stats.operating}</div>
        </div>
      </div>

      {error && (
        <div className="category-list__error">
          <span className="material-symbols-outlined">error_outline</span>
          <span>{error}</span>
          <button onClick={refetch} className="category-list__retry">
            Reintentar
          </button>
        </div>
      )}

      <div className="category-list__table-container">
        {isLoading ? (
          <table className="category-list__table">
            <thead>
              <tr>
                <th className="category-list__th">Nombre</th>
                <th className="category-list__th">Tipo</th>
                <th className="category-list__th">Dirección</th>
                <th className="category-list__th">Costo (Cogs)</th>
                <th className="category-list__th">Variable</th>
                <th className="category-list__th">Origen</th>
                <th className="category-list__th category-list__th--right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="category-list__loading-row">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="category-list__td">
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : categories.length === 0 ? (
          <div className="category-list__empty">
            <div className="category-list__empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '4rem' }}>
                category
              </span>
            </div>
            <h2 className="category-list__empty-title">No hay categorías aún</h2>
            <p className="category-list__empty-text">
              Comienza a organizar tu flujo de caja creando tu primera categoría de ingresos o egresos.
            </p>
            <Button variant="primary" size="lg" onClick={onNew}>
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <>
            <table className="category-list__table">
              <thead>
                <tr>
                <th className="category-list__th">Nombre</th>
                <th className="category-list__th">Tipo</th>
                <th className="category-list__th">Dirección</th>
                <th className="category-list__th">Costo (Cogs)</th>
                <th className="category-list__th">Variable</th>
                <th className="category-list__th">Directo</th>
                <th className="category-list__th">Tipo Item</th>
                <th className="category-list__th">Origen</th>
                <th className="category-list__th category-list__th--right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="category-list__row">
                    <td className="category-list__td category-list__td--name">{cat.name}</td>
                    <td className="category-list__td">
                      <span className={`category-list__badge category-list__badge--${cat.type.toLowerCase()}`}>
                        {TYPE_LABELS[cat.type] ?? cat.type}
                      </span>
                    </td>
                    <td className="category-list__td">
                      <span className={`category-list__badge category-list__badge--${cat.flowDirection.toLowerCase()}`}>
                        {FLOW_LABELS[cat.flowDirection] ?? cat.flowDirection}
                      </span>
                    </td>
                    <td className="category-list__td">
                      <span className={`material-symbols-outlined ${cat.isCogs ? 'category-list__icon--active' : 'category-list__icon--inactive'}`}>
                        {cat.isCogs ? 'check_circle' : 'cancel'}
                      </span>
                    </td>
                    <td className="category-list__td">
                      <span className={`material-symbols-outlined ${cat.isVariable ? 'category-list__icon--active' : 'category-list__icon--inactive'}`}>
                        {cat.isVariable ? 'check_circle' : 'cancel'}
                      </span>
                    </td>
                    <td className="category-list__td">
                      {cat.flowDirection === 'OUTFLOW' && cat.isCogs ? (
                        <span className={`material-symbols-outlined ${cat.isDirectCost ? 'category-list__icon--active' : 'category-list__icon--inactive'}`}>
                          {cat.isDirectCost ? 'check_circle' : 'cancel'}
                        </span>
                      ) : (
                        <span className="category-list__empty-value">&mdash;</span>
                      )}
                    </td>
                    <td className="category-list__td">
                      <span className={`category-list__badge category-list__badge--${cat.itemType === 'PRODUCT' ? 'product' : cat.itemType === 'SERVICE' ? 'service' : 'none'}`}>
                        {cat.itemType === 'PRODUCT' ? 'Producto' : cat.itemType === 'SERVICE' ? 'Servicio' : 'Todos'}
                      </span>
                    </td>
                    <td className="category-list__td">
                      <span className={`category-list__badge category-list__badge--${cat.companyId ? 'own' : 'global'}`}>
                        {cat.companyId ? 'Propia' : 'Global'}
                      </span>
                    </td>
                    <td className="category-list__td category-list__td--actions">
                      <button
                        className="category-list__action category-list__action--edit"
                        onClick={() => onEdit?.(cat)}
                        aria-label="Editar"
                        disabled={cat.isDefault}
                        title={cat.isDefault ? 'No se puede editar una categoría global' : 'Editar'}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="category-list__action category-list__action--delete"
                        onClick={() => handleDelete(cat)}
                        aria-label="Eliminar"
                        disabled={deleting}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && totalPages > 0 && (
              <div className="category-list__pagination">
                <span className="category-list__pagination-info">
                  Mostrando <strong>{(page - 1) * meta.limit + 1}-{Math.min(page * meta.limit, meta.total)}</strong> de{' '}
                  <strong>{meta.total}</strong> categorías
                </span>
                <div className="category-list__pagination-controls">
                  <button
                    className="category-list__page-btn"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    aria-label="Anterior"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`ellipsis-${i}`} className="category-list__page-ellipsis">...</span>
                    ) : (
                      <button
                        key={p}
                        className={`category-list__page-btn${p === page ? ' category-list__page-btn--active' : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="category-list__page-btn"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    aria-label="Siguiente"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar Categoría"
        message={
          <>
            ¿Estás seguro de eliminar <strong>{deleteTarget?.name}</strong>?
            Esta acción no se puede deshacer.
          </>
        }
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
