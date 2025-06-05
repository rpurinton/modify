import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import handleMessageCreate from './messageCreate.mjs'; // Import the default export

// Event handler for messageUpdate
export default async function (oldMessage, newMessage) {
    log.debug('messageUpdate', { oldMessage, newMessage });
    await handleMessageCreate(newMessage); // Forward newMessage to messageCreate handler
}