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
