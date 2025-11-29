const request = require('supertest');
const express = require('express');
const insightRoutes = require('../../routes/insights');

const app = express();
app.use(express.json());
app.use('/api/insights', insightRoutes);

describe('Insights Routes', () => {
  const testUserId = 'test-user-123';

  describe('GET /api/insights/latest', () => {
    it('should get latest insight for a user', async () => {
      const Insight = require('../../models/Insight');
      await Insight.create({
        userId: testUserId,
        overview: 'Test overview',
        prediction: 'Test prediction',
        savingsPlan: 'Test plan',
        microTip: 'Test tip',
      });

      const response = await request(app)
        .get('/api/insights/latest')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body.overview).toBe('Test overview');
    });

    it('should return empty object if no insights exist', async () => {
      const response = await request(app)
        .get('/api/insights/latest')
        .query({ userId: 'no-insights-user' })
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/insights/latest')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return the most recent insight', async () => {
      const Insight = require('../../models/Insight');
      await Insight.create({
        userId: testUserId,
        overview: 'Old insight',
        prediction: 'Old prediction',
        savingsPlan: 'Old plan',
        microTip: 'Old tip',
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      await Insight.create({
        userId: testUserId,
        overview: 'New insight',
        prediction: 'New prediction',
        savingsPlan: 'New plan',
        microTip: 'New tip',
      });

      const response = await request(app)
        .get('/api/insights/latest')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.overview).toBe('New insight');
    });
  });

  describe('GET /api/insights/history', () => {
    beforeEach(async () => {
      const Insight = require('../../models/Insight');
      // Create multiple insights
      await Insight.create([
        {
          userId: testUserId,
          overview: 'Insight 1',
          prediction: 'Prediction 1',
          savingsPlan: 'Plan 1',
          microTip: 'Tip 1',
        },
        {
          userId: testUserId,
          overview: 'Insight 2',
          prediction: 'Prediction 2',
          savingsPlan: 'Plan 2',
          microTip: 'Tip 2',
        },
        {
          userId: 'other-user',
          overview: 'Other insight',
          prediction: 'Other prediction',
          savingsPlan: 'Other plan',
          microTip: 'Other tip',
        },
      ]);
    });

    it('should get insight history for a user', async () => {
      const response = await request(app)
        .get('/api/insights/history')
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].userId).toBe(testUserId);
      expect(response.body[1].userId).toBe(testUserId);
    });

    it('should return empty array for user with no insights', async () => {
      const response = await request(app)
        .get('/api/insights/history')
        .query({ userId: 'no-insights-user' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/insights/history')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should limit results to 30 insights', async () => {
      const Insight = require('../../models/Insight');
      // Create 35 insights
      const insights = Array.from({ length: 35 }, (_, i) => ({
        userId: testUserId,
        overview: `Insight ${i}`,
        prediction: `Prediction ${i}`,
        savingsPlan: `Plan ${i}`,
        microTip: `Tip ${i}`,
      }));

      await Insight.insertMany(insights);

      const response = await request(app)
        .get('/api/insights/history')
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body.length).toBe(30);
    });
  });
});

