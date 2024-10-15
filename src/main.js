
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
        new winston.transports.File({ filename: 'logs/whatsapp-web.log' }),
        new winston.transports.Console()  // Still log to console
    ]
});

const app = express();
app.use(express.json());
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error, message: ${err.message}, Error: ${err.stack}`);
    res.status(500).json({ message: 'Error interno.', error: err.message });
});

// app.use(async (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'No autorizado' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const response = await fetch('https://gisul.com/validate-token', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 token,
//             }),
//         });

//         // If validation is successful
//         const data = await response.json();
//         if (response.ok && data.result) {
//             req.user = data;
//             next();
//         } else {
            // logger.info(`Token invalido: ${data}`);
//             return res.status(401).json({ message: 'Unauthorized: Token invalido' });
//         }
//     } catch (error) {
//         logger.error(`Error validando token: ${token}, Error: ${error.message}`);
//         return res.status(401).json({ message: 'Unauthorized' });
//     }
// });

let client;

const numberCode = '591';

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

            const qrImagePath = path.join(__dirname, '../whatsapp-qr.png');
            if (fs.existsSync(qrImagePath)) {
                fs.unlinkSync(qrImagePath);
            }

            try {
                let myWhatsAppID = client.info.wid._serialized;
                await client.sendMessage(myWhatsAppID, 'Cliente WhatsApp Listo!');
                logger.info(`Status notified to: ${myWhatsAppID}`);
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
        // return res.status(400).send({ message: 'EL Cliente WhatsApp esta encendido.' });
        logger.info("Re-encendido del Cliente WhatsApp capturado sin efecto, el cliente ya se encuentra encendido.");
        return res.status(200).send({ message: 'EL Cliente WhatsApp esta Iniciado Anteriormente.' });
    }
    try {
        logger.info('WhatsApp client is getting started...');
        const qrImagePath = path.join(__dirname, '../whatsapp-qr.png');
        if (fs.existsSync(qrImagePath)) { fs.unlinkSync(qrImagePath); }
        startClient();
        return res.status(200).send({ message: 'Encendiendo el Cliente WhatsApp...' });
    } catch (err) {
        logger.error(`Error initializing WhatsApp client: ${err.message}`);
    }
});

app.get('/test-token', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        return res.status(200).send({ message: 'token: ' + token, authorization: authHeader });
    } catch (error) {
        logger.error(`Error validando token: ${token}, Error: ${error.message}`);
        return res.status(401).json({ message: 'Unauthorized' });
    }
});
// app.get('/validate-token', async (req, res) => {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'No autorizado' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const response = await fetch('https://gisul.com/validate-token', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 token,
//             }),
//         });

//         // If validation is successful
//         const data = await response.json();
//         if (response.ok && data.result) {
//             req.user = data;
//             next();
//         } else {
//             logger.info(`Token invalido: ${data}`);
//             return res.status(401).json({ message: 'Unauthorized: Token invalido', resp: data });
//         }
//     } catch (error) {
//         logger.error(`Error validando token: ${token}, Error: ${error.message}`);
//         return res.status(401).json({ message: 'Unauthorized' });
//     }
// });

// Endpoint to start the WhatsApp client
app.get('/start-whatsapp-client', async (req, res) => {
    if (client) {
        logger.info("Re-encendido del Cliente WhatsApp capturado sin efecto, el cliente ya se encuentra encendido.");
        return res.status(200).send({ message: 'EL Cliente WhatsApp esta Iniciado anteriormente.' });
    }
    logger.info('WhatsApp client is getting started...');
    try {
        const qrImagePath = path.join(__dirname, '../whatsapp-qr.png');
        if (fs.existsSync(qrImagePath)) {
            fs.unlinkSync(qrImagePath);
        }

        await startClient();
        logger.info('WhatsApp Client is ready.');

        // if (fs.existsSync(qrImagePath)) return res.sendFile(qrImagePath);
        // else return res.status(200).send({ message: 'WhatsApp esta generando el Codigo QR.' });

        return res.status(200).send({ message: 'Cliente WhatsApp listo para el enlace.' });
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

    const qrImagePath = path.join(__dirname, '../whatsapp-qr.png');

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
app.get('/client-health-check', (req, res) => {
    // if (client && client.info && client.info.wid) {
    if (!client || !client.info || !client.info.wid) {
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

const deleteDyrectory = (directoryPath) => {

    if (fs.existsSync(directoryPath)) {
        fs.rm(directoryPath, { recursive: true, force: true }, (err) => {
            if (err) {
                logger.error(`Error deleting directory: ${directoryPath}, Error: ${err}`);
            } else {
                logger.info(`${directoryPath} directory deleted successfully`);
            }
        });
    }

}

app.get('/reset-log-in', async (req, res) => {
    try {

        if (client) await client.destroy();

        client = null;  // Reset the client instance
        if (client) {
            logger.error('WhatsApp Client has not been reset.');
            return res.status(400).send({ message: 'EL Cliente WhatsApp esta encendido.' });
        }

        const authPath = path.join(__dirname, '../.wwebjs_auth');
        deleteDyrectory(authPath);
        const cachePath = path.join(__dirname, '../.wwebjs_cache');
        deleteDyrectory(cachePath);
        const qrImagePath = path.join(__dirname, '../whatsapp-qr.png');
        if (fs.existsSync(qrImagePath)) {
            fs.unlinkSync(qrImagePath);
        }

        return res.status(200).send({ message: 'El cliente WhatsApp fue desvinculado.' });
        // await startClient();
        // logger.info('WhatsApp client is ready.');

        // if (fs.existsSync(qrImagePath)) return res.sendFile(qrImagePath);
        // else return res.status(200).send({ message: 'WhatsApp esta generando el Codigo QR.' });

    } catch (err) {
        logger.error(`Error initializing WhatsApp client: ${err.message}`);
        res.status(500).json({ message: 'Error al restablecer el cliente WhatsApp.', error: err.message });
    }
});

app.post('/send-text', sendMessageLimiter, async (req, res) => {
    const { number, text } = req.body;
//     client.sendMessage(`${numberCode}${number}@c.us`, text)
//         .then(response => res.status(200).send({ success: true, response }))
//         .catch(error => res.status(500).send({ success: false, error }));

    if (!number || !text) {
        return res.status(400).json({ message: 'Numero y mensaje son requeridos.' });
    }

    if (!client || !client.info) {
        return res.status(400).json({ message: 'El cliente aun no esta listo para enviar mensajes.' });
    }

    try {
        const chatId = `${numberCode}${number}@c.us`;
        await client.sendMessage(chatId, text);
        logger.info("Message sent successfully...");
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

    const chatId = `${numberCode}${number}@c.us`;  // WhatsApp format for sending messages
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

    const chatId = `${numberCode}${number}@c.us`;  // WhatsApp format for sending messages
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

    const chatId = `${numberCode}${number}@c.us`;  // WhatsApp format for sending messages
    const files = req.files;  // Array of uploaded files

    sendMultipleMediaFromMemory(chatId, files, res);
});


// Helper function to send multiple media with text
const sendTextAndMultipleMedia = async (chatId, textMessage, files, res) => {
    try {

        if (textMessage) {
            await client.sendMessage(chatId, textMessage);
        }

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

        await Promise.all(promises);

        logger.info("Message sent successfully...");
        res.status(200).json({ success: true, message: 'Enviado...' });
    } catch (err) {
        console.error('Error sending message and media:', err);
        res.status(500).json({ message: 'Error al enviar.', error: err.message });
    }
};

// Endpoint to send a text message with multiple media files
app.post('/send-text-with-multiple-media', sendMessageLimiter, upload.fields([
    { name: 'files', maxCount: 10 },
    { name: 'text' },
    { name: 'number' }
]), async (req, res) => {

    const { number, text } = req.body;

    // logger.info(`number: ${number || 'nothing'}, fileslength: ${req.files?.files?.length || 'void'} `);
    if (!number || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Numero y Archivo(s) Multimedia son requeridos.' });
    }

    if (!client || !client.info) {
        return res.status(400).json({ message: 'El cliente aun no esta listo para enviar mensajes.' });
    }

    const chatId = `${numberCode}${number}@c.us`;
    const files = req.files.files || [];
    const textMessage = text || '';

    // let buffer = Buffer.from(
    //     files[0].buffer,
    //     "base64"
    // );
    // fs.writeFile(files[0].originalname, buffer, (err) => {
    //     if (err) throw err;
    //     console.log("The file has been saved!");
    // });

    sendTextAndMultipleMedia(chatId, textMessage, files, res);
    // res.status(200).json({ success: true, message: 'Enviado...', lifeslength: files.length || 'nothing', chatId, textMessage });
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

// Response header for HTTP Strict Transport Security
// const helmet = require('helmet');
// app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true }));

const https = require('https');

const PORT_HTTPS = process.env.PORT_HTTPS || 3000;

// Middleware to redirect HTTP to HTTPS
const redirectToHttps = (req, res, next) => {
    if (!req.secure) {
        logger.info(`redirected from http to: https://${req.headers.host}${req.url}`);
        return res.redirect(301, `https://localhost:${PORT_HTTPS}${req.url}`);
    }
    next();
}

app.use(redirectToHttps);

// SSL cert files
const options = {
    key: fs.readFileSync('ssl/cert.key'),
    cert : fs.readFileSync('ssl/cert.crt')
}

const httpsServ = https.createServer(options, app);
httpsServ.listen(PORT_HTTPS, () => {
    logger.info(`HTTPS Server is running on PORT: ${PORT_HTTPS}`);
})

// const PORT_HTTP = process.env.PORT_HTTP || 3001;

// app.listen(PORT_HTTP, () => {
//     logger.info(`HTTP Server is running on PORT: ${PORT_HTTP}`);
// });
// const http = require('http');
// http.createServer((req, res) => {
//     // res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
//     res.writeHead(301, { Location: `https://localhost:${PORT_HTTPS}${req.url}` });
//     res.end();
// }).listen(PORT_HTTP);
// Handle shutdown signals (e.g., Ctrl+C)
// process.on('SIGINT', gracefulShutdown);

process.on('SIGINT', async () => {
    await gracefulShutdown();
});
// process.on('SIGTERM', gracefulShutdown);
process.on('SIGTERM', async () => {
    await gracefulShutdown();
});
