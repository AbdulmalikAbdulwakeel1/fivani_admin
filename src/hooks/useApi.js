import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useApi(url, params = {}, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get(url, { params });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch, ...deps]);

  return { data, loading, error, refetch: fetch };
}

export function usePaginatedApi(url, initialParams = {}) {
  const [page, setPage] = useState(1);
  const [params, setParams] = useState(initialParams);
  const { data, loading, error, refetch } = useApi(url, { ...params, page }, [page, JSON.stringify(params)]);

  const paginatedData = data?.data?.data || data?.data || [];
  const meta = data?.meta || data?.data || {};

  return {
    data: paginatedData,
    rawData: data,
    loading,
    error,
    page,
    setPage,
    totalPages: meta.last_page || 1,
    total: meta.total || 0,
    params,
    setParams: (p) => { setParams(p); setPage(1); },
    refetch,
  };
}
