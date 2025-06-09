// Mock for firebase/couples
module.exports = {
  getUserProfile: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
    partnerId: 'test-partner-id'
  })
};
