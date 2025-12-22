/**
 * React hook for making authenticated API calls with loading states
 */

import { useState, useCallback } from 'react';
import { callBackend } from './authClient';
import { useToast } from '@/shared/hooks/use-toast';

interface UseAuthenticatedApiOptions {
  showErrorToast?: boolean;
  onError?: (error: Error) => void;
}

export const useAuthenticatedApi = (options: UseAuthenticatedApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { showErrorToast = true, onError } = options;

  const handleError = useCallback((err: Error) => {
    setError(err);
    if (showErrorToast) {
      toast({
        title: 'Request Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
    onError?.(err);
  }, [showErrorToast, toast, onError]);

  const request = useCallback(async <T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callBackend(path, options);
      return data as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const get = useCallback(<T = any>(path: string): Promise<T> => {
    return request<T>(path, { method: 'GET' });
  }, [request]);

  const post = useCallback(<T = any>(path: string, body: any): Promise<T> => {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }, [request]);

  const put = useCallback(<T = any>(path: string, body: any): Promise<T> => {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }, [request]);

  const del = useCallback(<T = any>(path: string): Promise<T> => {
    return request<T>(path, { method: 'DELETE' });
  }, [request]);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del
  };
};
