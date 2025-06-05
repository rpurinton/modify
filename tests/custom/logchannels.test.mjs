import { jest } from '@jest/globals';
import { loadLogChannelsAndLocales } from '../../src/custom/logchannels.mjs';

describe('loadLogChannelsAndLocales', () => {
    it('loads channels and locales from db', async () => {
        const rows = [
            { guild_id: '1', channel_id: 'c1', guild_locale: 'en' },
            { guild_id: '2', channel_id: 'c2', guild_locale: 'fr' },
        ];
        const injectedDb = { query: jest.fn().mockResolvedValue([rows]) };
        const injectedLog = { debug: jest.fn(), error: jest.fn() };
        const result = await loadLogChannelsAndLocales(injectedDb, injectedLog);
        expect(result.logChannels['1']).toBe('c1');
        expect(result.guildLocales['2']).toBe('fr');
        expect(injectedLog.debug).toHaveBeenCalled();
    });
    it('logs and throws on db error', async () => {
        const injectedDb = { query: jest.fn().mockRejectedValue(new Error('fail')) };
        const injectedLog = { debug: jest.fn(), error: jest.fn() };
        await expect(loadLogChannelsAndLocales(injectedDb, injectedLog)).rejects.toThrow('fail');
        expect(injectedLog.error).toHaveBeenCalled();
    });
});
