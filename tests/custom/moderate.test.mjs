import { jest } from '@jest/globals';
import { moderateMessageContent } from '../../src/custom/moderate.mjs';

describe('moderateMessageContent', () => {
    it('calls injectedOpenai and injectedLog', async () => {
        const fakeResult = { results: [{ flagged: true, categories: { spam: true }, category_scores: { spam: 0.9 } }] };
        const injectedOpenai = { moderations: { create: jest.fn().mockResolvedValue(fakeResult) } };
        const injectedLog = { debug: jest.fn(), error: jest.fn() };
        const res = await moderateMessageContent('test', [], injectedLog, injectedOpenai);
        expect(injectedLog.debug).toHaveBeenCalled();
        expect(injectedOpenai.moderations.create).toHaveBeenCalled();
        expect(res).toBe(fakeResult);
    });
    it('returns null if no input', async () => {
        const injectedLog = { debug: jest.fn(), error: jest.fn() };
        const injectedOpenai = { moderations: { create: jest.fn() } };
        const res = await moderateMessageContent('', [], injectedLog, injectedOpenai);
        expect(res).toBeNull();
    });
    it('logs and throws on error', async () => {
        const injectedOpenai = { moderations: { create: jest.fn().mockRejectedValue(new Error('fail')) } };
        const injectedLog = { debug: jest.fn(), error: jest.fn() };
        await expect(moderateMessageContent('bad', [], injectedLog, injectedOpenai)).rejects.toThrow('fail');
        expect(injectedLog.error).toHaveBeenCalled();
    });
});
