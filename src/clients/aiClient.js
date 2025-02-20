
// /**
//  * Fetches AI-generated response from OpenAI API using native fetch.
//  * @param {string} prompt - The user message.
//  * @returns {Promise<string>} - AI-generated response.
//  */
// async function getAIResponse(prompt) {
//     try {

//         const response = await fetch("https://api.openai.com/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 model: "gpt-3.5-turbo",
//                 messages: [{ role: "user", content: prompt }],
//             }),
//         });

//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//         const data = await response.json();
//         return data.choices[0]?.message?.content || "🤖 Sorry, I couldn't generate a response.";
//     } catch (error) {
//         console.error("AI API Error:", error);
//         return "🤖 Error fetching AI response.";
//     }
// }

// module.exports = { getAIResponse };

