const hostname = require('os').hostname;
const hoek = require('hoek');
const Stream = require('stream');
const raven = require('raven');

const internals = {
  defaults: {
    name: hostname(),
    logger: '',
    release: '',
    environment: '',
  },
};

class GoodSentry extends Stream.Writable {
  constructor({ dsn = null, config = {} } = {}) {
    super({ objectMode: true, decodeStrings: false });

    const settings = hoek.applyToDefaults(internals.defaults, config);
    const args = (dsn === null) ? [settings] : [dsn, settings];

    this._client = new raven.Client(...args);
  }
  _write(data, encoding, cb) {
    const extra = {
      level: ((tags = []) => {
        tags = (typeof tags === 'string') ? [tags] : tags; // eslint-disable-line no-param-reassign
        if (hoek.contain(tags, ['err', 'error'], { part: true })) {
          return 'error';
        } else if (hoek.contain(tags, ['warn', 'warning'], { part: true })) {
          return 'warning';
        } else if (hoek.contain(tags, ['info'], { part: true })) {
          return 'info';
        }

        return 'debug';
      })(data.tags),
      extra: {
        event: data.event,
        tags: data.tags || [],
      },
    };

    if (extra.level === 'error') {
      this._client.captureException(data.data, extra, () => cb());
    } else {
      this._client.captureMessage(data.data, extra, () => cb());
    }
  }
}

module.exports = GoodSentry;
