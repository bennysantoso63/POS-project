/**
 * BaseClient: Infrastruktur Jaringan dengan Resilience (Final Alignment)
 * Nama metode diselaraskan dengan kontrak asli: fetchWithResilience
 */
export class BaseClient {
    constructor(baseUrl, defaultTimeout = 10000) {
        this.baseUrl = baseUrl;
        this.defaultTimeout = defaultTimeout;
    }

    /**
     * fetchWithResilience: Gerbang utama jaringan dengan timeout dan normalisasi.
     */
    async fetchWithResilience(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP_ERROR_${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('NETWORK_TIMEOUT');
            }
            throw error;
        }
    }
}
