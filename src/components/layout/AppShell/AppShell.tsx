'use client';

import type { ReactNode } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import ChatWidget from '@/src/components/finance-chat/ChatWidget';
import { useMyCompanies } from '@/src/use-cases/company/useMyCompanies';
import { DollarRateProvider, useDollarRateContext } from '@/src/shared/contexts/DollarRateContext';
import type { Company } from '@/src/domain/entities/Company';
import type { DollarRate } from '@/src/use-cases/dollar/useDollarRate';
import './AppShell.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel', href: '/dashboard', icon: 'dashboard' },
  { label: 'Categorías', href: '/categories', icon: 'category' },
  { label: 'Productos y Servicios', href: '/items', icon: 'inventory_2' },
  { label: 'Transacciones', href: '/transactions', icon: 'receipt_long' },
  { label: 'Lotes de Producción', href: '/batches', icon: 'precision_manufacturing' },
  { label: 'Flujo de Caja', href: '/cash-flow', icon: 'payments' },
  { label: 'Margen de Contribución', href: '/contribution-margin', icon: 'analytics' },
  { label: 'Punto de Equilibrio', href: '/balance-point', icon: 'show_chart' },
  { label: 'Utilidad Bruta', href: '/gross-profit', icon: 'trending_up' },
  { label: 'Utilidad Neta', href: '/net-profit', icon: 'account_balance' },
  { label: 'Costo Unitario', href: '/unit-cost', icon: 'request_quote' },
  // { label: 'Precio con Margen', href: '/price-margin', icon: 'sell' },
  { label: 'Tasa del Dólar', href: '/dollar-rate', icon: 'currency_exchange' },
  { label: 'Hoja de Cálculo', href: '/excel', icon: 'grid_on' },
];

export default function AppShell({ 
  children, 
  companyId: companyIdProp,
  company, 
  companies, 
  initialDollarRate 
}: { 
  children: ReactNode;
  companyId?: string;
  company?: Company | null;
  companies?: Company[];
  initialDollarRate?: DollarRate | null;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const companyId = companyIdProp ?? params.companyId as string;
  const hasCompany = !!companyId;

  const segments = pathname.split('/');
  const excelIndex = segments.findIndex((segment) => segment === 'excel');
  const isExcelEditor =
    excelIndex > 0 && excelIndex === segments.length - 2;

  const isTransactionForm =
    pathname.includes('/transactions/new') ||
    /\/transactions\/[^/]+\/edit/.test(pathname);

  const isFullPage = isExcelEditor || isTransactionForm;

  const { companies: fetchedCompanies } = useMyCompanies();
  const companiesToUse = companies ?? fetchedCompanies ?? [];

  const sidebarRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCompanySwitch = (id: string) => {
    router.push(`/${id}/dashboard`);
  };

  const handleBack = () => {
    router.push(`/${companyId}/excel`);
  };

  return (
    <DollarRateProvider companyId={companyId} initialDollarRate={initialDollarRate}>
      <div className={isFullPage ? 'app-shell app-shell--editor' : 'app-shell'}>
        <Header
          onToggleSidebar={toggleSidebar}
          editorMode={isFullPage}
          onBack={handleBack}
          companyId={companyId}
          companyName={company?.name}
          companies={companiesToUse}
          onCompanySwitch={handleCompanySwitch}
        />
        <div className="app-shell__body">
          {!isFullPage && sidebarOpen && <div className="app-shell__backdrop" onClick={closeSidebar} />}
          {hasCompany && !isFullPage && (
            <aside
              className={`app-shell__sidebar${sidebarOpen ? ' app-shell__sidebar--open' : ''}`}
              ref={sidebarRef}
            >
              <div className="app-shell__sidebar-header">
                <h2 className="app-shell__sidebar-title">{company?.name}</h2>
              </div>

              <SidebarUtils
                companyId={companyId}
                companyName={company?.name}
                companies={companiesToUse}
                onCompanySwitch={handleCompanySwitch}
                companyOpen={companyOpen}
                setCompanyOpen={setCompanyOpen}
                companyRef={companyRef}
              />

              <nav className="app-shell__sidebar-nav">
                <NavItems companyId={companyId} />
              </nav>

              <div className="app-shell__sidebar-footer">
                <button className="app-shell__sidebar-utils-btn" type="button">
                  <span className="material-symbols-outlined app-shell__sidebar-utils-icon">support</span>
                  <span className="app-shell__sidebar-utils-label">Soporte</span>
                </button>
                <button className="app-shell__sidebar-utils-btn" type="button">
                  <span className="material-symbols-outlined app-shell__sidebar-utils-icon">rate_review</span>
                  <span className="app-shell__sidebar-utils-label">Mejorar</span>
                </button>
              </div>
            </aside>
          )}
          <main className="app-shell__content">{children}</main>
          {hasCompany && !isFullPage && <ChatWidget companyId={companyId} />}
        </div>
      </div>
    </DollarRateProvider>
  );
}

function NavItems({ companyId }: { companyId: string }) {
  const { dollarRate } = useDollarRateContext();
  const pathname = usePathname();

  const prefixedHref = (href: string) => `/${companyId}${href}`;

  const isActive = (href: string) => {
    const full = prefixedHref(href);
    if (href === '/dashboard') return pathname === full;
    return pathname.startsWith(full);
  };

  return NAV_ITEMS.map((item) => (
    <Link
      key={item.href}
      href={prefixedHref(item.href)}
      className={`app-shell__nav-link${isActive(item.href) ? ' app-shell__nav-link--active' : ''}`}
    >
      <span className="app-shell__nav-icon material-symbols-outlined">{item.icon}</span>
      <span className="app-shell__nav-label">{item.label}</span>
      {item.href === '/dollar-rate' && dollarRate && (
        <span className="app-shell__nav-rate">
          {dollarRate.promedio.toFixed(2)}
        </span>
      )}
    </Link>
  ));
}

interface SidebarUtilsProps {
  companyId: string;
  companyName?: string;
  companies: { id: string; name: string }[];
  onCompanySwitch: (id: string) => void;
  companyOpen: boolean;
  setCompanyOpen: (open: boolean) => void;
  companyRef: React.RefObject<HTMLDivElement | null>;
}

function SidebarUtils({
  companyId,
  companyName,
  companies,
  onCompanySwitch,
  companyOpen,
  setCompanyOpen,
  companyRef,
}: SidebarUtilsProps) {
  const { dollarRate, isLoading: rateLoading, source } = useDollarRateContext();

  const resolvedCompanyName = companyName || companies.find((c) => c.id === companyId)?.name;

  return (
    <div className="app-shell__sidebar-utils">
      <div className="app-shell__sidebar-utils-item" ref={companyRef}>
        <button
          className="app-shell__sidebar-utils-btn"
          onClick={() => setCompanyOpen(!companyOpen)}
        >
          <span className="material-symbols-outlined app-shell__sidebar-utils-icon">business</span>
          <span className="app-shell__sidebar-utils-label">{resolvedCompanyName || 'Cargando...'}</span>
          <span className="material-symbols-outlined app-shell__sidebar-utils-chevron">
            {companyOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {companyOpen && (
          <div className="app-shell__sidebar-utils-dropdown">
            {companies.map((c) => (
              <button
                key={c.id}
                className={`app-shell__sidebar-utils-dropdown-item${c.id === companyId ? ' app-shell__sidebar-utils-dropdown-item--active' : ''}`}
                onClick={() => {
                  setCompanyOpen(false);
                  onCompanySwitch(c.id);
                }}
              >
                {c.name}
              </button>
            ))}
            <div className="app-shell__sidebar-utils-divider" />
            <Link
              href={`/companies?selected=${companyId}`}
              className="app-shell__sidebar-utils-dropdown-item app-shell__sidebar-utils-dropdown-item--config"
              onClick={() => setCompanyOpen(false)}
            >
              <span className="material-symbols-outlined app-shell__sidebar-utils-dropdown-item-icon">settings</span>
              Configurar
            </Link>
          </div>
        )}
      </div>

      <div className={`app-shell__sidebar-utils-item app-shell__sidebar-utils-rate${source === 'manual' ? ' app-shell__sidebar-utils-rate--manual' : ''}`}>
        <span className="material-symbols-outlined app-shell__sidebar-utils-icon">
          {source === 'manual' ? 'edit_note' : 'currency_exchange'}
        </span>
        <span className="app-shell__sidebar-utils-rate-label">USD/VES</span>
        <span className="app-shell__sidebar-utils-rate-value">
          {rateLoading ? '...' : dollarRate?.promedio?.toFixed(2) ?? '—'}
        </span>
      </div>

    </div>
  );
}
