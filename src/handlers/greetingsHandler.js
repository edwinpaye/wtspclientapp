const greetings = [
    "Hello! 😊 How can I assist you?",
    "Hi there! 👋 What do you need help with?",
    "Hey! 🤖 I'm here to assist you. Type !menu for options.",
    "Welcome! 🚀 Type !ai followed by a question to chat with AI.",
];

/**
 * Routes the message to the appropriate handler based on commands.
 * @param {import('whatsapp-web.js').Message} message - The received message object.
 */
async function defaultHandler(message) {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    await message.reply(randomGreeting);
}

module.exports = defaultHandler;
