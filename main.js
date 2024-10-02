
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


        // Start the client
        client.initialize();
    } catch (err) {
        logger.error(`Error initializing WhatsApp client: ${err.message}`);
    }
};
