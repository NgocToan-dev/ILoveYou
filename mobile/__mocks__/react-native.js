// Mock for react-native
export default {
  Platform: {
    OS: 'android',
    select: (options) => options.android || options.default
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 })
  },
  Alert: {
    alert: jest.fn()
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
};

export const Platform = {
  OS: 'android',
  select: (options) => options.android || options.default
};

export const Dimensions = {
  get: () => ({ width: 375, height: 667 })
};

export const Alert = {
  alert: jest.fn()
};
