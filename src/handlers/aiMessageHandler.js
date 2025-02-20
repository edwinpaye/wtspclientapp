// const { getAIResponse } = require("../clients/aiClient");

// /**
//  * Handles incoming WhatsApp messages.
//  * @param {import('whatsapp-web.js').Message} message - The received message object.
//  */
// async function aiMessageHandler(message) {
//     const userMessage = message.body.replace("!ai", "").trim();
//     if (userMessage.length === 0) return;

//     const response = await getAIResponse(userMessage);
//     message.reply(response);
// }

// module.exports = aiMessageHandler;
