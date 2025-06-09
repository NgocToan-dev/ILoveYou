// Mock for @react-navigation/native
module.exports = {
  CommonActions: {
    navigate: jest.fn().mockImplementation((config) => ({
      type: 'NAVIGATE',
      payload: config
    })),
    reset: jest.fn().mockImplementation((config) => ({
      type: 'RESET',
      payload: config
    }))
  }
};
