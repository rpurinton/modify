import dbPromise, { createDb } from '../db.mjs';
import log from '../log.mjs';

export async function loadLogChannelsAndLocales(injectedDbPromise = dbPromise, injectedLog = log) {
    injectedLog.debug('Loading log channels and locales from database...');
    // Debug: log the type and keys of injectedDbPromise
    injectedLog.debug('injectedDbPromise type:', typeof injectedDbPromise, 'keys:', Object.keys(injectedDbPromise));
    const injectedDb = await injectedDbPromise;
    if (typeof injectedDb.query !== 'function') {
        injectedLog.error('Injected DB does not have a .query method. injectedDb:', injectedDb);
        throw new Error('Injected DB does not have a .query method.');
    }
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
