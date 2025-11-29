const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/income');
const insightRoutes = require('./routes/insights');
const aiRoutes = require('./routes/ai');
const goalRoutes = require('./routes/goals');
const whatIfRoutes = require('./routes/whatif');
const investmentRoutes = require('./routes/investment');
const loanRoutes = require('./routes/loan');
const { initializeCronJobs } = require('./cron/insightCron');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spendwise';

app.use(cors());
app.use(express.json());

app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/what-if', whatIfRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/loan', loanRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SpendWise backend up' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[backend] MongoDB connected');
    app.listen(PORT, () => {
      console.log(`[backend] Server listening on port ${PORT}`);
      // Initialize cron jobs after server starts
      initializeCronJobs();
    });
  })
  .catch((error) => {
    console.error('[backend] Mongo connection failed', error);
    process.exit(1);
  });

module.exports = app;

