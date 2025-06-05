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
        const moderationPromises = [];

        // Moderate text (if present)
        if (text && text.trim().length > 0) {
            moderationPromises.push(
                moderateMessageContent(text, []).then(moderation =>
                    moderation && moderation.results ? { moderation, type: 'text', text } : null
                )
            );
        }
        // Moderate each image (with no text)
        for (const url of imageUrls) {
            moderationPromises.push(
                moderateMessageContent('', [url]).then(moderation =>
                    moderation && moderation.results ? { moderation, type: 'image', url } : null
                )
            );
        }

        // Await all moderation requests in parallel
        const moderationResultsRaw = await Promise.all(moderationPromises);
        moderationResults = moderationResultsRaw.filter(Boolean);

        // Aggregate flagged results
        let textFlagged = [];
        let imageFlagged = [];
        moderationResults.forEach(({ moderation, type, text, url }) => {
            const flagged = moderation.results.filter(r => r.flagged).map(r => ({ result: r, type, text, url }));
            if (type === 'text') textFlagged.push(...flagged);
            else if (type === 'image') imageFlagged.push(...flagged);
        });
        if (textFlagged.length === 0 && imageFlagged.length === 0) return;

        const logChannelId = global.logChannels[message.guild.id];
        const categoryNames = getMsg(global.guildLocales?.[message.guild.id], 'categories', {});
        let violations = [];
        if (textFlagged.length > 0) {
            const { result, text } = textFlagged[0];
            const cats = Object.entries(result.categories || {})
                .filter(([cat, val]) => val)
                .map(([cat]) => {
                    const score = result.category_scores?.[cat] || 0;
                    const name = categoryNames[cat] || cat;
                    return `• **${name}**: ${(score * 100).toFixed(1)}%`;
                })
                .join("\n");
            let context = text ? text.substring(0, 300) : '(no text)';
            violations.push(`**Flagged Text:**\n${context}\n${cats}`);
        }
        imageFlagged.forEach(({ result, url }, idx) => {
            const cats = Object.entries(result.categories || {})
                .filter(([cat, val]) => val)
                .map(([cat]) => {
                    const score = result.category_scores?.[cat] || 0;
                    const name = categoryNames[cat] || cat;
                    return `• **${name}**: ${(score * 100).toFixed(1)}%`;
                })
                .join("\n");
            let context = `[Image ${idx + 1}](${url})`;
            violations.push(`**Flagged Image ${imageFlagged.length > 1 ? `#${idx + 1}` : ''}:**\n${context}\n${cats}`);
        });
        violations = violations.join("\n\n");

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
