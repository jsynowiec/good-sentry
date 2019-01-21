const client = {
  captureMessage: jest.fn((data, extra, cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  }),
  captureException: jest.fn((data, extra, cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  }),
  install: jest.fn(),
};

module.exports = {
  config: jest.fn(() => client),
  install: client.install,
};
