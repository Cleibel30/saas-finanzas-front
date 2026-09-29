import type { ReactNode } from 'react';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
