const request = require('supertest');
const app = require('../server');

describe('Donation API', () => {
  let token;
  let donorId;
  let campaignId;

  beforeAll(async () => {
    // Register and login admin user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        orgName: 'Test Org',
      });
    token = registerResponse.body.token;

    // Create a donor
    const donorResponse = await request(app)
      .post('/api/donors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'donor@test.com',
        profile: { firstName: 'Test', lastName: 'Donor' },
      });
    donorId = donorResponse.body._id;

    // Create a campaign
    const campaignResponse = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Campaign',
        goal: 10000,
        description: 'Test campaign description',
      });
    campaignId = campaignResponse.body._id;
  });

  describe('POST /api/donations', () => {
    it('should create a new donation', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          donorId,
          donorEmail: 'donor@test.com',
          donorName: 'Test Donor',
          amount: 500,
          paymentMethod: 'cash',
          campaignId,
          status: 'completed',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('amount', 500);
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 500,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/donations', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          donorId,
          donorEmail: 'donor@test.com',
          donorName: 'Test Donor',
          amount: 250,
          paymentMethod: 'cash',
          status: 'completed',
        });
    });

    it('should get all donations', async () => {
      const response = await request(app)
        .get('/api/donations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter donations by status', async () => {
      const response = await request(app)
        .get('/api/donations?status=completed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(d => d.status === 'completed')).toBe(true);
    });
  });

  describe('PUT /api/donations/:id', () => {
    let donationId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          donorId,
          donorEmail: 'donor@test.com',
          donorName: 'Test Donor',
          amount: 100,
          paymentMethod: 'cash',
          status: 'pending',
        });
      donationId = response.body._id;
    });

    it('should update a donation', async () => {
      const response = await request(app)
        .put(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 150,
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('amount', 150);
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should return 404 for non-existent donation', async () => {
      const response = await request(app)
        .put('/api/donations/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 150,
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
