const greetings = [
    "Hello! 😊 How can I assist you?",
    "Hi there! 👋 What do you need help with?",
    "Hey! 🤖 I'm here to assist you. Type !ai for AI response like: !ai hi how are you?.",
    "Welcome! 🚀 Type !ai followed by a question to chat with AI like: !ai hi how are you?.",
];

/**
 * Routes the message to the appropriate handler based on commands.
 * @param {import('whatsapp-web.js').Message} message - The received message object.
 */
async function defaultHandler(message) {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    await message.reply(randomGreeting);
    // return randomGreeting;
}

module.exports = defaultHandler;

// Aquí tienes algunos ejemplos de cómo puedes pedirme que actúe como un asistente de ventas, dependiendo de la situación:
// Ejemplo 1 (General): Actúa como un asistente de ventas para un producto.  El producto es una aspiradora robot inteligente con navegación láser y capacidad de mapeo.  Describe sus características principales y beneficios, y crea un guion de ventas corto para convencer a un cliente indeciso.
// Ejemplo 2 (Específico con un cliente ficticio): Soy un asistente de ventas y tengo un cliente al teléfono que está interesado en una suscripción anual a nuestro software de edición de vídeo.  El cliente está indeciso debido al precio.  Actúa como el cliente y yo actuaré como el vendedor.  Ayúdame a responder a sus objeciones sobre el precio y a cerrar la venta, destacando los beneficios de la suscripción.
// Ejemplo 3 (Enfoque en objeciones): Necesito ayuda para manejar objeciones de clientes.  Estoy vendiendo una membresía a un gimnasio de alta gama.  Los clientes se quejan del precio elevado.  Dame tres argumentos de venta sólidos para superar esta objeción, enfocándome en el valor a largo plazo y los beneficios exclusivos.
// Ejemplo 4 (Creación de material de marketing): Necesito ayuda para crear un eslogan y una breve descripción para un nuevo tipo de café instantáneo orgánico y con bajo contenido de azúcar.  Actúa como un asistente de ventas y crea opciones convincentes para destacar los puntos fuertes del producto.
// Recuerda ser lo más específico posible en tu solicitud.  Cuanta más información me des sobre el producto, el cliente objetivo y las objeciones comunes, mejor podré ayudarte a desempeñar mi papel de asistente de ventas.
