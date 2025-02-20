const aiMessageHandler = require("./aiMessageHandler");
const menuMessageHandler = require("./menuMessageHandler");
const greetingsHandler = require("./greetingsHandler");

const handlers = {
    "!ai": aiMessageHandler,
    "!menu": menuMessageHandler,
    "hi": greetingsHandler,
};

/**
 * Routes the message to the appropriate handler based on commands.
 * @param {import('whatsapp-web.js').Message} message - The received message object.
 */
async function messageHandler(message) {
    const command = message.body.split(" ")[0];
    await (handlers[command] || handlers["hi"])(message);
    // return resp;
}

module.exports = messageHandler;
