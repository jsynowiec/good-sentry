const { hostname } = require('os');
const Stream = require('stream');
const raven = require('raven');

const GoodSentry = require('../src/index');

jest.mock('raven');

const internals = {
  readStream() {
    const result = new Stream.Readable({ objectMode: true });
    result._read = () => {};
    return result;
  },
};

const client = raven.config();
raven.config.mockClear();

describe('GoodSentry', () => {
  afterEach(() => {
    raven.config.mockClear();
    raven.install.mockClear();
    client.captureMessage.mockClear();
    client.captureException.mockClear();
  });

  it('creates raven client without dsn and with default options if dsn nor options are provided', () => {
    // eslint-disable-next-line no-unused-vars
    const reporter = new GoodSentry();
    expect(raven.config.mock.calls[0][0]).toEqual({
      environment: '',
      logger: '',
      name: hostname(),
      release: '',
    });
  });

  it('creates raven client with dsn if provided', () => {
    // eslint-disable-next-line no-unused-vars
    const reporter = new GoodSentry({
      dsn: 'https://<key>@sentry.io/<project>',
    });
    expect(raven.config.mock.calls[0][0]).toBe(
      'https://<key>@sentry.io/<project>',
    );
    expect(raven.config.mock.calls[0][1]).toEqual({
      environment: '',
      logger: '',
      name: hostname(),
      release: '',
    });
  });

  it('creates raven client that captures all exceptions if captureUncaught flag is provided', () => {
    const reporter = new GoodSentry({ captureUncaught: true }); // eslint-disable-line no-unused-vars
    expect(raven.config.mock.calls.length).toBe(1);
    expect(raven.install.mock.calls.length).toBe(1);
  });

  it('extends options with default values', () => {
    const reporter = new GoodSentry({ config: { environment: 'production' } }); // eslint-disable-line no-unused-vars
    expect(raven.config.mock.calls[0][0]).toEqual({
      environment: 'production',
      logger: '',
      name: hostname(),
      release: '',
    });
  });

  it('sends each event individually', () => {
    const stream = internals.readStream();
    const reporter = new GoodSentry();
    const logLevels = ['warning', 'info', 'error', 'fatal'];
    const tags = ['database', 'query'];
    const tagMap = { database: true, query: true };

    stream.pipe(reporter);

    for (let i = 0; i < logLevels.length + 1; ++i) {
      // eslint-disable-line no-plusplus
      stream.push({
        event: 'log',
        data: `Some message: ${i}`,
        tags: i > 0 ? [logLevels[i - 1], ...tags] : tags,
      });
    }

    stream.push(null);

    return new Promise(resolve => {
      stream.on('end', () => resolve());
    }).then(() => {
      expect(client.captureMessage.mock.calls.length).toBe(
        logLevels.length + 1,
      );
      expect(client.captureMessage.mock.calls[0][0]).toEqual('Some message: 0');
      expect(client.captureMessage.mock.calls[0][1]).toEqual({
        level: 'debug',
        extra: {
          event: 'log',
        },
        tags: tagMap,
      });

      expect(client.captureMessage.mock.calls[1][1]).toEqual({
        level: 'warning',
        extra: {
          event: 'log',
        },
        tags: tagMap,
      });

      expect(client.captureMessage.mock.calls[2][1]).toEqual({
        level: 'info',
        extra: {
          event: 'log',
        },
        tags: tagMap,
      });

      expect(client.captureMessage.mock.calls[3][1]).toEqual({
        level: 'error',
        extra: {
          event: 'log',
        },
        tags: tagMap,
      });

      expect(client.captureException.mock.calls.length).toBe(0);
    });
  });

  it('sends each event individually', () => {
    const stream = internals.readStream();
    const reporter = new GoodSentry();

    stream.pipe(reporter);

    const error = new Error('Mocked error');

    const events = [
      { error, tags: ['error', 'application'] },
      { data: { error, user: 'doe' }, tags: ['error', 'application'] },
      { data: { err: error }, tags: ['error', 'application'] }
    ];

    for (let i = 0; i < events.length; ++i) {
      // eslint-disable-line no-plusplus
      stream.push(Object.assign({
        event: 'log'
      }, events[i]));
    }

    stream.push(null);

    return new Promise(resolve => {
      stream.on('end', () => resolve());
    }).then(() => {
      expect(client.captureMessage.mock.calls.length).toBe(0);
      expect(client.captureException.mock.calls.length).toBe(
        events.length
      );

      expect(client.captureException.mock.calls[0][0]).toBe(error);
      expect(client.captureException.mock.calls[0][1]).toEqual({
        level: 'error',
        extra: {
          event: 'log',
        },
        tags: { application: true },
      });

      expect(client.captureException.mock.calls[1][0]).toBe(error);
      expect(client.captureException.mock.calls[1][1]).toEqual({
        level: 'error',
        extra: {
          event: 'log',
          user: 'doe',
        },
        tags: { application: true },
      });

      expect(client.captureException.mock.calls[2][0]).toBe(error);
      expect(client.captureException.mock.calls[2][1]).toEqual({
        level: 'error',
        extra: {
          event: 'log'
        },
        tags: { application: true },
      });
    });
  });
});
