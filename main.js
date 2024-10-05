
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
    logger.error(`Unhandled Error, message: ${err.message}, Error: ${err.stack}`);
    res.status(500).json({ message: 'Error interno.', error: err.message });
});

let client;

const startClient = async () => {

    // try {
        // Create a new WhatsApp client
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                // headless: true,
                args: ["--no-sandbox"],
                // executablePath: '/usr/bin/chromium-browser',
            },
            // locking the wweb version
            // webVersionCache: {
            //     type: 'remote',
            //     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
            // },
        });

        client.on('qr', (qr) => {
            logger.info('QR code received.');

            // Generate QR code and save it to a file
            qrcode.toFile('./whatsapp-qr.png', qr, (err) => {
                if (err) {
                    logger.error(`Error generating QR code image: ${err.message}`);
                } else {
                    logger.info('QR code saved as whatsapp-qr.png');
                }
            });

            // Codigo QR en la terminal
            qrcodeTerminal.generate(qr, { small: true });
        });

        client.on('ready', async () => {
            logger.info('Log-in was successfull, WhatsApp client is ready!');
            
            // Optionally delete the QR code after successful login
            const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');
            if (fs.existsSync(qrImagePath)) {
                fs.unlinkSync(qrImagePath);
            }

            try {
                let myWhatsAppID = client.info.wid._serialized;
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
        //     logger.info({
        //         id: message.id._serialized,
        //         from: message.from,
        //         body: message.body,
        //         timestamp: new Date().toISOString()
        //     });
        //     if (message.body === 'ping') {
        //         message.reply('pong');
        //     }
        // });

        // Error handling
        client.on('auth_failure', (msg) => {
            logger.error(`Auth failure: ${msg}`);
        });

        // Start the client
        await client.initialize();
    // } catch (err) {
    //     logger.error(`Error initializing WhatsApp client: ${err.message}`);
    // }
};

// Endpoint to start the WhatsApp client
app.get('/start-client', (req, res) => {
    if (client) {
        return res.status(400).send({ message: 'EL Cliente WhatsApp esta encendido.' });
    }
    startClient();
    logger.info('WhatsApp client is getting started...');
    return res.status(200).send({ message: 'Encendiendo el Cliente WhatsApp...' });
});

// Endpoint to start the WhatsApp client
app.get('/start-whatsapp-client', async (req, res) => {
    if (client) {
        return res.status(400).send({ message: 'EL Cliente WhatsApp esta encendido.' });
    }
    try {
        await startClient();
        logger.info('WhatsApp client is getting started...');

        const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');

        if (fs.existsSync(qrImagePath)) return res.sendFile(qrImagePath);
        else return res.status(200).send({ message: 'WhatsApp esta generando el Codigo QR.' });

        // return res.status(200).send({ message: 'Encendiendo el Cliente WhatsApp...' });
    } catch (err) {
        logger.error(`Error initializing WhatsApp client: ${err.message}`);
        res.status(500).json({ message: 'Error al iniciar el cliente WhatsApp.', error: err.message });
    }
});

// Endpoint to stop the WhatsApp client
app.get('/stop-client', async (req, res) => {
    if (!client) {
        return res.status(400).send({ message: 'El Cliente WhatsApp no esta encendido.' });
    }

    await client.destroy();
    client = null;  // Reset the client instance
    logger.info('WhatsApp client stopped.');
    return res.status(200).send({ message: 'Cliente WhatsApp apagado.' });
});

// Endpoint to get QR code (if available)
app.get('/qr', (req, res) => {
    if (!client) {
        return res.status(400).send({ message: 'El Cliente WhatsApp no esta encendido.' });
    }

    const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');

    if (fs.existsSync(qrImagePath)) {
        res.sendFile(qrImagePath);
    } else {
        res.status(404).send({ message: 'WhatsApp esta generando el Codigo QR.' });
    }
});

// Endpoint to get the status of the WhatsApp client
app.get('/client-status', (req, res) => {
    if (!client) {
        return res.status(400).json({ message: 'WhatsApp Cliente no esta encendido.' });
    }

    return res.status(200).json({ message: 'Cliente WhatsApp esta encendido.' });
});

// Endpoint for health check
app.get('/health-check', (req, res) => {
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

app.post('/send-text', sendMessageLimiter, async (req, res) => {
    const { number, text } = req.body;
//     client.sendMessage(`${number}@c.us`, text)
//         .then(response => res.status(200).send({ success: true, response }))
//         .catch(error => res.status(500).send({ success: false, error }));

    if (!number || !text) {
        return res.status(400).json({ message: 'Numero y mensaje son requeridos.' });
    }

    if (!client || !client.info) {
        return res.status(400).json({ message: 'El cliente aun no esta listo para enviar mensajes.' });
    }

    try {
        const chatId = `${number}@c.us`;
        await client.sendMessage(chatId, text);
        res.status(200).json({ success: true, message: 'Enviado...' });
    } catch (err) {
        logger.error(`Error sending message: ${err}`);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
});

// app.get('/pause', (req, res) => {
//     if (!client) {
//         return res.status(400).send('Client WhatsApp no esta encendido.');
//     }
    
//     client.pupPage.close();
//     logger.info('WhatsApp client paused.');
//     return res.status(200).send('WhatsApp client pausado.');
// });

// app.get('/resume', (req, res) => {
//     if (!client) {
//         return res.status(400).send('Client WhatsApp no esta encendido.');
//     }

//     client.pupPage.open();
//     logger.info('WhatsApp client resumed.')
//     return res.status(200).send('Cliente WhatsApp Listo.');
// });

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
        res.status(200).json({ success: true, message: 'Enviado...' });
    } catch (err) {
        console.error('Error sending media:', err);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
};

// Endpoint to send media (image, video, document, etc.) from memory
app.post('/send-media', sendMessageLimiter, upload.single('media'), async (req, res) => {
    const { number } = req.body;

    if (!number || !req.file) {
        return res.status(400).json({ message: 'Numero y Archivo Multimedia son requeridos.' });
    }

    const chatId = `${number}@c.us`;  // WhatsApp format for sending messages
    const mediaBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    sendMediaFromMemory(chatId, mediaBuffer, originalName, res);
});

// Helper function to send text and media in the same message
const sendTextAndMediaTogether = async (chatId, textMessage, file, res) => {
    try {
        // Get the MIME type of the file based on the extension
        const mimeType = mime.lookup(file.originalname) || 'application/octet-stream';

        // Convert the file buffer to base64
        const base64Media = file.buffer.toString('base64');

        // Create MessageMedia with the base64 content
        const messageMedia = new MessageMedia(mimeType, base64Media, file.originalname);

        // Send the media with the caption (text message) to the specified chat
        await client.sendMessage(chatId, messageMedia, { caption: textMessage });

        res.status(200).json({ success: true, message: 'Mensaje enviado' });
    } catch (err) {
        logger.error(`Error sending message and media: ${err.message}`);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
};

// Endpoint to send a text message with media in the same message
app.post('/send-text-with-media', sendMessageLimiter, upload.single('media'), async (req, res) => {
    const { number, text } = req.body;

    if (!number || !req.file) {
        return res.status(400).json({ messsage: 'Numero y archivo multimedia son requeridos.' });
    }

    const chatId = `${number}@c.us`;  // WhatsApp format for sending messages
    const textMessage = text || '';  // Text message (optional)
    const file = req.file;  // Uploaded media file

    sendTextAndMediaTogether(chatId, textMessage, file, res);
});

const sendMultipleMediaFromMemory = async (chatId, files, res) => {
    try {
        const promises = files.map((file) => {
            // Get the MIME type of the file based on the extension
            const mimeType = mime.lookup(file.originalname) || 'application/octet-stream';
            
            // Convert the file buffer to base64
            const base64Media = file.buffer.toString('base64');

            // Create MessageMedia with the base64 content
            const messageMedia = new MessageMedia(mimeType, base64Media, file.originalname);

            // Send the media to the specified chat
            return client.sendMessage(chatId, messageMedia);
        });

        // Wait for all media to be sent
        await Promise.all(promises);

        res.status(200).json({ success: true, message: 'Enviado...' });
    } catch (err) {
        console.error(`Error sending media: ${err.message}`);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
};

// Endpoint to send multiple media files from memory
app.post('/send-multiple-media', sendMessageLimiter, upload.array('media', 10), async (req, res) => {
    const { number } = req.body;

    if (!number || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Numero y Archivo(s) Multimedia son requeridos.' });
    }

    const chatId = `${number}@c.us`;  // WhatsApp format for sending messages
    const files = req.files;  // Array of uploaded files

    sendMultipleMediaFromMemory(chatId, files, res);
});


// Helper function to send multiple media with text
const sendTextAndMultipleMedia = async (chatId, textMessage, files, res) => {
    try {
        // If text message is provided, send it as the first message
        if (textMessage) {
            await client.sendMessage(chatId, textMessage);
        }

        // Send each media file one by one
        const promises = files.map((file) => {
            // Get the MIME type of the file based on the extension
            const mimeType = mime.lookup(file.originalname) || 'application/octet-stream';

            // Convert the file buffer to base64
            const base64Media = file.buffer.toString('base64');

            // Create MessageMedia with the base64 content
            const messageMedia = new MessageMedia(mimeType, base64Media, file.originalname);

            // Send the media with a caption (if provided)
            return client.sendMessage(chatId, messageMedia);
        });

        // Wait for all media to be sent
        await Promise.all(promises);

        res.status(200).json({ success: true, message: 'Enviado...' });
    } catch (err) {
        console.error('Error sending message and media:', err);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
};

// Endpoint to send a text message with multiple media files
app.post('/send-text-with-multiple-media', sendMessageLimiter, upload.array('media', 10), async (req, res) => {
    const { number, text } = req.body;

    if (!number || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Numero y Archivo(s) Multimedia son requeridos.' });
    }

    const chatId = `${number}@c.us`;  // WhatsApp format for sending messages
    const files = req.files;  // Array of uploaded files
    const textMessage = text || '';  // Text message (optional)

    sendTextAndMultipleMedia(chatId, textMessage, files, res);
});

const gracefulShutdown = async () => {
    logger.info('Shutting down server...');
    try {
        if (client) {
            logger.info('Logging out the WhatsApp client...');
            await client.logout();
            // await client.destroy();
        }

        logger.info('Cleanup complete. Exiting...');
        process.exit(0);
    } catch (error) {
        logger.error(`Error during shutdown: ${error.message}`);
        process.exit(1);
    }
};

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on PORT: ${PORT}`);
});

// Handle shutdown signals (e.g., Ctrl+C)
// process.on('SIGINT', gracefulShutdown);
process.on('SIGINT', async () => {
    await gracefulShutdown();
});
// process.on('SIGTERM', gracefulShutdown);
process.on('SIGTERM', async () => {
    await gracefulShutdown();
});
