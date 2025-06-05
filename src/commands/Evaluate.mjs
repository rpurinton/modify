import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import { moderateMessageContent } from "../custom/moderate.mjs";

export default async function (interaction) {
    log.debug("Evaluate command invoked");
    const targetMessage = interaction.targetMessage;
    if (!targetMessage) {
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_no_message', 'No message found to evaluate.'), flags: 1 << 6 });
        return;
    }
    const categoryNames = getMsg(interaction.locale, 'categories', {});

    const text = targetMessage.content;
    const imageAttachments = (targetMessage.attachments ? Array.from(targetMessage.attachments.values()) : [])
        .filter(att => att.contentType && att.contentType.startsWith("image/"));
    const imageUrls = imageAttachments.map(att => att.url);

    if (!text && imageUrls.length === 0) {
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_error', 'No messages or images to evaluate.'), flags: 1 << 6 });
        return;
    }

    try {
        const moderation = await moderateMessageContent(text, imageUrls);
        if (!moderation || !moderation.results.length) {
            await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_no_results', 'No moderation results.'), flags: 1 << 6 });
            return;
        }
        const result = moderation.results[0];
        let results = Object.entries(result.category_scores || {})
            .map(([key, value]) => {
                const formattedScore = Math.round(value * 100) + "%";
                const category = categoryNames[key] || key;
                return `${category}: ${formattedScore}`;
            })
            .join("\n");
        results = results.trim();
        await interaction.reply({ content: results, flags: 1 << 6 });
    } catch (err) {
        log.error("Moderation error:", err);
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_moderation_error', 'Moderation error.'), flags: 1 << 6 });
    }
}
