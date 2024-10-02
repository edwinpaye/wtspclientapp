
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const express = require('express');
const fs = require('fs');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const path = require('path');

const multer = require('multer');
const mime = require('mime-types');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const rateLimit = require('express-rate-limit');

// Rate limit for message sending (5 requests per minute)
const sendMessageLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 5,  // Limit each IP to 5 requests per windowMs
    message: 'Demaciados mensajes enviados, espere un momento.'
});

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    //     format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.json()
    //     ),
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'whatsapp-client.log' }),
        new winston.transports.Console()  // Still log to console
    ]
});

const app = express();
app.use(express.json());
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Error interno.', message: err.message });
});

let client;

const startClient = () => {

    try {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                // headless: true,
                args: ["--no-sandbox"],
            },
        });

        client.on('qr', (qr) => {
            logger.info('QR code received.');

            // Generate QR code and save it to a file
            qrcode.toFile('./whatsapp-qr.png', qr, (err) => {
                if (err) {
                    logger.error('Error generating QR code image:', err);
                } else {
                    logger.info('QR code saved as whatsapp-qr.png');
                }
            });

            // Codigo QR en la terminal
            qrcodeTerminal.generate(qr, { small: true });
        });

        client.on('ready', async () => {
            logger.info('WhatsApp client is ready!');
            
            // Optionally delete the QR code after successful login
            const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');
            if (fs.existsSync(qrImagePath)) {
                fs.unlinkSync(qrImagePath);  // Clean up the QR code after authentication
            }

            let myWhatsAppID = client.info.wid._serialized;
            logger.info('Your WhatsApp ID is:', myWhatsAppID);

            try {
                await client.sendMessage(myWhatsAppID, 'Cliente WhatsApp Listo!');
            } catch (err) {
                logger.error(`Error sending message to yourself: ${err.message}`);
            }
            // const webhookUrl = 'https://gisul.com/webhook';
            // fetch(webhookUrl, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         id: message.id._serialized,
            //         from: message.from,
            //         body: message.body,
            //         timestamp: message.timestamp
            //     })
            // }).then(response => {
            //     console.log('Webhook response:', response.status);
            // }).catch(error => {
            //     console.error('Webhook error:', error);
            // });
        });

        client.on('disconnected', (reason) => {
            logger.info(`Client was logged out or disconnected: ${reason}`);

            // Reconectar
            // setTimeout(() => {
            //     logger.info('Attempting to reconnect the client...');
            //     startClient();
            // }, 5000);  // reconectar despues de 5 segundos
        });

        // Track messages sent/received
        // client.on('message', (message) => {
        //     console.log({
        //         id: message.id._serialized,
        //         from: message.from,
        //         body: message.body,
        //         timestamp: new Date().toISOString()
        //     });
        // });

        // Error handling
        client.on('auth_failure', (msg) => {
            logger.error(`Auth failure: ${msg}`);
        });

        // Start the client
        client.initialize();
    } catch (err) {
        logger.error(`Error initializing WhatsApp client: ${err.message}`);
    }
};

// Endpoint to start the WhatsApp client
app.get('/start', (req, res) => {
    if (client) {
        return res.status(400).send('Client is already running.');
    }
    startClient();
    logger.info('WhatsApp client started.');
    return res.status(200).send('WhatsApp client started.');
});

// Endpoint to stop the WhatsApp client
app.get('/stop', (req, res) => {
    if (!client) {
        return res.status(400).send('Client is not running.');
    }

    client.destroy();
    client = null;  // Reset the client instance
    logger.info('WhatsApp client stopped.');
    return res.status(200).send('WhatsApp client stopped.');
});

// Endpoint to get QR code (if available)
app.get('/qr', (req, res) => {
    const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');

    if (fs.existsSync(qrImagePath)) {
        res.sendFile(qrImagePath);
    } else {
        res.status(404).send('Whatsapp esta generando el Codigo QR.');
    }
});

// const media = MessageMedia.fromFilePath('./path/to/file.jpg');
// client.sendMessage('123456789@c.us', media);

// Create a new WhatsApp client
// const client = new Client({
//     authStrategy: new LocalAuth(),  // Stores session so you don’t need to scan QR code repeatedly
//     puppeteer: {
//         // puppeteer args here
//         // headless:false,
//         args: ["--no-sandbox"],
//         // executablePath: '/usr/bin/chromium-browser',
//     },
//     // locking the wweb version
//     // webVersionCache: {
//     //     type: 'remote',
//     //     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
//     // },
// });

// // Event listener to handle incoming messages
// client.on('message', message => {
//     console.log(`Received message: ${message.body}`);
//     if (message.body === 'ping') {
//         message.reply('pong');
//     }
// });

// Send a message through an API
// app.post('/send', (req, res) => {
//     const { number, message } = req.body;
//     client.sendMessage(`${number}@c.us`, message)
//         .then(response => res.status(200).send({ success: true, response }))
//         .catch(error => res.status(500).send({ success: false, error }));
// });
app.post('/send', sendMessageLimiter, async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Numero y mensaje son requeridos.' });
    }

    if (!client || !client.info) {
        return res.status(400).json({ error: 'El cliente aun no esta listo para enviar mensajes.' });
    }

    try {
        const chatId = `${number}@c.us`;
        await client.sendMessage(chatId, message);
        res.status(200).json({ success: true, message: `Message sent to ${number}` });
    } catch (err) {
        logger.error(`Error sending message: ${err}`);
        res.status(500).json({ error: 'Error al enviar mensaje.', clientError: err });
    }
});

// Endpoint for health check
app.get('/health', (req, res) => {
    if (client && client.info && client.info.wid) {
    // if (!client || !client.info) {
        return res.status(500).json({
            status: 'Client is not healthy',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    }

    res.status(200).json({
        status: 'Client is healthy',
        clientInfo: client.info,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        connected: client.info.connected
    });
});

app.get('/pause', (req, res) => {
    if (!client) {
        return res.status(400).send('Client is not running.');
    }
    
    client.pupPage.close();
    logger.info('WhatsApp client paused.');
    return res.status(200).send('WhatsApp client paused.');
});

app.get('/resume', (req, res) => {
    if (!client) {
        return res.status(400).send('Client is not running.');
    }

    client.pupPage.open();
    logger.info('WhatsApp client resumed.')
    return res.status(200).send('WhatsApp client resumed.');
});

const gracefulShutdown = () => {
    logger.info('Shutting down server...');
    if (client) {
        client.destroy()
            .then(() => {
                logger.info('WhatsApp client stopped.');
                process.exit(0);
            })
            .catch((err) => {
                logger.error(`Error during client shutdown: ${err.message}`);
                process.exit(1);
            });
    } else {
        process.exit(0);
    }
};

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on PORT: ${PORT}`);
});

// Handle shutdown signals (e.g., Ctrl+C)
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);





// Helper function to send media from memory
const sendMediaFromMemory = async (chatId, buffer, originalName, res) => {
    try {
        // Get the MIME type of the file based on the extension
        const mimeType = mime.lookup(originalName) || 'application/octet-stream';
        
        // Convert the file buffer to base64
        const base64Media = buffer.toString('base64');

        // Create MessageMedia with the base64 content
        const messageMedia = new MessageMedia(mimeType, base64Media, originalName);

        // Send the media to the specified chat
        await client.sendMessage(chatId, messageMedia);
        res.status(200).json({ success: true, message: `Media sent to ${chatId}` });
    } catch (err) {
        console.error('Error sending media:', err);
        res.status(500).json({ error: `Failed to send media: ${err.message}` });
    }
};

// Endpoint to send media (image, video, document, etc.) from memory
app.post('/send-media', upload.single('media'), async (req, res) => {
    const { number } = req.body;

    if (!number || !req.file) {
        return res.status(400).json({ error: 'Phone number and media file are required.' });
    }

    const chatId = `${number}@c.us`;  // WhatsApp format for sending messages
    const mediaBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    sendMediaFromMemory(chatId, mediaBuffer, originalName, res);
});
