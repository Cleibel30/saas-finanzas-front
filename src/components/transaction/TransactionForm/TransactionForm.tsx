'use client';

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { useCreateTransaction } from '@/src/use-cases/transaction/useCreateTransaction';
import { useUpdateTransaction } from '@/src/use-cases/transaction/useUpdateTransaction';
import { useItemSearch } from '@/src/use-cases/item/useItemSearch';
import { useDollarRateContext } from '@/src/shared/contexts/DollarRateContext';
import CategorySelect from '@/src/components/category/CategorySelect';
import type { Transaction, TransactionStatus, PaymentMethod, StockEffect } from '@/src/domain/entities/Transaction';
import type { Category } from '@/src/domain/entities/Category';
import type { Item } from '@/src/domain/entities/Item';
import { PAYMENT_METHODS } from '@/src/shared/constants';
import Button from '@/src/components/shared/Button';
import './TransactionForm.css';

function formatCurrency(raw: string): string {
  if (!raw) return '';
  const num = parseInt(raw, 10) / 100;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function getPaymentMethodLabel(method: string): string {
  return (PAYMENT_METHODS as Record<string, string>)[method] ?? method;
}

interface TransactionFormProps {
  companyId: string;
  transaction?: Transaction;
  onSave: () => void;
  onCancel: () => void;
  id?: string;
  hideFooter?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  defaultBatchId?: string;
  initialCategory?: Category | null;
  initialItem?: Item | null;
}

export default function TransactionForm({ companyId, transaction, onSave, onCancel, id, hideFooter, onLoadingChange, defaultBatchId, initialCategory, initialItem }: TransactionFormProps) {
  const isEdit = !!transaction;
  const { createTransactions, loading: creating } = useCreateTransaction();
  const { updateTransaction, loading: updating } = useUpdateTransaction();
  const { searchItem, listItems, listProducts, listServices, result: itemResult, loading: searchingItem } = useItemSearch();
  const { dollarRate: contextRate, isLoading: rateLoading } = useDollarRateContext();

  const [category, setCategory] = useState<Category | null>(() => {
    if (isEdit && initialCategory) return initialCategory;
    return null;
  });
  const [itemQuery, setItemQuery] = useState(() => {
    if (isEdit && initialItem) return initialItem.name;
    return '';
  });
  const [selectedItem, setSelectedItem] = useState<Item | null>(() => {
    if (isEdit && initialItem) return initialItem;
    return null;
  });
  const [itemOpen, setItemOpen] = useState(false);

  useEffect(() => {
    if (isEdit && initialCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(initialCategory);
    }
  }, [isEdit, initialCategory]);

  useEffect(() => {
    if (isEdit && initialItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItem(initialItem);
      setItemQuery(initialItem.name);
    }
  }, [isEdit, initialItem]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allItemsLoading, setAllItemsLoading] = useState(false);
  const [rawAmountUSD, setRawAmountUSD] = useState(() => {
    if (transaction) return String(Math.round(transaction.amountUSD * 100));
    return '';
  });
  const [rawAmountBs, setRawAmountBs] = useState(() => {
    if (transaction) return String(Math.round(transaction.amountBs * 100));
    return '';
  });
  const [dollarRate, setDollarRate] = useState(() => {
    if (transaction?.dollarRate && transaction.dollarRate > 0) {
      return String(Math.round(transaction.dollarRate * 100));
    }
    return '';
  });
  const [quantity, setQuantity] = useState(() => {
    if (transaction?.quantity && transaction.quantity > 0) {
      return String(transaction.quantity);
    }
    return '';
  });
  const [unitPriceRaw, setUnitPriceRaw] = useState(() => {
    if (transaction?.unitPrice && transaction.unitPrice > 0) {
      return String(Math.round(transaction.unitPrice * 100));
    }
    return '';
  });
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status ?? 'COMPLETED');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction?.paymentMethod ?? 'TRANSFERENCIA_BANCARIA_NACIONAL');
  const [paymentReference, setPaymentReference] = useState(transaction?.paymentReference ?? '');
  const [paymentDate, setPaymentDate] = useState(() => {
    if (!transaction?.paymentDate) return '';
    // Extract YYYY-MM-DD from ISO datetime string if needed
    const dateStr = transaction.paymentDate;
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  });
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [stockEffect, setStockEffect] = useState<StockEffect>(transaction?.stockEffect ?? 'DECREMENT');
  const [showQuantity, setShowQuantity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemContainerRef = useRef<HTMLDivElement>(null);
  const autoPopulatedRate = useRef(false);

  const loading = creating || updating;
  const displayAmountUSD = formatCurrency(rawAmountUSD);
  const displayAmountBs = formatCurrency(rawAmountBs);
  const displayUnitPrice = formatCurrency(unitPriceRaw);
  const displayDollarRate = dollarRate
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parseInt(dollarRate, 10) / 100)
    : '';
  const itemResults = itemResult?.items ?? [];
  const filteredItemResults = category?.itemType && category.itemType !== 'NONE'
    ? itemResults.filter((item) => item.type === category.itemType)
    : itemResults;
  const displayItems = itemQuery.trim() ? filteredItemResults : allItems;
  const isListLoading = allItemsLoading && !itemQuery.trim();
  const isSearchLoading = itemQuery.trim() && searchingItem;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!isEdit && contextRate?.promedio && !autoPopulatedRate.current && !dollarRate) {
      setDollarRate(String(Math.round(contextRate.promedio * 100)));
      autoPopulatedRate.current = true;
    }
  }, [contextRate?.promedio, isEdit, dollarRate]);

  const loadAllItems = useCallback(async () => {
    if (allItems.length > 0) return;
    setAllItemsLoading(true);
    let result;
    if (category?.itemType === 'PRODUCT') {
      result = await listProducts(companyId);
    } else if (category?.itemType === 'SERVICE') {
      result = await listServices(companyId);
    } else {
      result = await listItems(companyId);
    }
    if (result) setAllItems(result.items);
    setAllItemsLoading(false);
  }, [companyId, listItems, listProducts, listServices, allItems.length, category?.itemType]);

  const handleAmountUSDChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    setRawAmountUSD(digits);

    const usd = parseInt(digits, 10) / 100;
    const rate = parseInt(dollarRate, 10) / 100;
    if (isNaN(usd) || usd <= 0 || isNaN(rate) || rate <= 0) {
      if (!digits) setRawAmountBs('');
      return;
    }

    // Always recalc Bs from USD
    setRawAmountBs(String(Math.round(usd * rate * 100)));

    // Back-propagate to unitPrice for products/services
    if (selectedItem) {
      const qty = parseInt(quantity, 10);
      if (!isNaN(qty) && qty > 0) {
        setUnitPriceRaw(String(Math.round((usd / qty) * 100)));
      }
    }
  }, [dollarRate, selectedItem, quantity]);

  const handleAmountBsChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    setRawAmountBs(digits);

    const bs = parseInt(digits, 10) / 100;
    const rate = parseInt(dollarRate, 10) / 100;
    if (isNaN(bs) || bs <= 0 || isNaN(rate) || rate <= 0) {
      if (!digits) setRawAmountUSD('');
      return;
    }

    // Always recalc USD from Bs
    setRawAmountUSD(String(Math.round(bs / rate * 100)));

    // Back-propagate to unitPrice for products/services
    if (selectedItem) {
      const qty = parseInt(quantity, 10);
      if (!isNaN(qty) && qty > 0) {
        const unitPriceUSD = (bs / rate) / qty;
        setUnitPriceRaw(String(Math.round(unitPriceUSD * 100)));
      }
    }
  }, [dollarRate, selectedItem, quantity]);

  const recalcProductAmounts = useCallback((qty: number, upCents: number, rateVal: number) => {
    if (isNaN(qty) || qty <= 0 || isNaN(upCents) || upCents <= 0 || isNaN(rateVal) || rateVal <= 0) return;
    const totalUSD = (upCents / 100) * qty;
    setRawAmountUSD(String(Math.round(totalUSD * 100)));
    setRawAmountBs(String(Math.round(totalUSD * rateVal * 100)));
  }, []);

  const recalcDirectCostAmounts = useCallback(() => {
    const qty = parseInt(quantity, 10);
    const upCents = parseInt(unitPriceRaw, 10);
    const rateVal = parseInt(dollarRate, 10) / 100;
    if (isNaN(qty) || qty <= 0 || isNaN(upCents) || upCents <= 0 || isNaN(rateVal) || rateVal <= 0) return;
    const totalUSD = (upCents / 100) * qty;
    setRawAmountUSD(String(Math.round(totalUSD * 100)));
    setRawAmountBs(String(Math.round(totalUSD * rateVal * 100)));
  }, [quantity, unitPriceRaw, dollarRate]);

  const handleDollarRateChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    setDollarRate(digits);

    const rate = parseInt(digits, 10) / 100;
    if (isNaN(rate) || rate <= 0) return;

    if (showQuantity) {
      recalcDirectCostAmounts();
      return;
    }

    // For products/services: recalc from unitPrice × qty (source of truth)
    if (selectedItem) {
      const qty = parseInt(quantity, 10);
      const upCents = parseInt(unitPriceRaw, 10);
      recalcProductAmounts(qty, upCents, rate);
      return;
    }

    // For services: USD es la referencia, Bs se recalcula
    const usdVal = rawAmountUSD ? parseInt(rawAmountUSD, 10) / 100 : 0;
    if (usdVal > 0) {
      setRawAmountBs(String(Math.round(usdVal * rate * 100)));
    }
  }, [selectedItem, quantity, unitPriceRaw, recalcProductAmounts, rawAmountUSD, showQuantity, recalcDirectCostAmounts]);

  const handleQuantityChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    setQuantity(digits);
    if (selectedItem) {
      const qty = parseInt(digits, 10);
      const upCents = parseInt(unitPriceRaw, 10);
      const rateVal = parseInt(dollarRate, 10) / 100;
      recalcProductAmounts(qty, upCents, rateVal);
    }
    if (showQuantity) {
      recalcDirectCostAmounts();
    }
  }, [selectedItem, unitPriceRaw, dollarRate, recalcProductAmounts, showQuantity, recalcDirectCostAmounts]);

  const handleUnitPriceChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    setUnitPriceRaw(digits);
    if (selectedItem) {
      const qty = parseInt(quantity, 10);
      const upCents = parseInt(digits, 10);
      const rateVal = parseInt(dollarRate, 10) / 100;
      recalcProductAmounts(qty, upCents, rateVal);
    }
    if (showQuantity) {
      recalcDirectCostAmounts();
    }
  }, [selectedItem, quantity, dollarRate, recalcProductAmounts, showQuantity, recalcDirectCostAmounts]);

  const resetItemFields = useCallback(() => {
    setQuantity('');
    setUnitPriceRaw('');
    setRawAmountUSD('');
    setRawAmountBs('');
  }, []);

  const handleItemSearch = useCallback((term: string) => {
    setItemQuery(term);
    setSelectedItem(null);
    resetItemFields();
    setItemOpen(true);

    if (debounceRef.current !== null) clearTimeout(debounceRef.current);

    if (!term.trim()) return;

    debounceRef.current = setTimeout(() => {
      searchItem(term, companyId);
    }, 300) as ReturnType<typeof setTimeout>;
  }, [companyId, searchItem, resetItemFields]);

  const openItemDropdown = useCallback(() => {
    setItemOpen(true);
    loadAllItems();
  }, [loadAllItems]);

  const selectItem = useCallback((item: Item) => {
    resetItemFields();
    setSelectedItem(item);
    setItemQuery(item.name);
    setItemOpen(false);
    if (item.type === 'SERVICE') {
      setStockEffect('NONE');
    }
    if (!isEdit && item.basePrice > 0) {
      setUnitPriceRaw(String(Math.round(item.basePrice * 100)));
    }
  }, [isEdit, resetItemFields]);

  const clearItem = useCallback(() => {
    resetItemFields();
    setSelectedItem(null);
    setItemQuery('');
    setItemOpen(false);
  }, [resetItemFields]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemContainerRef.current && !itemContainerRef.current.contains(e.target as Node)) {
        setItemOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    console.log(e.type)
    e.preventDefault();
    setError(null);

    if (!category) {
      setError('Debes seleccionar una categoría');
      return;
    }

    const amountUSD = rawAmountUSD ? parseInt(rawAmountUSD, 10) / 100 : 0;
    const amountBs = rawAmountBs ? parseInt(rawAmountBs, 10) / 100 : 0;

    if (amountUSD <= 0 && amountBs <= 0) {
      setError('Debes ingresar al menos un monto');
      return;
    }

    const rate = parseInt(dollarRate, 10) / 100;
    if (!dollarRate || isNaN(rate) || rate <= 0) {
      setError('La tasa del día es obligatoria');
      return;
    }

    if (!paymentDate) {
      setError('La fecha de la operación es obligatoria');
      return;
    }

    let success = false;

    const isDirectCost = category.isDirectCost === true;
    const useProductCalc = !isDirectCost && selectedItem;
    const useQuantityToggle = isDirectCost && showQuantity;
    const payload = {
      categoryId: category.id,
      itemId: isDirectCost ? undefined : selectedItem?.id,
      costItemId: isDirectCost ? selectedItem?.id : undefined,
      batchId: defaultBatchId ?? transaction?.batchId ?? undefined,
      quantity: (useProductCalc || useQuantityToggle) && quantity ? parseInt(quantity, 10) : undefined,
      unitPrice: (useProductCalc || useQuantityToggle) && unitPriceRaw ? parseInt(unitPriceRaw, 10) / 100 : undefined,
      amountUSD,
      amountBs,
      dollarRate: rate,
      currency: 'DOLARES' as const,
      status,
      paymentMethod,
      paymentReference: paymentReference || undefined,
      description: description || undefined,
      paymentDate,
      stockEffect: (useProductCalc || useQuantityToggle) ? stockEffect : undefined,
    };

    if (isEdit && transaction) {
      const { data, error } = await updateTransaction(companyId, transaction.id, payload);
      if (error) {
        setError(error);
      } else {
        success = data !== null;
      }
    } else {
      const { data, error } = await createTransactions(companyId, [payload]);
      if (error) {
        setError(error);
      } else {
        success = data !== null && data.length > 0;
      }
    }

    if (success) {
      onSave();
    }
  }, [category, selectedItem, quantity, rawAmountUSD, rawAmountBs, unitPriceRaw, dollarRate, status, paymentMethod, paymentReference, description, paymentDate, stockEffect, showQuantity, isEdit, transaction, companyId, createTransactions, updateTransaction, onSave, defaultBatchId]);

  const categoryField = (
    <div className="transaction-form__field">
      <label className="transaction-form__label">Categoría</label>
      <CategorySelect
        companyId={companyId}
        value={category}
        onChange={(cat) => {
          setCategory(cat);
          setSelectedItem(null);
          setItemQuery('');
          setQuantity('');
          setUnitPriceRaw('');
              setStockEffect('DECREMENT');
          setShowQuantity(false);
          setAllItems([]);
        }}
        placeholder="Seleccionar categoría..."
      />
    </div>
  );

  const itemField = (
    <div className="transaction-form__field">
      <label className="transaction-form__label">
        {category?.isDirectCost ? 'Costo Directo (Opcional)' : 'Item (Opcional)'}
      </label>
      <div className="transaction-form__item-search" ref={itemContainerRef}>
        <div className="transaction-form__item-input-wrapper">
          <input
            className="transaction-form__item-input"
            type="text"
            placeholder={category?.isDirectCost ? 'Buscar costo directo...' : 'Buscar item...'}
            value={itemQuery}
            onChange={(e) => handleItemSearch(e.target.value)}
            onFocus={openItemDropdown}
          />
          {selectedItem && (
            <button
              type="button"
              className="transaction-form__item-clear"
              onClick={clearItem}
              aria-label="Limpiar item"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>close</span>
            </button>
          )}
        </div>
        {itemOpen && (
          <div className="transaction-form__item-dropdown">
            {isListLoading || isSearchLoading ? (
              <div className="transaction-form__item-dropdown-loading">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="transaction-form__item-skeleton" />
                ))}
              </div>
            ) : itemQuery.trim() && itemResults.length === 0 && !searchingItem ? (
              <div className="transaction-form__item-dropdown-empty">
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>search_off</span>
                <span>No se encontraron items</span>
              </div>
            ) : displayItems.length > 0 ? (
              displayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="transaction-form__item-option"
                  onClick={() => selectItem(item)}
                >
                  <span className="transaction-form__item-option-name">{item.name}</span>
                  <span className="transaction-form__item-option-type">{item.type}</span>
                </button>
              ))
            ) : !itemQuery.trim() && !allItemsLoading ? (
              <div className="transaction-form__item-dropdown-empty">
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>search</span>
                <span>Sin resultados</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  const stockLabel = !category?.isDirectCost && selectedItem?.type === 'PRODUCT' && (
    <div className="transaction-form__stock-label">
      Stock disponible: <strong className="transaction-form__stock-value">{selectedItem.stockCurrent}</strong>
    </div>
  );

  const productQuantityFields = !category?.isDirectCost && selectedItem && (
    <>
      {stockLabel}
      <div className="transaction-form__grid">
        <div className="transaction-form__field">
          <label className="transaction-form__label">Precio por Unidad</label>
          <div className="transaction-form__input-group">
            <span className="transaction-form__input-prefix">$</span>
            <input
              className="transaction-form__input transaction-form__input--with-prefix"
              type="text"
              inputMode="numeric"
              placeholder="0.00"
              value={displayUnitPrice}
              onChange={(e) => handleUnitPriceChange(e.target.value)}
            />
          </div>
        </div>
        <div className="transaction-form__field">
          <label className="transaction-form__label">Cantidad</label>
          <input
            className="transaction-form__input"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );

  const directCostToggle = category?.flowDirection === 'OUTFLOW' && category?.isDirectCost && selectedItem && (
    <div className="transaction-form__toggle-card">
      <div className="transaction-form__toggle-info">
        <span className="transaction-form__toggle-label">Registrar cantidad</span>
        <span className="transaction-form__toggle-desc">
          {showQuantity
            ? 'El monto se calculará automáticamente desde precio × cantidad'
            : 'Ingresa el monto total manualmente'}
        </span>
      </div>
      <label className="transaction-form__switch">
        <input
          className="transaction-form__switch-input"
          type="checkbox"
          checked={showQuantity}
          onChange={(e) => {
            const on = e.target.checked;
            setShowQuantity(on);
            if (on) {
              setStockEffect('DECREMENT');
              const upCents = unitPriceRaw || (selectedItem?.basePrice ? String(Math.round(selectedItem.basePrice * 100)) : '');
              if (upCents && !unitPriceRaw) {
                setUnitPriceRaw(upCents);
              }
              const qty = parseInt(quantity, 10);
              const upCentsNum = parseInt(upCents, 10);
              const rateVal = parseInt(dollarRate, 10) / 100;
              if (!isNaN(qty) && qty > 0 && !isNaN(upCentsNum) && upCentsNum > 0 && !isNaN(rateVal) && rateVal > 0) {
                const totalUSD = (upCentsNum / 100) * qty;
                setRawAmountUSD(String(Math.round(totalUSD * 100)));
                setRawAmountBs(String(Math.round(totalUSD * rateVal * 100)));
              }
            } else {
              setQuantity('');
              setUnitPriceRaw('');
              setRawAmountUSD('');
              setRawAmountBs('');
          setStockEffect('DECREMENT');
            }
          }}
        />
        <span className="transaction-form__switch-slider" />
      </label>
    </div>
  );

  const showQuantityFields = showQuantity && (
    <div className="transaction-form__grid">
      <div className="transaction-form__field">
        <label className="transaction-form__label">Precio por Unidad</label>
        <div className="transaction-form__input-group">
          <span className="transaction-form__input-prefix">$</span>
          <input
            className="transaction-form__input transaction-form__input--with-prefix"
            type="text"
            inputMode="numeric"
            placeholder="0.00"
            value={displayUnitPrice}
            onChange={(e) => handleUnitPriceChange(e.target.value)}
          />
        </div>
      </div>
      <div className="transaction-form__field">
        <label className="transaction-form__label">Cantidad</label>
        <input
          className="transaction-form__input"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
        />
      </div>
    </div>
  );

  const amountsFields = (
    <>
      <div className="transaction-form__grid">
        <div className="transaction-form__field">
          <label className="transaction-form__label">Monto USD</label>
          <div className="transaction-form__input-group">
            <span className="transaction-form__input-prefix">$</span>
            <input
              className="transaction-form__input transaction-form__input--with-prefix"
              type="text"
              inputMode="numeric"
              placeholder="0.00"
              value={displayAmountUSD}
              onChange={(e) => handleAmountUSDChange(e.target.value)}
              readOnly={showQuantity}
            />
          </div>
        </div>
        <div className="transaction-form__field">
          <label className="transaction-form__label">Monto Bs</label>
          <div className="transaction-form__input-group">
            <span className="transaction-form__input-prefix transaction-form__input-prefix--bs">Bs</span>
            <input
              className="transaction-form__input transaction-form__input--with-prefix"
              type="text"
              inputMode="numeric"
              placeholder="0.00"
              value={displayAmountBs}
              onChange={(e) => handleAmountBsChange(e.target.value)}
              readOnly={showQuantity}
            />
          </div>
        </div>
      </div>
      <div className="transaction-form__grid">
        <div className="transaction-form__field">
          <label className="transaction-form__label">Tasa del día (Bs/$)</label>
          <div className="transaction-form__input-group">
            <span className="transaction-form__input-prefix">Bs</span>
            <input
              className="transaction-form__input transaction-form__input--with-prefix"
              type="text"
              inputMode="numeric"
              placeholder={rateLoading ? 'Cargando...' : '0.00'}
              value={displayDollarRate}
              onChange={(e) => handleDollarRateChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );

  const stockEffectField = !category?.isDirectCost && selectedItem?.type === 'PRODUCT' && (
    <div className="transaction-form__field">
      <label className="transaction-form__label">Efecto en Inventario</label>
      <div className="transaction-form__select-wrapper">
        <select
          className="transaction-form__select"
          value={stockEffect}
          onChange={(e) => setStockEffect(e.target.value as StockEffect)}
        >
          <option value="NONE">Sin efecto</option>
          <option value="DECREMENT">Disminuye stock</option>
        </select>
        <span className="material-symbols-outlined transaction-form__select-arrow">expand_more</span>
      </div>
    </div>
  );

  const paymentMethodField = (
    <div className="transaction-form__field">
      <label className="transaction-form__label">Método de Pago</label>
      <div className="transaction-form__select-wrapper">
        <select
          className="transaction-form__select"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined transaction-form__select-arrow">expand_more</span>
      </div>
    </div>
  );

  const statusField = (
    <div className="transaction-form__field">
      <label className="transaction-form__label">Estado Inicial</label>
      <div className="transaction-form__status-toggle">
        <button
          type="button"
          className={`transaction-form__status-btn${status === 'COMPLETED' ? ' transaction-form__status-btn--active transaction-form__status-btn--completed' : ''}`}
          onClick={() => setStatus('COMPLETED')}
        >
          Completado
        </button>
        <button
          type="button"
          className={`transaction-form__status-btn${status === 'PENDING' ? ' transaction-form__status-btn--active transaction-form__status-btn--pending' : ''}`}
          onClick={() => setStatus('PENDING')}
        >
          Pendiente
        </button>
      </div>
    </div>
  );

  const errorDisplay = error && (
    <div className={`transaction-form__error ${!hideFooter ? 'transaction-form__page-error' : ''}`}>
      {error.split('\n').map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );

  if (!hideFooter) {
    const isInflow = category?.flowDirection !== 'OUTFLOW';

    return (
      <div className="transaction-form-wrapper">
        <div className="transaction-form">
          <form className="transaction-form__body" id={id} onSubmit={handleSubmit}>
            <div className="transaction-form__page-layout">
              <div className="transaction-form__left">
                <div className="transaction-form__section transaction-form__summary">
                  <h3 className="transaction-form__section-title">Resumen de la Transacción</h3>

                  <div className="transaction-form__summary-preview">
                    {category ? (
                      <div className={`transaction-form__summary-type transaction-form__summary-type--${isInflow ? 'inflow' : 'outflow'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                          {isInflow ? 'trending_up' : 'trending_down'}
                        </span>
                        {isInflow ? 'Ingreso' : 'Egreso'}
                      </div>
                    ) : (
                      <div className="transaction-form__summary-type transaction-form__summary-type--empty">
                        Selecciona una categoría
                      </div>
                    )}

                    <div className="transaction-form__summary-details">
                      <span className="transaction-form__summary-category">
                        {category?.name ?? '—'}
                      </span>
                      {(selectedItem || (!category?.isDirectCost === false)) && (
                        <span className="transaction-form__summary-item">
                          {selectedItem?.name ?? '—'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="transaction-form__summary-amounts">
                    <div className="transaction-form__summary-amount transaction-form__summary-amount--usd">
                      <span className="transaction-form__summary-amount-label">USD</span>
                      <span className="transaction-form__summary-amount-value">
                        {displayAmountUSD || '$ 0.00'}
                      </span>
                    </div>
                    <div className="transaction-form__summary-amount transaction-form__summary-amount--bs">
                      <span className="transaction-form__summary-amount-label">Bs</span>
                      <span className="transaction-form__summary-amount-value">
                        {displayAmountBs || 'Bs 0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-form__summary-meta">
                    <div className="transaction-form__summary-meta-row">
                      <span className="transaction-form__summary-meta-label">Tasa</span>
                      <span className="transaction-form__summary-meta-value">
                        {displayDollarRate ? `${displayDollarRate} Bs/$` : '—'}
                      </span>
                    </div>
                    <div className="transaction-form__summary-meta-row">
                      <span className="transaction-form__summary-meta-label">Método</span>
                      <span className="transaction-form__summary-meta-value">
                        {getPaymentMethodLabel(paymentMethod)}
                      </span>
                    </div>
                    <div className="transaction-form__summary-meta-row">
                      <span className="transaction-form__summary-meta-label">Estado</span>
                      <span className={`transaction-form__summary-status transaction-form__summary-status--${status.toLowerCase()}`}>
                        {status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-form__summary-divider" />

                  <div className="transaction-form__field">
                    <label className="transaction-form__label" htmlFor="tx-date">Fecha de Operación</label>
                    <input
                      id="tx-date"
                      className="transaction-form__input"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>

                  <div className="transaction-form__field">
                    <label className="transaction-form__label" htmlFor="tx-ref">Referencia</label>
                    <input
                      id="tx-ref"
                      className="transaction-form__input"
                      type="text"
                      placeholder="Número de referencia o comprobante"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>

                  <div className="transaction-form__field">
                    <label className="transaction-form__label" htmlFor="tx-desc">Descripción / Notas</label>
                    <textarea
                      id="tx-desc"
                      className="transaction-form__textarea"
                      placeholder="Descripción opcional de la transacción..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="transaction-form__right">
                <div className="transaction-form__section">
                  <h3 className="transaction-form__section-title">Pago</h3>
                  {categoryField}
                  {itemField}
                  {productQuantityFields}
                  {directCostToggle}
                  {showQuantityFields}
                  {amountsFields}
                  {stockEffectField}
                  {paymentMethodField}
                  {statusField}
                </div>
              </div>

              {errorDisplay}

              <div className="transaction-form__page-footer">
                <Button variant="outline" size="lg" onClick={onCancel} type="button" disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="primary" size="lg" loading={loading} type="submit">
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-form-wrapper">
      <div className="transaction-form">
        <form className="transaction-form__body" id={id} onSubmit={handleSubmit}>
          {categoryField}
          {itemField}
          {productQuantityFields}
          {directCostToggle}
          {showQuantityFields}

          <div className="transaction-form__section-label">Moneda y Monto</div>
          {amountsFields}

          {!category?.isDirectCost && selectedItem?.type === 'PRODUCT' && (
            <>
              <div className="transaction-form__section-label">Efecto en Inventario</div>
              {stockEffectField}
            </>
          )}

          <div className="transaction-form__section-label">Detalles del Pago</div>
          {paymentMethodField}
          {statusField}

          <div className="transaction-form__field">
            <label className="transaction-form__label" htmlFor="tx-ref">Referencia</label>
            <input
              id="tx-ref"
              className="transaction-form__input"
              type="text"
              placeholder="Número de referencia o comprobante"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="transaction-form__grid">
            <div className="transaction-form__field">
              <label className="transaction-form__label" htmlFor="tx-date">Fecha Operación</label>
              <input
                id="tx-date"
                className="transaction-form__input"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="transaction-form__field">
            <label className="transaction-form__label" htmlFor="tx-desc">Descripción / Notas</label>
            <textarea
              id="tx-desc"
              className="transaction-form__textarea"
              placeholder="Descripción opcional de la transacción..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {errorDisplay}

          <div className="transaction-form__footer">
            <Button variant="outline" size="lg" fullWidth onClick={onCancel} type="button" disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
