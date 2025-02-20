
const { getAIResponse } = require('../clients/aiClient');

/**
 * Handles incoming WhatsApp messages.
 * @param {import('whatsapp-web.js').Message} message - The received message object.
 */
async function aiMessageHandler(message) {
    const userMessage = message.body.replace("!ai", "").trim();
    if (userMessage.length === 0) return;

    const response = await getAIResponse(userMessage);
    const textResp = response?.data?.candidates[0]?.content?.parts[0]?.text;
    message.reply(textResp ?? 'Lo siento intente mas tarde por favor...');
}

module.exports = aiMessageHandler;
