import db from '../db.mjs';
import log from '../log.mjs';

export async function loadLogChannelsAndLocales(injectedDb = db, injectedLog = log) {
    injectedLog.debug('Loading log channels and locales from database...');
    const logChannels = {};
    const guildLocales = {};
    try {
        const [rows] = await injectedDb.query('SELECT guild_id, channel_id, guild_locale FROM log_channels WHERE channel_id IS NOT NULL');
        injectedLog.debug(`Loaded ${rows.length} log channels from database.`);
        for (const row of rows) {
            logChannels[row.guild_id] = row.channel_id;
            guildLocales[row.guild_id] = row.guild_locale;
        }
    } catch (err) {
        injectedLog.error('Failed to load log channels from DB:', err);
        throw err;
    }
    return { logChannels, guildLocales };
}
