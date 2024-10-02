
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
