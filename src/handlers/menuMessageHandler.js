// const { Buttons } = require("whatsapp-web.js");

// /**
//  * Handles incoming WhatsApp messages.
//  * @param {import('whatsapp-web.js').Message} message - The received message object.
//  */
// async function menuMessageHandler(message) {
//     const menu = new Buttons(
//         "📌 Choose an option:",
//         [{ body: "📜 About" }, { body: "💬 Contact" }, { body: "🔍 Help" }],
//         "🤖 AI Bot Menu",
//         "Select an option below"
//     );

//     await message.reply(menu);
// }

// module.exports = menuMessageHandler;

const { List } = require("whatsapp-web.js");

/**
 * Sends a menu with list options.
 * @param {import('whatsapp-web.js').Message} message - The received message object.
 */
async function menuMessageHandler(message) {
    const menu = new List(
        "📌 Select an option below:", // Message body
        "View Options", // Button text
        [
            {
                title: "Menu Options", // Section title
                rows: [
                    { id: "about", title: "📜 About", description: "Learn more about this bot" },
                    { id: "contact", title: "💬 Contact", description: "Get support or contact us" },
                    { id: "help", title: "🔍 Help", description: "How to use this bot" }
                ],
            }
        ],
        "🤖 AI Bot Menu", // Header
        "Choose an option:" // Footer
    );

    await message.getChat().then(chat => chat.sendMessage(menu));
}

module.exports = menuMessageHandler;
