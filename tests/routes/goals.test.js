const request = require('supertest');
const express = require('express');
const goalRoutes = require('../../routes/goals');

const app = express();
app.use(express.json());
app.use('/api/goals', goalRoutes);

describe('Goals Routes', () => {
  const testUserId = 'test-user-123';
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  describe('POST /api/goals', () => {
    it('should create a new goal', async () => {
      const goalData = {
        userId: testUserId,
        title: 'Vacation Fund',
        targetAmount: 5000,
        savedAmount: 1000,
        deadline: futureDate.toISOString(),
      };

      const response = await request(app)
        .post('/api/goals')
        .send(goalData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.title).toBe('Vacation Fund');
      expect(response.body.targetAmount).toBe(5000);
      expect(response.body.savedAmount).toBe(1000);
    });

    it('should create goal with default savedAmount of 0', async () => {
      const goalData = {
        userId: testUserId,
        title: 'New Goal',
        targetAmount: 1000,
        deadline: futureDate.toISOString(),
      };

      const response = await request(app)
        .post('/api/goals')
        .send(goalData)
        .expect(201);

      expect(response.body.savedAmount).toBe(0);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/goals')
        .send({ userId: testUserId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if targetAmount is not positive', async () => {
      const response = await request(app)
        .post('/api/goals')
        .send({
          userId: testUserId,
          title: 'Invalid Goal',
          targetAmount: -100,
          deadline: futureDate.toISOString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if deadline is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/goals')
        .send({
          userId: testUserId,
          title: 'Past Goal',
          targetAmount: 1000,
          deadline: pastDate.toISOString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/goals', () => {
    beforeEach(async () => {
      const Goal = require('../../models/Goal');
      await Goal.create([
        {
          userId: testUserId,
          title: 'Goal 1',
          targetAmount: 1000,
          savedAmount: 500,
          deadline: futureDate,
        },
        {
          userId: testUserId,
          title: 'Goal 2',
          targetAmount: 2000,
          savedAmount: 1000,
          deadline: futureDate,
        },
        {
          userId: 'other-user',
          title: 'Other Goal',
          targetAmount: 3000,
          savedAmount: 1500,
          deadline: futureDate,
        },
      ]);
    });

    it('should get goals for a specific user', async () => {
      const response = await request(app)
        .get('/api/goals')
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].userId).toBe(testUserId);
      expect(response.body[1].userId).toBe(testUserId);
    });

    it('should return empty array for user with no goals', async () => {
      const response = await request(app)
        .get('/api/goals')
        .query({ userId: 'no-goals-user' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/goals')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

