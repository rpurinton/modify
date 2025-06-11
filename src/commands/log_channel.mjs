import dbPromise, { createDb } from '../db.mjs';
import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
export default async function (interaction, injectedDbPromise = dbPromise, injectedLog = log) {
    if (!interaction.memberPermissions.has('ManageGuild')) {
        injectedLog.warn('Log channel command invoked by non-admin user:', interaction.user && interaction.user.id);
        const msg = getMsg(interaction.locale, 'log_channel_admin_only', 'This command is for administrators only.', injectedLog);
        await interaction.reply({ content: msg, flags: 1 << 6 });
        return;
    }
    const channel = interaction.channel;
    if (!channel) {
        injectedLog.error('Log channel command invoked without a valid channel.');
        await interaction.reply({ content: 'Invalid channel.', flags: 1 << 6 });
        return;
    }
    try {
        const injectedDb = await injectedDbPromise;
        await injectedDb.execute(
            `INSERT INTO log_channels (guild_id, channel_id, guild_locale) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), guild_locale = VALUES(guild_locale)`,
            [interaction.guild.id, channel.id, interaction.guild.preferredLocale]
        );
        if (!global.logChannels) global.logChannels = {};
        if (!global.guildLocales) global.guildLocales = {};
        global.logChannels[interaction.guild.id] = channel.id;
        global.guildLocales[interaction.guild.id] = interaction.guild.preferredLocale;
    } catch (err) {
        injectedLog.error('DB error:', err);
        const msg = getMsg(interaction.locale, 'log_channel_error', 'Failed to set log channel.', injectedLog);
        await interaction.reply({ content: msg, flags: 1 << 6 });
        return;
    }
    injectedLog.info(`Log channel set for guild ${interaction.guild.id} to ${channel.id}`);
    const msg = `${getMsg(interaction.locale, 'log_channel_confirm', 'Log channel set to', injectedLog)} <#${channel.id}>`;
    await interaction.reply({ content: msg, flags: 1 << 6 });
}
