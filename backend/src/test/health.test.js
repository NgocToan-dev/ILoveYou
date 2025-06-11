const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  test('GET /health should return server status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Server is healthy');
    expect(response.body.data).toHaveProperty('status', 'OK');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('environment');
  });

  test('GET /non-existent-route should return 404', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('message', 'Route not found');
  });
});

describe('API Routes Structure', () => {
  test('Protected routes should require authentication', async () => {
    const protectedRoutes = [
      '/api/auth/me',
      '/api/notes',
      '/api/reminders',
      '/api/couples/me',
      '/api/love-days',
    ];

    for (const route of protectedRoutes) {
      const response = await request(app)
        .get(route)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toMatch(/token|auth/i);
    }
  });

  test('Public routes should be accessible', async () => {
    const response = await request(app)
      .post('/api/auth/verify-token')
      .send({ token: 'invalid-token' })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
  });
});