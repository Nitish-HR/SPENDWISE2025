// backend/seedTestData.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Expense = require('./models/Expense');
const Insight = require('./models/Insight');

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/spendwise';
  await mongoose.connect(MONGO_URI, {});

  // create test user
  await User.create({ userId: 'test-user-1', name: 'Test User' });

  // create a recent expense
  await Expense.create({ userId: 'test-user-1', category: 'Food', amount: 420, date: new Date() });

  // create an example insight
  await Insight.create({
    userId: 'test-user-1',
    overview: 'Spent ₹420 recently',
    overspendAreas: [{ category: 'Food', amount: 420, why: 'High takeout' }],
    savingsPlan: 'Try to cook twice',
    microTip: 'Cook at home once a week',
    prediction: 'low risk',
    raw: { demo: true }
  });

  console.log('Seeded test data');
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
