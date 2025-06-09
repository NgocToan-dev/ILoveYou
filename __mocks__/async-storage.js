// Mock for @react-native-async-storage/async-storage
export default {
  getItem: jest.fn().mockImplementation((key) => {
    return Promise.resolve(null);
  }),
  setItem: jest.fn().mockImplementation((key, value) => {
    return Promise.resolve();
  }),
  removeItem: jest.fn().mockImplementation((key) => {
    return Promise.resolve();
  }),
  clear: jest.fn().mockImplementation(() => {
    return Promise.resolve();
  }),
  getAllKeys: jest.fn().mockImplementation(() => {
    return Promise.resolve([]);
  }),
  multiGet: jest.fn().mockImplementation((keys) => {
    return Promise.resolve(keys.map(key => [key, null]));
  }),
  multiSet: jest.fn().mockImplementation((keyValuePairs) => {
    return Promise.resolve();
  }),
  multiRemove: jest.fn().mockImplementation((keys) => {
    return Promise.resolve();
  })
};
