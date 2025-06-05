import "dotenv/config";
import log from "../log.mjs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function moderateMessageContent(text, imageUrls = []) {
    log.debug("Moderating message content:", { text, imageUrls });
    // Only allow 1 text and 1 image per request as per OpenAI Moderation API
    const input = [];
    if (text && text.trim().length > 0) {
        input.push({ type: "text", text });
    }
    if (imageUrls.length > 0) {
        input.push({ type: "image_url", image_url: { url: imageUrls[0] } });
    }
    if (input.length === 0) return null;
    try {
        return await openai.moderations.create({
            model: "omni-moderation-latest",
            input
        });
    } catch (error) {
        log.error("Moderation API error:", error);
        throw error;
    }
}
