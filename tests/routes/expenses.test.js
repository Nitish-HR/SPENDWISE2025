const request = require('supertest');
const express = require('express');
const expenseRoutes = require('../../routes/expenses');

const app = express();
app.use(express.json());
app.use('/api/expenses', expenseRoutes);

describe('Expenses Routes', () => {
  const testUserId = 'test-user-123';

  describe('POST /api/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        userId: testUserId,
        category: 'Food',
        amount: 50.00,
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.category).toBe('Food');
      expect(response.body.amount).toBe(50.00);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({ userId: testUserId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          category: 'Food',
          amount: 50.00,
          date: new Date().toISOString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      // Create test expenses
      const Expense = require('../../models/Expense');
      await Expense.create([
        {
          userId: testUserId,
          category: 'Food',
          amount: 25.00,
          date: new Date('2024-01-01'),
        },
        {
          userId: testUserId,
          category: 'Transport',
          amount: 15.00,
          date: new Date('2024-01-02'),
        },
        {
          userId: 'other-user',
          category: 'Food',
          amount: 30.00,
          date: new Date('2024-01-03'),
        },
      ]);
    });

    it('should get expenses for a specific user', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].userId).toBe(testUserId);
      expect(response.body[1].userId).toBe(testUserId);
    });

    it('should return empty array for user with no expenses', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .query({ userId: 'no-expenses-user' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

