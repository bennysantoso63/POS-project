import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * useNotify: LING-LING POS NOTIFICATION HUB
 * Standardisasi feedback UI untuk menghilangkan prop drilling showToast.
 */
export const useNotify = () => {
    
    /**
     * notifySuccess: Notifikasi untuk operasi yang berhasil.
     */
    const notifySuccess = useCallback((message) => {
        toast.success(message, {
            id: 'global-success', // Mencegah spam toast yang sama
            duration: 3000,
            style: {
                background: '#141E30',
                color: '#53D2DC',
                border: '1px solid rgba(83, 210, 220, 0.2)',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            iconTheme: {
                primary: '#53D2DC',
                secondary: '#141E30',
            },
        });
    }, []);

    /**
     * notifyError: Notifikasi untuk kegagalan.
     * @param {string} message - Pesan user-friendly
     * @param {any} errorObject - Objek error untuk debugging (optional)
     */
    const notifyError = useCallback((message, errorObject = null) => {
        if (errorObject) {
            console.error(`[SYSTEM_ERROR] ${message}:`, errorObject);
        }

        const displayMessage = errorObject?.message 
            ? `${message} (${errorObject.message})` 
            : message;

        toast.error(displayMessage, {
            id: 'global-error',
            duration: 5000,
            style: {
                background: '#141E30',
                color: '#F43F5E',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            iconTheme: {
                primary: '#F43F5E',
                secondary: '#141E30',
            },
        });
    }, []);

    /**
     * notifyInfo: Notifikasi informasi umum (lunar event, dsb)
     */
    const notifyInfo = useCallback((message) => {
        toast(message, {
            icon: '🌙',
            duration: 4000,
            style: {
                background: '#141E30',
                color: '#FFE66D',
                border: '1px solid rgba(255, 230, 109, 0.2)',
                fontSize: '12px',
                fontWeight: 'bold'
            }
        });
    }, []);

    return { notifySuccess, notifyError, notifyInfo };
};
