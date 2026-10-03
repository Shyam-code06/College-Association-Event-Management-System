import toast from 'react-hot-toast';

export const handleApiError = (error, setError = null) => {
  const response = error?.response?.data;

  // 1. If backend provided field-level validation errors and a setError hook is passed
  if (response?.errors && Array.isArray(response.errors) && setError) {
    let hasFieldErrors = false;
    response.errors.forEach((err) => {
      if (err.field) {
        setError(err.field, {
          type: 'server',
          message: err.message,
        });
        hasFieldErrors = true;
      }
    });

    if (hasFieldErrors) return;
  }

  // 2. Generic message toast
  const message = response?.message || error?.message || 'An unexpected error occurred. Please try again.';
  toast.error(message);
};
