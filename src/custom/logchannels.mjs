import db from '../db.mjs';
import log from '../log.mjs';

export async function loadLogChannelsAndLocales() {
    log.debug('Loading log channels and locales from database...');
    const logChannels = {};
    const guildLocales = {};
    try {
        const [rows] = await db.query('SELECT guild_id, channel_id, guild_locale FROM log_channels WHERE channel_id IS NOT NULL');
        log.debug(`Loaded ${rows.length} log channels from database.`);
        for (const row of rows) {
            logChannels[row.guild_id] = row.channel_id;
            guildLocales[row.guild_id] = row.guild_locale;
        }
    } catch (err) {
        log.error('Failed to load log channels from DB:', err);
        throw err;
    }
    return { logChannels, guildLocales };
}
