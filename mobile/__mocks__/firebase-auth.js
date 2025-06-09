// Mock for firebase/auth
module.exports = {
  getCurrentUser: jest.fn().mockReturnValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  })
};
