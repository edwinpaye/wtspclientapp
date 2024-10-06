// const schedule = require('node-schedule');
// const messageService = require('./messageService');

// let scheduledMessages = [];

// exports.scheduleMessage = (messageData, sendTime) => {
//     const job = schedule.scheduleJob(sendTime, async function () {
//         try {
//             await messageService.sendMessage(messageData.to, messageData.text, messageData.media);
//             console.log(`Message sent to ${messageData.to} at ${new Date()}`);
//         } catch (error) {
//             console.error(`Error sending message to ${messageData.to}:`, error);
//         }
//     });

//     scheduledMessages.push({
//         id: job.id,
//         messageData,
//         sendTime,
//         job
//     });

//     return job.id;
// };

// exports.cancelScheduledMessage = (jobId) => {
//     const job = schedule.scheduledJobs[jobId];
//     if (job) {
//         job.cancel();
//         scheduledMessages = scheduledMessages.filter(msg => msg.id !== jobId);
//         return true;
//     }
//     return false;
// };

// exports.getScheduledMessages = () => {
//     return scheduledMessages;
// };
