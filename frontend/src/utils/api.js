const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Generic fetch wrapper with error handling
 */
const apiFetch = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * Get all voucher metadata
 */
export const getAllVouchers = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/voucher-meta${queryString ? `?${queryString}` : ''}`;

    return await apiFetch(endpoint);
};

/**
 * Get single voucher metadata by tokenId
 */
export const getVoucherById = async (tokenId) => {
    return await apiFetch(`/voucher-meta/${tokenId}`);
};

/**
 * Create new voucher metadata (admin only)
 */
export const createVoucher = async (data) => {
    return await apiFetch('/voucher-meta', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * Upload image file
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    return await response.json();
};

/**
 * Get user statistics (optional)
 */
export const getUserStats = async (address) => {
    return await apiFetch(`/user/${address}/summary`);
};

/**
 * Auth: Get nonce for signing
 */
export const getNonce = async () => {
    return await apiFetch('/auth/nonce');
};

/**
 * Auth: Verify signature and login
 */
export const verifySignature = async (address, nonce, signature) => {
    return await apiFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ address, nonce, signature }),
    });
};
