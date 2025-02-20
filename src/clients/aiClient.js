
const ApiClient = require("./apiClient");

const apiClient = new ApiClient('https://generativelanguage.googleapis.com');

/**
 * Fetches AI-generated response from GeminiAI API using native fetch.
 * @param {string} prompt - The user message.
 * @returns A promise with parsed JSON response.
 */
async function getAIResponse(prompt) {

    const params = { key: process.env.AI_API_KEY ?? '' };
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    return await apiClient.post('/v1beta/models/gemini-1.5-flash:generateContent', params, body);

}

module.exports = { getAIResponse };
