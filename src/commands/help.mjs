import log from '../log.mjs';
import { getMsg } from '../locales.mjs';

// Command handler for /help
export default async function (interaction) {
    log.debug("/help command invoked");
    const helpText = getMsg(interaction.locale, 'help', 'No help text available.');
    await interaction.reply({ content: helpText, flags: 1 << 6 });
}
