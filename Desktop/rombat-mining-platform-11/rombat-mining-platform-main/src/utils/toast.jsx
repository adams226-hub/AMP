import toast from 'react-hot-toast';

/**
 * Utilitaires pour les notifications toast
 */
export const toastSuccess = (message) => toast.success(message, {
  duration: 4000,
  position: 'top-right',
});

export const toastError = (message, title = 'Erreur') => toast.error(message, {
  duration: 5000,
  position: 'top-right',
});

export const toastLoading = (message) => toast.loading(message, { 
  position: 'top-right' 
});

export const toastDismiss = () => toast.dismiss();

export default {
  success: toastSuccess,
  error: toastError,
  loading: toastLoading,
  dismiss: toastDismiss,
};
