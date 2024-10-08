# wtspclientapp

starting a new project
```bash
npm init -y
npm install whatsapp-web.js qrcode-terminal express
```

git clone and then run this:

```bash
npm install
```

then:

```bash
node main.js
```

All of this will run an express server and a whatsapp client to link.

Test: 

```bash
POST /send
Content-Type: application/json
{
  "number": "123456789",
  "message": "Hi there"
}
```

Test:

```bash
curl -X POST http://200.119.202.91:3000/send -H "Content-Type: application/json" -d '{"number": 59169729249, "message": "hi from my machine throw ssh"}'
```

To build docker image:

```bash
sudo docker build -t [image-name] .
```

To Run Docker Container:

```bash
sudo docker run -d --name [container-name] -p [port-container]:[port-project] [IMAGE-NAME]:[TAG]
```

To check container logs:

```bash
sudo docker logs [container-name || container-ID]
```

Stream Logs:

```bash
sudo docker logs -f [container-name || container-ID]
```

To copy files to container:

```bash
sudo docker cp <container_id_or_name>:/path/in/container /path/on/host
```

---

## **WhatsApp API Documentation**

### **Base URL Example**:
`http://localhost:3000`

### **Endpoints Overview**:
1. **Client Management Endpoints**
    - Start/Stop client
    - Client status and health checks
2. **Message Management Endpoints**
    - Send text messages
    - Send media messages
    - Send multiple media
    - Manage media content (upload/send)
4. **Error Handling**
    - Return appropriate status codes for various states

---

### **1. Client Management Endpoints**

#### **1.1. Start WhatsApp Client**

- **Endpoint**: `POST /start-client`
- **Description**: Starts the WhatsApp client and initiates QR code scanning for login.
- **Response**:
    - **200**: `{ message: 'Encendiendo el Cliente WhatsApp...' }`
    - **400**: `{ message: 'EL Cliente WhatsApp esta encendido.' }`
    - **500**: `{ message: 'Error interno.', error: <error message> }`

#### **1.2. Stop WhatsApp Client**

- **Endpoint**: `POST /stop-client`
- **Description**: Stops and logs out the WhatsApp client gracefully.
- **Response**:
    - **200**: `{ message: 'Cliente WhatsApp apagado.' }`
    - **400**: `{ message: 'El Cliente WhatsApp no esta encendido.' }`
    - **500**: `{ message: 'Error interno.', error: <error message> }`

#### **1.3. Get QR code (if available)**

- **Endpoint**: `GET /qr`
- **Description**: Returns the WhatsApp client QR Code if it's running disconnected.
- **Response**:
    - **200**: `Type<Static File (octetStream)> whatsapp-qr.png.`
    - **400**: `{ message: 'El Cliente WhatsApp no esta encendido.' }`
    - **404**: `{ message: 'WhatsApp esta generando el Codigo QR.' }`
    - **500**: `{ message: 'Error interno.', error: <error message> }`

#### **1.4. Client Status Check**

- **Endpoint**: `GET /client-status`
- **Description**: Returns the status of the WhatsApp client (whether it’s running or disconnected).
- **Response**:
    - **200**: `{ "message": "WhatsApp Cliente no esta encendido." }`
    - **400**: `{ "message": "Cliente WhatsApp esta encendido." }`

#### **1.5. Health Check**

- **Endpoint**: `GET /client-health-check`
- **Description**: Basic health check to see if the server and WhatsApp client are running.
- **Response**:
    - **200**: `{
        status: 'Client is healthy',
        clientInfo: <client info>,
        uptime: <process uptime>,
        memoryUsage: <process memoryUsage>,
        connected: <client info connected>
    }`
    - **500**: `{
        status: 'Client is not healthy',
        uptime: <process uptime>,
        memoryUsage: <process memoryUsage>
    }`

#### **1.6. Client Reset Log-In**

- **Endpoint**: `GET /reset-log-in`
- **Description**: Reset the WhatsApp client Log-in (whether it’s running or disconnected).
- **Response**:
    - **200**: `{ "message": 'El cliente WhatsApp fue desvinculado.' }`
    - **400**: `{ "message": "Cliente WhatsApp esta encendido." }`
    - **500**: `{ "message": 'Error al restablecer el cliente WhatsApp.', error: <error message> }`

---

### **2. Message Management Endpoints**

#### **2.1. Send Text Message**

- **Endpoint**: `POST /send-text`
- **Description**: Send a text message to a specific WhatsApp number.
- **Body Request example (always region number first like 591)**:
    ```json
    {
        "number": "59177777777}",
        "text": "Hello, this is a test message."
    }
    ```
- **Response**:
    - **200**: `{ success: true, message: 'Enviado...' }`
    - **400**: `{ message: 'Numero y mensaje son requeridos.' }`
    - **400**: `{ message: 'El cliente aun no esta listo para enviar mensajes.' }`
    - **500**: `{ message: 'Error al enviar.', error: <error message> }`

#### **2.2. Send Single Media**

- **Endpoint**: `POST /send-media`
- **Description**: Send a single media file (image, video, document) to a WhatsApp number.
- **Request** (Multipart form-data):
    - Field `number`: Target phone number.
    - Field `media`: Media file to upload.
- **Response**:
    - **200**: `{ success: true, message: 'Enviado...' }`
    - **400**: `{ message: 'Numero y Archivo Multimedia son requeridos.' }`
    - **500**: `{ message: 'Error al enviar.', error: <error message> }`

#### **2.3. Send Single Media with Text**

- **Endpoint**: `POST /send-text-with-media`
- **Description**: Send a single media file (image, video, document) to a WhatsApp number along with an optional text message.
- **Request** (Multipart form-data):
    - Field `number`: Target phone number.
    - Field `media`: Media file to upload.
    - Field `text`: Optional text message.
- **Response**:
    - **200**: `{ success: true, message: 'Mensaje enviado' }`
    - **400**: `{ messsage: 'Numero y archivo multimedia son requeridos.' }`
    - **500**: `{ message: 'Error al enviar.', error: <error message> }`

#### **2.4. Send Multiple Media**

- **Endpoint**: `POST /send-multiple-media`
- **Description**: Send multiple media files to a specific WhatsApp number.
- **Request** (Multipart form-data):
    - Field `number`: Target phone number.
    - Field `media`: Multiple media files.
- **Response**:
    - **200**: `{ success: true, message: 'Enviado...' }`
    - **400**: `{ message: 'Numero y Archivo(s) Multimedia son requeridos.' }`
    - **500**: `{ message: 'Error al enviar.', error: <error message> }`

#### **2.5. Send Text and Multiple Media**

- **Endpoint**: `POST /send-text-with-multiple-media`
- **Description**: Send a text message along with multiple media files to a specific WhatsApp number.
- **Request** (Multipart form-data):
    - Field `number`: Target phone number.
    - Field `text`: Optional text message.
    - Field `media`: Multiple media files.
- **Response**:
    - **200**: `{ success: true, message: 'Enviado...' }`
    - **400**: `{ message: 'Numero y Archivo(s) Multimedia son requeridos.' }`
    - **500**: `{ message: 'Error al enviar.', error: <error message> }`

---

### **Error Codes**

- **400 Bad Request**: Occurs when required parameters (like `number`, `text`, or `media`) are missing.
- **500 Internal Server Error**: Occurs during issues related to server errors, such as failure to send a message or issue with the WhatsApp client.

---

### **Summary**

This API provides comprehensive endpoints for managing WhatsApp client and messaging functionalities. It allows you to:
- Start/stop the WhatsApp client.
- Send text and media messages (including multiple media contents).
- Perform health checks and client status checks.
- Manage media without saving it to disk.

These endpoints cover the core functionality required to build a robust WhatsApp service using `whatsapp-web.js`.