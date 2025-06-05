import { jest } from '@jest/globals';
import log_channel from '../../src/commands/log_channel.mjs';

describe('log_channel command', () => {
    function makeInteraction(overrides = {}) {
        return {
            memberPermissions: { has: (perm) => overrides.memberHas ?? true },
            channel: overrides.channel ?? { id: 'chan1' },
            guild: { id: 'guild1', preferredLocale: 'en' },
            user: { id: 'user1' },
            locale: 'en',
            reply: jest.fn(async function (opts) { this._reply = opts; }),
            _reply: null,
            ...overrides
        };
    }
    it('denies non-admin', async () => {
        const log = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
        const db = { execute: jest.fn() };
        const interaction = makeInteraction({ memberHas: false });
        await log_channel(interaction, db, log);
        expect(log.warn).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/administrators/i);
    });
    it('denies if no channel', async () => {
        const log = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
        const db = { execute: jest.fn() };
        const interaction = makeInteraction({ channel: null });
        await log_channel(interaction, db, log);
        expect(log.error).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/Invalid channel/);
    });
    it('handles db error', async () => {
        const log = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
        const db = { execute: jest.fn().mockRejectedValue(new Error('fail')) };
        const interaction = makeInteraction();
        await log_channel(interaction, db, log);
        expect(log.error).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/Failed to set log channel/);
    });
    it('sets log channel', async () => {
        const log = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
        const db = { execute: jest.fn().mockResolvedValue() };
        const interaction = makeInteraction();
        global.logChannels = {};
        global.guildLocales = {};
        await log_channel(interaction, db, log);
        expect(log.info).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/Log channel set to/);
    });
});
