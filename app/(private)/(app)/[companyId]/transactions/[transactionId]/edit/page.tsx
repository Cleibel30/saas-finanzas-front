'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTransactionById } from '@/src/use-cases/transaction/useTransactionById';
import { useCategoryList } from '@/src/use-cases/category/useCategoryList';
import { useItemSearch } from '@/src/use-cases/item/useItemSearch';
import TransactionForm from '@/src/components/transaction/TransactionForm';
import Skeleton from '@/src/components/shared/Skeleton';
import type { Item } from '@/src/domain/entities/Item';

export default function EditTransactionPage() {
  const params = useParams<{ companyId: string; transactionId: string }>();
  const router = useRouter();
  const { companyId, transactionId } = params;
  const { transaction, isLoading, error } = useTransactionById(companyId, transactionId);
  const { categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategoryList(companyId);
  const { listItems, listProducts, listServices, loading: itemsLoading } = useItemSearch();
  const [initialItem, setInitialItem] = useState<Item | null>(null);
  const [itemResolved, setItemResolved] = useState(false);

  const initialCategory = useMemo(() => {
    if (!transaction || categories.length === 0) return null;
    return categories.find((c) => c.id === transaction.categoryId || c.name === transaction.category.name) ?? null;
  }, [transaction, categories]);

  useEffect(() => {
    if (!initialCategory || !transaction || itemResolved) return;

    let cancelled = false;

    (async () => {
      if (transaction.itemId && initialCategory.itemType !== 'NONE') {
        let result;
        if (initialCategory.itemType === 'PRODUCT') {
          result = await listProducts(companyId);
        } else if (initialCategory.itemType === 'SERVICE') {
          result = await listServices(companyId);
        } else {
          result = await listItems(companyId);
        }
        if (!cancelled && result?.items) {
          const item = result.items.find((i) => i.id === transaction.itemId || i.name === transaction.item?.name);
          if (item) setInitialItem(item);
        }
      } else if (transaction.costItemId && initialCategory.isDirectCost) {
        const result = await listItems(companyId);
        if (!cancelled && result?.items) {
          const costItem = result.items.find((i) => i.id === transaction.costItemId || i.name === transaction.costItem?.name);
          if (costItem) setInitialItem(costItem);
        }
      }

      if (!cancelled) {
        setItemResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCategory, transaction, companyId, listItems, listProducts, listServices, itemResolved]);

  useEffect(() => {
    if (!categoriesLoading && categories.length === 0) {
      refetchCategories();
    }
  }, [categoriesLoading, categories.length, refetchCategories]);

  const handleSave = useCallback(() => {
    router.push(`/${companyId}/transactions`);
  }, [companyId, router]);

  const handleCancel = useCallback(() => {
    router.push(`/${companyId}/transactions`);
  }, [companyId, router]);

  if (isLoading || categoriesLoading || (transaction && initialCategory && !itemResolved && !itemsLoading)) {
    return (
      <div>
        <div className="transaction-form__page-header">
          <div>
            <Skeleton variant="text" />
            <Skeleton variant="title" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="transaction-form__page-header">
          <div>
            <button
              className="transaction-form__back"
              onClick={() => router.push(`/${companyId}/transactions`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
              Volver a Transacciones
            </button>
          </div>
        </div>
        <div className="transaction-form__error">
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div>
        <div className="transaction-form__page-header">
          <div>
            <button
              className="transaction-form__back"
              onClick={() => router.push(`/${companyId}/transactions`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
              Volver a Transacciones
            </button>
          </div>
        </div>
        <div className="transaction-form__error">
          <div>Transacción no encontrada</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="transaction-form__page-header">
        <div>
          <button
            className="transaction-form__back"
            onClick={() => router.push(`/${companyId}/transactions`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
            Volver a Transacciones
          </button>
          <h1 className="transaction-form__page-title">Editar Transacción</h1>
          <p className="transaction-form__page-subtitle">
            Modifica los datos de la transacción.
          </p>
        </div>
      </div>

      <TransactionForm
        companyId={companyId}
        transaction={transaction}
        onSave={handleSave}
        onCancel={handleCancel}
        id="edit-transaction-form"
        initialCategory={initialCategory}
        initialItem={initialItem}
      />
    </div>
  );
}
