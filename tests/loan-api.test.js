const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Loan = require('../models/loan');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Loan.deleteMany({});
});

describe('Loan API Tests', () => {
  const userId = 'test-user-1';
  const loanData = {
    userId,
    loanName: 'Home Loan',
    principal: 5000000,
    interestRate: 8.5,
    tenureMonths: 240,
    emiAmount: 43000,
    dueDate: new Date('2025-02-01'),
  };

  test('POST /api/loan - Create loan', async () => {
    const response = await request(app)
      .post('/api/loan')
      .send(loanData)
      .expect(201);

    expect(response.body.loanName).toBe(loanData.loanName);
    expect(response.body.emiAmount).toBe(loanData.emiAmount);
  });

  test('GET /api/loan - Fetch all loans', async () => {
    await Loan.create(loanData);

    const response = await request(app)
      .get(`/api/loan?userId=${userId}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].loanName).toBe(loanData.loanName);
  });

  test('PUT /api/loan/:id - Update loan', async () => {
    const loan = await Loan.create(loanData);

    const response = await request(app)
      .put(`/api/loan/${loan._id}`)
      .send({ ...loanData, emiAmount: 45000 })
      .expect(200);

    expect(response.body.emiAmount).toBe(45000);
  });

  test('DELETE /api/loan/:id - Delete loan', async () => {
    const loan = await Loan.create(loanData);

    await request(app)
      .delete(`/api/loan/${loan._id}`)
      .expect(200);

    const deleted = await Loan.findById(loan._id);
    expect(deleted).toBeNull();
  });

  test('GET /api/loan/emi-stress - Calculate EMI stress', async () => {
    await Loan.create(loanData);

    const response = await request(app)
      .get(`/api/loan/emi-stress?userId=${userId}`)
      .expect(200);

    expect(response.body).toHaveProperty('emiToIncomeRatio');
    expect(response.body).toHaveProperty('missProbability');
    expect(response.body).toHaveProperty('readinessScore');
    expect(response.body).toHaveProperty('dailyCushion');
    expect(response.body).toHaveProperty('weeklyCushion');
  });

  test('POST /api/loan/emi-what-if - Simulate scenario', async () => {
    await Loan.create(loanData);

    const response = await request(app)
      .post('/api/loan/emi-what-if')
      .send({
        userId,
        scenario: {
          type: 'income-drop',
          value: 20,
        },
      })
      .expect(200);

    expect(response.body).toHaveProperty('impact');
    expect(response.body).toHaveProperty('newEMI');
    expect(response.body).toHaveProperty('survivabilityScore');
    expect(response.body).toHaveProperty('microTip');
  });

  test('GET /api/loan/calendar - Generate calendar', async () => {
    await Loan.create(loanData);

    const response = await request(app)
      .get(`/api/loan/calendar?userId=${userId}`)
      .expect(200);

    expect(response.body).toHaveProperty('calendar');
    expect(Array.isArray(response.body.calendar)).toBe(true);
  });
});

