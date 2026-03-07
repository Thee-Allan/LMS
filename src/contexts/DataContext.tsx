import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clientsApi, mattersApi, tasksApi, eventsApi, invoicesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DataState {
  clients: object[];
  matters: object[];
  tasks: object[];
  events: object[];
  invoices: object[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const defaultState: DataState = {
  clients: [], matters: [], tasks: [], events: [], invoices: [],
  loading: true, error: null, refresh: () => {},
};

const DataContext = createContext<DataState>(defaultState);
export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<DataState, 'refresh'>>(defaultState);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [c, m, t, e, i] = await Promise.allSettled([
        clientsApi.list(),
        mattersApi.list(),
        tasksApi.list(),
        eventsApi.list(),
        invoicesApi.list(),
      ]);
      setState({
        clients:  c.status === 'fulfilled' ? (c.value as object[]) : [],
        matters:  m.status === 'fulfilled' ? (m.value as object[]) : [],
        tasks:    t.status === 'fulfilled' ? (t.value as object[]) : [],
        events:   e.status === 'fulfilled' ? (e.value as object[]) : [],
        invoices: i.status === 'fulfilled' ? (i.value as object[]) : [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: 'Failed to load data' }));
    }
  }, [user]);

  // Fetch on mount and when auth changes
  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    window.addEventListener('nlf_auth_changed', fetchAll);
    return () => window.removeEventListener('nlf_auth_changed', fetchAll);
  }, [fetchAll]);

  return (
    <DataContext.Provider value={{ ...state, refresh: fetchAll }}>
      {children}
    </DataContext.Provider>
  );
};
