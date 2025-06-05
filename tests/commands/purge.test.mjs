import { jest } from '@jest/globals';
import purge from '../../src/commands/purge.mjs';

describe('purge command', () => {
    function makeInteraction(overrides = {}) {
        return {
            memberPermissions: { has: (perm) => overrides.memberHas ?? true },
            appPermissions: { has: (perm) => overrides.appHas ?? true },
            options: {
                getInteger: (key) => overrides.amount ?? 10,
                getString: (key) => overrides.contains ?? null,
                getBoolean: (key) => overrides[key] ?? false,
                getUser: (key) => overrides.user ?? null,
            },
            channel: {
                id: 'chan1',
                messages: { fetch: async () => new Map(overrides.messages ?? []) },
                bulkDelete: async (msgs, _bool) => msgs,
            },
            user: { id: 'user1' },
            app: { id: 'app1' },
            locale: 'en',
            reply: jest.fn(async function (opts) { this._reply = opts; }),
            _reply: null,
            ...overrides
        };
    }
    it('denies non-admin', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({ memberHas: false });
        await purge(interaction, log);
        expect(log.warn).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/permission/);
    });
    it('denies if app lacks permission', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({ appHas: false });
        await purge(interaction, log);
        expect(log.warn).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/permission/);
    });
    it('denies invalid amount', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({ amount: 0 });
        await purge(interaction, log);
        expect(log.warn).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/Invalid/);
    });
    it('deletes messages', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const messages = [
            ['1', { author: { id: 'user1', bot: false }, content: 'hi', embeds: [] }],
            ['2', { author: { id: 'user2', bot: false }, content: 'yo', embeds: [] }],
        ];
        const interaction = makeInteraction({ messages });
        await purge(interaction, log);
        expect(log.info).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/Purged messages/);
    });
    it('no messages to delete', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = makeInteraction({ messages: [] });
        await purge(interaction, log);
        expect(log.info).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/No messages to delete/);
    });
});
