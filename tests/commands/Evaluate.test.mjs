import { jest } from '@jest/globals';
import Evaluate from '../../src/commands/Evaluate.mjs';

describe('Evaluate command', () => {
    function makeInteraction(overrides = {}) {
        return {
            targetMessage: overrides.targetMessage,
            locale: 'en',
            reply: jest.fn(async function (opts) { this._reply = opts; }),
            _reply: null,
            ...overrides
        };
    }
    it('replies if no targetMessage', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({ targetMessage: null });
        await Evaluate(interaction, log, jest.fn());
        expect(interaction._reply.content).toMatch(/No message/);
    });
    it('replies if no text or images', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({
            targetMessage: { content: '', attachments: new Map() }
        });
        await Evaluate(interaction, log, jest.fn());
        expect(interaction._reply.content).toMatch(/No messages or images/);
    });
    it('replies if no moderation results', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const moderate = jest.fn().mockResolvedValue({ results: [] });
        const interaction = makeInteraction({
            targetMessage: { content: 'test', attachments: new Map() }
        });
        await Evaluate(interaction, log, moderate);
        expect(interaction._reply.content).toMatch(/No moderation results/);
    });
    it('replies with results', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const moderate = jest.fn().mockResolvedValue({ results: [{ category_scores: { spam: 0.9 }, flagged: true }] });
        const interaction = makeInteraction({
            targetMessage: { content: 'test', attachments: new Map() }
        });
        await Evaluate(interaction, log, moderate);
        expect(interaction._reply.content).toMatch(/spam/i);
    });
    it('handles moderation error', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const moderate = jest.fn().mockRejectedValue(new Error('fail'));
        const interaction = makeInteraction({
            targetMessage: { content: 'test', attachments: new Map() }
        });
        await Evaluate(interaction, log, moderate);
        expect(interaction._reply.content).toMatch(/Moderation error/);
    });
});
