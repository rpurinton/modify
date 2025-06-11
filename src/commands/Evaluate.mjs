import log from '../log.mjs';
import { getMsg } from '../locales.mjs';
import { moderateMessageContent } from "../custom/moderate.mjs";

export default async function (interaction, injectedLog = log, injectedModerate = moderateMessageContent) {
    injectedLog.debug("Evaluate command invoked");
    const targetMessage = interaction.targetMessage;
    if (!targetMessage) {
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_no_message', 'No message found to evaluate.', injectedLog), flags: 1 << 6 });
        return;
    }
    const categoryNames = getMsg(interaction.locale, 'categories', {}, injectedLog);

    const text = targetMessage.content;
    const imageAttachments = (targetMessage.attachments ? Array.from(targetMessage.attachments.values()) : [])
        .filter(att => att.contentType && att.contentType.startsWith("image/"));
    const imageUrls = imageAttachments.map(att => att.url);

    if (!text && imageUrls.length === 0) {
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_error', 'No messages or images to evaluate.', injectedLog), flags: 1 << 6 });
        return;
    }

    try {
        // Prepare moderation promises for text and each image
        const moderationPromises = [];
        if (text && text.trim().length > 0) {
            moderationPromises.push(
                injectedModerate(text, []).then(moderation => ({ moderation, type: 'text', text }))
            );
        }
        for (const url of imageUrls) {
            moderationPromises.push(
                injectedModerate('', [url]).then(moderation => ({ moderation, type: 'image', url }))
            );
        }
        const moderationResultsRaw = await Promise.all(moderationPromises);
        const moderationResults = moderationResultsRaw.filter(r => r.moderation && r.moderation.results && r.moderation.results.length);

        if (moderationResults.length === 0) {
            await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_no_results', 'No moderation results.', injectedLog), flags: 1 << 6 });
            return;
        }

        let first = true;
        for (const { moderation, type, text, url } of moderationResults) {
            const result = moderation.results[0];
            let results = Object.entries(result.category_scores || {})
                .map(([key, value]) => {
                    const formattedScore = Math.round(value * 100) + "%";
                    const category = categoryNames[key] || key;
                    return `${category}: ${formattedScore}`;
                })
                .join("\n");
            results = results.trim();
            // Patch: reply expects { content } not { results }
            if (first) {
                await interaction.reply({ content: results, flags: 1 << 6 });
                first = false;
            } else {
                await interaction.followUp({ content: results, flags: 1 << 6 });
            }
        }
    } catch (err) {
        injectedLog.error("Moderation error:", err);
        await interaction.reply({ content: getMsg(interaction.locale, 'evaluate_moderation_error', 'Moderation error.', injectedLog), flags: 1 << 6 });
    }
}
