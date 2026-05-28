import { jest } from '@jest/globals';
import { hostname } from 'os';
import { Readable } from 'stream';

await jest.unstable_mockModule('@sentry/node', () => ({
    default: {
        init: jest.fn(),
        captureMessage: jest.fn(),
        getGlobalScope: jest.fn(() => ({
            setPropagationContext: jest.fn(),
        })),
        tracingContext: {},
        PropagationContext: class {},
    },
    init: jest.fn(),
    captureMessage: jest.fn(),
    getGlobalScope: jest.fn(() => ({
        setPropagationContext: jest.fn(),
    })),
    tracingContext: {},
    PropagationContext: class {},
}));

const Sentry = await import('@sentry/node');
const GoodSentry = (await import('../src/index')).default;

const internals = {
    readStream() {
        const result = new Readable({ objectMode: true });
        result._read = () => {};
        return result;
    },
};

describe('GoodSentry', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('inits sentry without dsn and with default options', async () => {
        // eslint-disable-next-line no-unused-vars
        const reporter = new GoodSentry();
        expect(Sentry.init).toHaveBeenCalledWith(
            expect.objectContaining({
                environment: '',
                logger: '',
                name: hostname(),
                release: '',
                integrations: expect.any(Function),
            }),
        );
    });

    it('inits sentry with dsn if provided', async () => {
        // eslint-disable-next-line no-unused-vars
        const reporter = new GoodSentry({
            dsn: 'https://<key>@sentry.io/<project>',
        });
        expect(Sentry.init).toHaveBeenCalledWith(
            expect.objectContaining({
                dsn: 'https://<key>@sentry.io/<project>',
                environment: '',
                logger: '',
                name: hostname(),
                release: '',
                integrations: expect.any(Function),
            }),
        );
    });

    it('inits sentry with config options merged', async () => {
        // eslint-disable-next-line no-unused-vars
        const reporter = new GoodSentry({ config: { environment: 'production' } });
        expect(Sentry.init).toHaveBeenCalledWith(
            expect.objectContaining({
                environment: 'production',
                logger: '',
                name: hostname(),
                release: '',
                integrations: expect.any(Function),
            }),
        );
    });

    it('disables global handlers if captureUncaught is false', async () => {
        // eslint-disable-next-line no-unused-vars
        const reporter = new GoodSentry({ captureUncaught: false });
        expect(Sentry.init).toHaveBeenCalledWith(
            expect.objectContaining({
                integrations: expect.any(Function),
            }),
        );
        const integrations = Sentry.init.mock.calls[0][0].integrations([]);
        const globalHandlers = integrations.filter(
            (i) => i.name && ['OnUncaughtException', 'OnUnhandledRejection'].includes(i.name),
        );
        expect(globalHandlers.length).toBe(0);
    });

    it('sends each event individually', async () => {
        const stream = internals.readStream();
        const reporter = new GoodSentry();
        const logLevels = ['warning', 'info', 'error', 'fatal'];
        const tags = ['database', 'query'];
        const tagMap = { database: true, query: true };

        stream.pipe(reporter);

        for (let i = 0; i < logLevels.length + 1; ++i) {
            stream.push({
                event: 'log',
                data: `Some message: ${i}`,
                tags: i > 0 ? [logLevels[i - 1], ...tags] : tags,
            });
        }

        stream.push(null);

        await new Promise((resolve) => {
            stream.on('end', () => resolve());
        });
        expect(Sentry.captureMessage).toHaveBeenCalledTimes(logLevels.length + 1);
        expect(Sentry.captureMessage.mock.calls[0][0]).toEqual('Some message: 0');
        expect(Sentry.captureMessage.mock.calls[0][1]).toEqual({
            level: 'debug',
            extra: { event: 'log' },
            tags: tagMap,
        });
        expect(Sentry.captureMessage.mock.calls[1][1]).toEqual({
            level: 'warning',
            extra: { event: 'log' },
            tags: tagMap,
        });
        expect(Sentry.captureMessage.mock.calls[2][1]).toEqual({
            level: 'info',
            extra: { event: 'log' },
            tags: tagMap,
        });
        expect(Sentry.captureMessage.mock.calls[3][1]).toEqual({
            level: 'error',
            extra: { event: 'log' },
            tags: tagMap,
        });
        expect(Sentry.captureMessage.mock.calls[4][1]).toEqual({
            level: 'fatal',
            extra: { event: 'log' },
            tags: tagMap,
        });
    });
});
