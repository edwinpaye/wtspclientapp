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