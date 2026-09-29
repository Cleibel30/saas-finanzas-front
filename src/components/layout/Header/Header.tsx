'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/use-cases/auth/useSession';
import { useLogout } from '@/src/use-cases/auth/useLogout';
import { useDollarRateContext } from '@/src/shared/contexts/DollarRateContext';
import type { Company } from '@/src/domain/entities/Company';
import './Header.css';

interface HeaderProps {
  onToggleSidebar?: () => void;
  editorMode?: boolean;
  onBack?: () => void;
  companyId?: string;
  companyName?: string;
  companies?: Company[];
  onCompanySwitch?: (id: string) => void;
}

export default function Header({
  onToggleSidebar,
  editorMode = false,
  onBack,
  companyId,
  companyName,
  companies = [],
  onCompanySwitch,
}: HeaderProps) {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { logout, loading: logoutLoading } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const { dollarRate, isLoading: rateLoading, source } = useDollarRateContext();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const handleCompanySwitch = (id: string) => {
    setCompanyOpen(false);
    onCompanySwitch?.(id);
  };

  const resolvedCompanyName = companyName || (companyId ? companies.find((c) => c.id === companyId)?.name : null);

  return (
    <header className="header">
      <div className="header__left">
        {editorMode ? (
          <button
            className="header__back-btn"
            onClick={onBack}
            aria-label="Volver a las hojas de cálculo"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <button className="header__menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        <img src="/logo.png" alt="FinanzaVzla" className="header__brand-logo" />

        {companyId && (
          <div className="header__company-selector" ref={companyRef}>
            <button
              className="header__company-btn"
              onClick={() => setCompanyOpen(!companyOpen)}
            >
              <span className="material-symbols-outlined header__company-icon">business</span>
              <span className="header__company-name">{resolvedCompanyName || 'Cargando...'}</span>
              <span className="material-symbols-outlined header__company-chevron">
                {companyOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {companyOpen && (
              <div className="header__company-dropdown">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    className={`header__company-item${c.id === companyId ? ' header__company-item--active' : ''}`}
                    onClick={() => handleCompanySwitch(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
                <div className="header__company-divider" />
                <Link
                  href={`/companies?selected=${companyId}`}
                  className="header__company-item header__company-item--config"
                  onClick={() => setCompanyOpen(false)}
                >
                  <span className="material-symbols-outlined header__company-item-icon">settings</span>
                  Configurar
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="header__nav-items">
          <div className={`header__dollar-rate${source === 'manual' ? ' header__dollar-rate--manual' : ''}`}>
            <span className="material-symbols-outlined header__dollar-icon">
              {source === 'manual' ? 'edit_note' : 'currency_exchange'}
            </span>
            <span className="header__dollar-label">USD/VES</span>
            <span className="header__dollar-value">{rateLoading ? '...' : dollarRate?.promedio?.toFixed(2) ?? '—'}</span>
          </div>
          <button className="header__nav-btn" type="button">
            <span className="material-symbols-outlined header__nav-btn-icon">support</span>
            <span className="header__nav-btn-label">Soporte</span>
          </button>
          <button className="header__nav-btn" type="button">
            <span className="material-symbols-outlined header__nav-btn-icon">rate_review</span>
            <span className="header__nav-btn-label">Mejorar</span>
          </button>
        </div>
      </div>

      <div className="header__right">
        <div className="header__actions">
          <button className="header__icon-btn">
            <span className="material-symbols-outlined header__notif-icon">notifications</span>
            <span className="header__notif-badge" />
          </button>
          <div className="header__user-menu" ref={menuRef}>
            <button
              className="header__avatar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {isLoading ? (
                <div className="header__avatar-skeleton" />
              ) : (
                <span className="header__avatar-initials">{initials}</span>
              )}
            </button>
            {menuOpen && (
              <div className="header__dropdown">
                <div className="header__dropdown-user">
                  <span className="header__dropdown-name">{user?.name}</span>
                  <span className="header__dropdown-email">{user?.email}</span>
                </div>
                <div className="header__dropdown-divider" />
                <button className="header__dropdown-item" onClick={() => { setMenuOpen(false); router.push('/profile'); }}>
                  Perfil
                </button>
                <button className="header__dropdown-item" onClick={() => { setMenuOpen(false); router.push('/settings'); }}>
                  Configuración
                </button>
                <div className="header__dropdown-divider" />
                <button
                  className="header__dropdown-item header__dropdown-item--danger"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? 'Cerrando...' : 'Cerrar Sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
