jest.mock('raven');

const GoodSentry = require('../src/index');
const hostname = require('os').hostname;
const Stream = require('stream');
const raven = require('raven');

const internals = {
  readStream() {
    const result = new Stream.Readable({ objectMode: true });
    result._read = () => {};
    return result;
  },
};

const client = new raven.Client();
raven.Client.mockClear();

describe('GoodSentry', () => {
  afterEach(() => {
    raven.Client.mockClear();
    client.captureMessage.mockClear();
  });

  it('creates raven client without dsn and with default options if dsn nor options are provided', () => {
    const reporter = new GoodSentry(); // eslint-disable-line no-unused-vars
    expect(raven.Client.mock.calls[0][0]).toEqual({ environment: '', logger: '', name: hostname(), release: '' });
  });

  it('creates raven client with dsn if provided', () => {
    const reporter = new GoodSentry({ dsn: 'https://<key>@sentry.io/<project>' }); // eslint-disable-line no-unused-vars
    expect(raven.Client.mock.calls[0][0]).toBe('https://<key>@sentry.io/<project>');
    expect(raven.Client.mock.calls[0][1]).toEqual({ environment: '', logger: '', name: hostname(), release: '' });
  });

  it('creates raven cliet that captures all exceptions if patchGlobal flag is provided', () => {
    const reporter = new GoodSentry({ patchGlobal: true }); // eslint-disable-line no-unused-vars
    expect(raven.Client.mock.calls.length).toBe(1);
  });

  it('extends options with default values', () => {
    const reporter = new GoodSentry({ config: { environment: 'production' } }); // eslint-disable-line no-unused-vars
    expect(raven.Client.mock.calls[0][0]).toEqual({
      environment: 'production',
      logger: '',
      name: hostname(),
      release: '',
    });
  });

  it('sends each event individually', () => {
    const stream = internals.readStream();
    const reporter = new GoodSentry();
    const logLevels = ['warning', 'info', 'error'];

    stream.pipe(reporter);

    for (let i = 0; i < logLevels.length + 1; ++i) { // eslint-disable-line no-plusplus
      stream.push({
        event: 'log',
        data: `Some message: ${i}`,
        tags: (i > 0) ? [logLevels[i - 1]] : '',
      });
    }

    stream.push(null);

    return new Promise((resolve) => {
      stream.on('end', () => resolve());
    }).then(() => {
      expect(client.captureMessage.mock.calls.length).toBe(logLevels.length + 1);
      expect(client.captureMessage.mock.calls[0][0]).toEqual('Some message: 0');
      expect(client.captureMessage.mock.calls[0][1]).toEqual({ level: 'debug', extra: { event: 'log', tags: [] } });
      expect(client.captureMessage.mock.calls[1][1]).toEqual({
        level: 'warning',
        extra: {
          event: 'log',
          tags: ['warning'],
        },
      });
      expect(client.captureMessage.mock.calls[2][1]).toEqual({
        level: 'info',
        extra: {
          event: 'log',
          tags: ['info'],
        },
      });
      expect(client.captureMessage.mock.calls[3][1]).toEqual({
        level: 'error',
        extra: {
          event: 'log',
          tags: ['error'],
        },
      });
    });
  });
});
