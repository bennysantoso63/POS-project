/**
 * AuthService: Logika Autentikasi (Restored Version)
 */
export class AuthService {
    constructor(apiClient) {
        this.client = apiClient;
    }

    async loginPin(pin) {
        return this.client.fetchWithResilience('/api/auth/login-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
    }

    async loginPassword(username, password) {
        return this.client.fetchWithResilience('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    }
}
