'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { useUserStore, useTheme, useInitializeStores } from '@/store';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function StoreInitializer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const { theme } = useTheme();
  
  useInitializeStores();
  
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
    } else {
      setLoading(false);
      if (session?.user) {
        setUser({
          id: session.user.id || '',
          email: session.user.email || '',
          name: session.user.name || '',
          image: session.user.image || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    }
  }, [session, status, setUser, setLoading]);
  
  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <StoreInitializer>
          {children}
        </StoreInitializer>
      </QueryClientProvider>
    </SessionProvider>
  );
}