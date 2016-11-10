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
};

module.exports = {
  Client: jest.fn(() => client),
};
