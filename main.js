const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// const { MessageMedia } = require('whatsapp-web.js');
// const media = MessageMedia.fromFilePath('./path/to/file.jpg');
// client.sendMessage('123456789@c.us', media);

// const wwebVersion = '2.2409.0';

// Create a new WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),  // Stores session so you don’t need to scan QR code repeatedly
    puppeteer: {
        // puppeteer args here
        // headless:false,
        args: ["--no-sandbox"]
    },
    // locking the wweb version
    // webVersionCache: {
    //     type: 'remote',
    //     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    // },
});

// Event listener for QR code generation
client.on('qr', (qr) => {
    // Generate and display the QR code in the terminal
    qrcode.generate(qr, { small: true });
});

// Event listener when the client is ready
client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

// Event listener to handle incoming messages
client.on('message', message => {
    console.log(`Received message: ${message.body}`);
    if (message.body === 'ping') {
        message.reply('pong');
    }
});

// Start the client
client.initialize();

// Api rest to manage whatsapp client linked
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Send a message through an API
app.post('/send', (req, res) => {
    const { number, message } = req.body;
    client.sendMessage(`${number}@c.us`, message)
        .then(response => res.status(200).send({ success: true, response }))
        .catch(error => res.status(500).send({ success: false, error }));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
