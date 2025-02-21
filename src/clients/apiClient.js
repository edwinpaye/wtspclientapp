
/**
 * Api Client
 */
class ApiClient {
    constructor(baseUrl, defaultOptions = {}, defaultRetries = 3) {
        this.baseUrl = baseUrl;
        this.defaultOptions = {
            timeout: 5000, // Default timeout of 5 seconds
            retries: defaultRetries, // Default number of retries
            ...defaultOptions,
        };
        this.defaultRetries = defaultRetries;
    }

    /**
     * Makes a POST request with URL parameters and handles potential errors.
     * @param {string} endpoint The API endpoint (e.g., '/users').
     * @param {object} params An object containing the request parameters.
     * @param {object} body The request body (optional).
     * @param {object} options Additional request options.
     * @returns A promise that resolves to the parsed JSON response.
     */
    async post(endpoint, params, body = null, options = {}) {
        const url = this.buildUrl(endpoint, params);
        const mergedOptions = { ...this.defaultOptions, ...options };
        const stringBody = body ? JSON.stringify(body) : null;

        try {
            const response = await this.fetchWithTimeout(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Assuming JSON, adjust as needed
                        ...mergedOptions.headers,
                    },
                    body: stringBody,
                },
                mergedOptions.timeout
            );

            const statusCode = response.status;
            if (statusCode > 299 || statusCode < 200) {
                return this.handleNonOkResponse(response);
            }

            const data = await response.json();
            return { data, success: true, statusCode };
        } catch (error) {
            console.error('Fetch error:', error);
            return { data: null, success: false, error: this.getErrorMessage(error) };
        }
    }

    /**
     * Attempts to fetch a resource with retries on failure.
     *
     * @param {string} url The URL to fetch.
     * @param {object} init The fetch request init options.
     * @param {number} timeout The request timeout in milliseconds.
     * @param {number} retries The number of retries.
     * @returns The fetch response, or rejects with an error after max retries.
     */
    async fetchWithTimeout(url, init, timeout, retries = this.defaultRetries) {
        // const controller = new AbortController();
        // const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // const response = await fetch(url, { ...init, signal: controller.signal });
            const response = await fetch(url, { ...init });
            // clearTimeout(timeoutId); // Clear timeout if the request completes before timing out.
            return response;
        } catch (error) {
            // clearTimeout(timeoutId);
            if (retries > 0 && error.name !== 'AbortError') {
                console.log(`Retrying fetch, ${retries} retries remaining`);
                await new Promise(resolve => setTimeout(resolve, this.getRetryDelay(this.defaultRetries - retries + 1))); // Exponential backoff
                return this.fetchWithTimeout(url, init, timeout, retries - 1);
            }
            throw error; // Re-throw the error if retries are exhausted
        }
    }

    /**
     * Builds a URL with the given endpoint and parameters.
     * @param {string} endpoint The base endpoint.
     * @param {object} params An object of key-value pairs to be added as query parameters.
     * @returns The constructed URL.
     */
    buildUrl(endpoint, params) {
        const url = new URL(this.baseUrl + endpoint);
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                const value = params[key];
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            }
        }
        return url.toString();
    }

    /**
     * Handles responses that are not 'ok' (status code outside 200-299 range).
     * @param {object} response The fetch response.
     */
    async handleNonOkResponse(response) {
        let errorMessage;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || `Request failed with status ${response.status}`;
        } catch (parseError) {
            errorMessage = `Request failed with status ${response.status} and could not parse error body.`;
        }

        console.error('API Error:', errorMessage);
        return { data: null, success: false, error: errorMessage, statusCode: response.status };
    }

    /**
     * Gets a user-friendly error message from an error object.
     * @param {object} error The error object.
     * @returns An error message.
     */
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        } else if (typeof error === 'string') {
            return error;
        } else {
            return 'An unexpected error occurred.';
        }
    }

    /**
     * Calculates an exponential backoff delay.
     * @param {number} retryCount The number of retries that have been attempted.
     * @returns The delay in milliseconds.
     */
    getRetryDelay(retryCount) {
        return Math.pow(2, retryCount) * 100; // Exponential backoff (100ms, 200ms, 400ms...)
    }

}

module.exports = ApiClient;
