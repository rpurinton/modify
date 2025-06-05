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

        // Moderation results array
        let moderationResults = [];

        // Moderate text (if present)
        if (text && text.trim().length > 0) {
            const moderation = await moderateMessageContent(text, []);
            if (moderation && moderation.results) {
                moderationResults.push({ moderation, type: 'text', text });
            }
        }
        // Moderate each image (with no text)
        for (const url of imageUrls) {
            const moderation = await moderateMessageContent('', [url]);
            if (moderation && moderation.results) {
                moderationResults.push({ moderation, type: 'image', url });
            }
        }

        // Aggregate flagged results
        const flagged = moderationResults.flatMap(({ moderation, type, text, url }) =>
            moderation.results.filter(r => r.flagged).map(r => ({ result: r, type, text, url }))
        );
        if (flagged.length === 0) return;

        const logChannelId = global.logChannels[message.guild.id];
        const categoryNames = getMsg(global.guildLocales?.[message.guild.id], 'categories', {});
        let violations = flagged.map(({ result, type, text, url }, idx) => {
            const cats = Object.entries(result.categories || {})
                .filter(([cat, val]) => val)
                .map(([cat]) => {
                    const score = result.category_scores?.[cat] || 0;
                    const name = categoryNames[cat] || cat;
                    return `• **${name}**: ${(score * 100).toFixed(1)}%`;
                })
                .join("\n");
            let context = type === 'text' ? (text ? text.substring(0, 300) : '(no text)') : `[Image](${url})`;
            return `**Flagged ${type === 'text' ? 'Text' : 'Image'}${flagged.length > 1 ? ` #${idx+1}` : ''}:**\n${context}\n${cats}`;
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(message.url + ` • <t:${Math.floor(Date.now() / 1000)}:R>`)
            .setDescription(`<@${message.author.id}>\n${violations}`)
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
