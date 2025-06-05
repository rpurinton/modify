import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import { moderateMessageContent } from '../custom/moderate.mjs';
import { EmbedBuilder } from 'discord.js';

/**
 * Handles message creation events to moderate content and log violations.
 * @param {import('discord.js').Message} message - The message object from Discord.
 * @returns {Promise<void>} - A promise that resolves when the moderation is complete.
 */
export default async function (message) {
    try {
        if (message.author.bot) return;
        if (!message.guild || !message.guild.id) return;
        if (!global.logChannels || !global.logChannels[message.guild.id]) return;
        const text = message.content;
        const imageAttachments = (message.attachments ? Array.from(message.attachments.values()) : [])
            .filter(att => att.contentType && att.contentType.startsWith("image/"));
        const imageUrls = imageAttachments.map(att => att.url);
        if (!text && imageUrls.length === 0) return;
        const moderation = await moderateMessageContent(text, imageUrls);
        if (!moderation) return;
        const flaggedResult = moderation.results.find(r => r.flagged);
        if (!flaggedResult) return;
        const logChannelId = global.logChannels[message.guild.id];
        const categoryNames = getMsg(global.guildLocales?.[message.guild.id], 'categories', {});
        const violations = Object.entries(flaggedResult.categories || {})
            .filter(([cat, val]) => val)
            .map(([cat]) => {
                const score = flaggedResult.category_scores?.[cat] || 0;
                const name = categoryNames[cat] || cat;
                return `• **${name}**: ${(score * 100).toFixed(1)}%`;
            })
            .join("\n");
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(message.url + ` • <t:${Math.floor(Date.now() / 1000)}:R>`)
            .setDescription(`<@${message.author.id}>\n${text ? text.substring(0, 1500) : "(no text)"}\n\n${violations}`)
            .setTimestamp(message.createdAt)
            .setFooter({ text: `User: ${message.author.tag} (${message.author.id})` });
        if (imageUrls.length > 0) {
            embed.setImage(imageUrls[0]);
            if (imageUrls.length > 1) {
                embed.addFields({ name: "Images", value: imageUrls.slice(1).map((u, i) => `[Image ${i + 2}](${u})`).join("\n") });
            }
        }
        const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        log.error("Moderation error:", err);
        try {
            const logChannelId = global.logChannels?.[message.guild?.id];
            const logChannel = logChannelId ? await message.guild.channels.fetch(logChannelId).catch(() => null) : null;
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ content: `Moderation error: ${err?.message || err}` });
            }
        } catch (logErr) {
            log.error("Failed to send error to log channel:", logErr);
        }
    }
}
