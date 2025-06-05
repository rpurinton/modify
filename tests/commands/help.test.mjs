import { jest } from '@jest/globals';
import help from '../../src/commands/help.mjs';

describe('help command', () => {
    it('replies with help text', async () => {
        const log = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
        const interaction = {
            locale: 'en',
            reply: jest.fn(async function (opts) { this._reply = opts; }),
            _reply: null
        };
        await help(interaction, log);
        expect(log.debug).toHaveBeenCalled();
        expect(interaction._reply.content).toMatch(/help/i);
    });
});
