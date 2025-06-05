import { jest } from '@jest/globals';
import messageCreate from '../../src/events/messageCreate.mjs';

describe('messageCreate event', () => {
    function makeMessage(overrides = {}) {
        return {
            author: { bot: false, id: 'u1', tag: 'User#1' },
            guild: { id: 'g1', channels: { fetch: jest.fn().mockResolvedValue({ isTextBased: () => true, send: jest.fn() }) } },
            content: 'hello',
            attachments: new Map(),
            url: 'msgurl',
            createdAt: new Date(),
            ...overrides
        };
    }
    it('skips bot messages', async () => {
        const log = { error: jest.fn() };
        const msg = makeMessage({ author: { bot: true } });
        await messageCreate(msg, { log });
        expect(log.error).not.toHaveBeenCalled();
    });
    it('calls moderate and logs flagged', async () => {
        const flagged = { results: [{ flagged: true, categories: { spam: true }, category_scores: { spam: 0.9 } }] };
        const moderateMessageContent = jest.fn().mockResolvedValue(flagged);
        const log = { error: jest.fn() };
        const send = jest.fn();
        const msg = makeMessage({
            guild: { id: 'g1', channels: { fetch: jest.fn().mockResolvedValue({ isTextBased: () => true, send }) } },
            content: 'bad',
        });
        global.logChannels = { g1: 'chan1' };
        global.guildLocales = { g1: 'en' };
        const getMsg = jest.fn().mockReturnValue({ spam: 'Spam' });
        await messageCreate(msg, { log, moderateMessageContent, getMsg });
        expect(moderateMessageContent).toHaveBeenCalled();
        expect(send).toHaveBeenCalled();
    });
    it('logs error if thrown', async () => {
        const moderateMessageContent = jest.fn().mockRejectedValue(new Error('fail'));
        const log = { error: jest.fn() };
        const send = jest.fn();
        const msg = makeMessage({
            guild: { id: 'g1', channels: { fetch: jest.fn().mockResolvedValue({ isTextBased: () => true, send }) } },
            content: 'bad',
        });
        global.logChannels = { g1: 'chan1' };
        global.guildLocales = { g1: 'en' };
        const getMsg = jest.fn().mockReturnValue({ spam: 'Spam' });
        await messageCreate(msg, { log, moderateMessageContent, getMsg });
        expect(log.error).toHaveBeenCalled();
    });
});
