import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import { moderateMessageContent } from '../custom/moderate.mjs';
import { EmbedBuilder } from 'discord.js';

/**
 * Handles message creation events to moderate content and log violations.
 * @param {import('discord.js').Message} message - The message object from Discord.
 * @param {object} [deps] - Optional injected dependencies for testing.
 * @param {object} [deps.log] - Logger to use (defaults to imported log).
 * @param {Function} [deps.moderateMessageContent] - Moderation function (defaults to imported moderateMessageContent).
 * @param {Function} [deps.getMsg] - Localization function (defaults to imported getMsg).
 * @returns {Promise<void>} - A promise that resolves when the moderation is complete.
 */
export default async function (message, deps = {}) {
    const injectedLog = deps.log || log;
    const injectedModerate = deps.moderateMessageContent || moderateMessageContent;
    const injectedGetMsg = deps.getMsg || getMsg;
    try {
        if (message.author.bot) return;
        if (!message.guild || !message.guild.id) return;
        if (!global.logChannels || !global.logChannels[message.guild.id]) return;
        const text = message.content;
        const imageAttachments = (message.attachments ? Array.from(message.attachments.values()) : [])
            .filter(att => att.contentType && att.contentType.startsWith("image/"));
        const imageUrls = imageAttachments.map(att => att.url);
        if (!text && imageUrls.length === 0) return;

        // Moderation results array
        const moderationPromises = [];

        // Moderate text (if present)
        if (text && text.trim().length > 0) {
            moderationPromises.push(
                injectedModerate(text, []).then(moderation =>
                    moderation && moderation.results ? { moderation, type: 'text', text } : null
                )
            );
        }
        // Moderate each image (with no text)
        for (const url of imageUrls) {
            moderationPromises.push(
                injectedModerate('', [url]).then(moderation =>
                    moderation && moderation.results ? { moderation, type: 'image', url } : null
                )
            );
        }

        // Await all moderation requests in parallel
        const moderationResultsRaw = await Promise.all(moderationPromises);
        const moderationResults = moderationResultsRaw.filter(Boolean);

        // Send a separate alert for each violation (text or image)
        const logChannelId = global.logChannels[message.guild.id];
        const categoryNames = injectedGetMsg(global.guildLocales?.[message.guild.id], 'categories', {});
        const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
        if (!logChannel || !logChannel.isTextBased()) return;

        for (const { moderation, type, text, url } of moderationResults) {
            const flagged = moderation.results.filter(r => r.flagged);
            for (const result of flagged) {
                const cats = Object.entries(result.categories || {})
                    .filter(([cat, val]) => val)
                    .map(([cat]) => {
                        const score = result.category_scores?.[cat] || 0;
                        const name = categoryNames[cat] || cat;
                        return `• **${name}**: ${(score * 100).toFixed(1)}%`;
                    })
                    .join("\n");
                let embed;
                if (type === 'text') {
                    embed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle(message.url + ` • <t:${Math.floor(Date.now() / 1000)}:R>`)
                        .setDescription(`<@${message.author.id}>: ${text ? text.substring(0, 300) : '(no text)'}\n${cats}`)
                        .setTimestamp(message.createdAt)
                        .setFooter({ text: `User: ${message.author.tag} (${message.author.id})` });
                } else if (type === 'image') {
                    embed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle(message.url + ` • <t:${Math.floor(Date.now() / 1000)}:R>`)
                        .setDescription(`<@${message.author.id}>\n${cats}`)
                        .setImage(url)
                        .setTimestamp(message.createdAt)
                        .setFooter({ text: `User: ${message.author.tag} (${message.author.id})` });
                }
                await logChannel.send({ embeds: [embed] });
            }
        }
    } catch (err) {
        injectedLog.error("Moderation error:", err);
        try {
            const logChannelId = global.logChannels?.[message.guild?.id];
            const logChannel = logChannelId ? await message.guild.channels.fetch(logChannelId).catch(() => null) : null;
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ content: `Moderation error: ${err?.message || err}` });
            }
        } catch (logErr) {
            injectedLog.error("Failed to send error to log channel:", logErr);
        }
    }
}
