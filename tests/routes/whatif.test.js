// Mock Google GenerativeAI before importing routes
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: jest.fn().mockReturnValue(JSON.stringify({
        overview: 'Test overview for what-if scenario',
        prediction: 'Test prediction',
        savingsPlan: 'Test savings plan',
        microTip: 'Test micro tip',
      })),
    },
  });

  const mockModel = {
    generateContent: mockGenerateContent,
  };

  const mockGenAI = {
    getGenerativeModel: jest.fn().mockReturnValue(mockModel),
  };

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => mockGenAI),
  };
});

// Set test environment variable before requiring routes
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

const request = require('supertest');
const express = require('express');
const whatIfRoutes = require('../../routes/whatif');

const app = express();
app.use(express.json());
app.use('/api/what-if', whatIfRoutes);

describe('What-If Routes', () => {
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Create test expenses for analytics
    const Expense = require('../../models/Expense');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    await Expense.create([
      {
        userId: testUserId,
        category: 'Food',
        amount: 100,
        date: new Date(thirtyDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: testUserId,
        category: 'Food',
        amount: 150,
        date: new Date(thirtyDaysAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: testUserId,
        category: 'Transport',
        amount: 50,
        date: new Date(thirtyDaysAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    ]);
  });

  describe('POST /api/what-if', () => {
    it('should run category-change scenario', async () => {
      const scenario = {
        type: 'category-change',
        category: 'Food',
        percentChange: -30,
      };

      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
          scenario,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scenarioResult');
      expect(response.body.scenarioResult).toHaveProperty('overview');
      expect(response.body.scenarioResult).toHaveProperty('prediction');
      expect(response.body.scenarioResult).toHaveProperty('savingsPlan');
      expect(response.body.scenarioResult).toHaveProperty('microTip');
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('original');
      expect(response.body.analytics).toHaveProperty('adjusted');
    });

    it('should run income-change scenario', async () => {
      const scenario = {
        type: 'income-change',
        amountChange: 1000,
      };

      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
          scenario,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scenarioResult');
      expect(response.body.analytics.adjusted.totals).toBeGreaterThan(
        response.body.analytics.original.totals
      );
    });

    it('should run absolute scenario', async () => {
      const scenario = {
        type: 'absolute',
        amountChange: -200,
      };

      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
          scenario,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.analytics.adjusted.totals).toBeLessThan(
        response.body.analytics.original.totals
      );
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/what-if')
        .send({
          scenario: {
            type: 'category-change',
            category: 'Food',
            percentChange: -30,
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if scenario is missing', async () => {
      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if scenario type is missing', async () => {
      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
          scenario: {
            category: 'Food',
            percentChange: -30,
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if category-change scenario missing required fields', async () => {
      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: testUserId,
          scenario: {
            type: 'category-change',
            percentChange: -30,
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if no expenses found', async () => {
      const response = await request(app)
        .post('/api/what-if')
        .send({
          userId: 'user-with-no-expenses',
          scenario: {
            type: 'category-change',
            category: 'Food',
            percentChange: -30,
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});

