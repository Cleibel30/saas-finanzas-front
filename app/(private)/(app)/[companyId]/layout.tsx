import { getSession } from '@/src/infrastructure/supabase/server';
import AppShell from '@/src/components/layout/AppShell';
import type { Company } from '@/src/domain/entities/Company';
import type { DollarRate } from '@/src/use-cases/dollar/useDollarRate';
import { API_BASE_URL } from '@/src/shared/constants';

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

async function fetchCompany(companyId: string, token: string): Promise<Company | null> {
  try {
    const url = `${API_BASE_URL}/company/${companyId}`;
    console.log('[ServerLayout] fetchCompany URL:', url);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[ServerLayout] fetchCompany status:', res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[ServerLayout] fetchCompany error response:', errorText);
      return null;
    }
    const data = await res.json();
    console.log('[ServerLayout] fetchCompany data:', data);
    return data;
  } catch (err) {
    console.error('[ServerLayout] fetchCompany error:', err);
    return null;
  }
}

async function fetchDollarRate(): Promise<DollarRate | null> {
  try {
    const url = '/api/dollar-rate';
    console.log('[ServerLayout] fetchDollarRate URL:', url);
    const res = await fetch(url, {
      cache: 'no-store',
    });

    console.log('[ServerLayout] fetchDollarRate status:', res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[ServerLayout] fetchDollarRate error response:', errorText);
      return null;
    }
    const data = await res.json();
    console.log('[ServerLayout] fetchDollarRate data:', data);
    return data;
  } catch (err) {
    console.error('[ServerLayout] fetchDollarRate error:', err);
    return null;
  }
}

async function fetchCompanies(token: string): Promise<Company[]> {
  try {
    const url = `${API_BASE_URL}/company/my-companies`;
    console.log('[ServerLayout] fetchCompanies URL:', url);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[ServerLayout] fetchCompanies status:', res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[ServerLayout] fetchCompanies error response:', errorText);
      return [];
    }
    const data = await res.json();
    console.log('[ServerLayout] fetchCompanies data:', data);
    return data;
  } catch (err) {
    console.error('[ServerLayout] fetchCompanies error:', err);
    return [];
  }
}

export default async function CompanyLayout({ children, params }: CompanyLayoutProps) {
  const { companyId } = await params;
  const session = await getSession();

  console.log('[ServerLayout] companyId:', companyId);
  console.log('[ServerLayout] session:', session?.access_token ? 'has token' : 'no session');

  let company: Company | null = null;
  let companies: Company[] = [];
  let dollarRate: DollarRate | null = null;

  if (session?.access_token) {
    const token = session.access_token;

    const [companyRes, companiesRes, dollarRateRes] = await Promise.all([
      fetchCompany(companyId, token),
      fetchCompanies(token),
      fetchDollarRate(),
    ]);

    company = companyRes;
    companies = companiesRes;
    dollarRate = dollarRateRes;
  }

  console.log('[ServerLayout] Final company:', company);
  console.log('[ServerLayout] Final companies:', companies);
  console.log('[ServerLayout] Final dollarRate:', dollarRate);

  return (
    <AppShell
      companyId={companyId}
      company={company}
      companies={companies}
      initialDollarRate={dollarRate}
    >
      {children}
    </AppShell>
  );
}