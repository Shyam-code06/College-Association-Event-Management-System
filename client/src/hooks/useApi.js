import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiFunc, options = {}) => {
  const { immediate = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        // Backend envelope: { success, data, meta }
        const resData = response?.data !== undefined ? response.data : response;
        setData(resData);
        if (response?.meta) {
          setMeta(response.meta);
        }
        if (onSuccess) onSuccess(resData, response);
        return response;
      } catch (err) {
        setError(err);
        if (onError) onError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    meta,
    isLoading,
    error,
    refetch: execute,
    setData,
  };
};

export default useApi;
