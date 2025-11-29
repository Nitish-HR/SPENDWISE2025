const cron = require('node-cron');
const Expense = require('../models/Expense');
const { generateInsight } = require('../services/insightEngine');

/**
 * Get all distinct user IDs from Expense collection
 */
async function getAllUserIds() {
  try {
    const userIds = await Expense.distinct('userId');
    return userIds.filter(id => id && id.trim() !== '');
  } catch (error) {
    console.error('[Cron] Error fetching user IDs:', error);
    return [];
  }
}

/**
 * Daily insight generation job (runs at 8 AM every day)
 */
function setupDailyInsightJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('\n========================================');
    console.log('[Cron] Daily Insight Job Started (8 AM)');
    console.log('========================================\n');

    try {
      const userIds = await getAllUserIds();
      console.log(`[Cron] Found ${userIds.length} users to process`);

      if (userIds.length === 0) {
        console.log('[Cron] No users found, skipping daily insights');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          await generateInsight(userId, 'daily');
          successCount++;
        } catch (error) {
          console.error(`[Cron] Failed to generate insight for ${userId}:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n[Cron] Daily Insight Job Completed:`);
      console.log(`  ✅ Success: ${successCount}`);
      console.log(`  ❌ Errors: ${errorCount}`);
      console.log('========================================\n');

    } catch (error) {
      console.error('[Cron] Daily Insight Job Error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('[Cron] Daily insight job scheduled (8 AM daily)');
}

/**
 * Weekly insight generation job (runs every Sunday at 8 AM)
 */
function setupWeeklyInsightJob() {
  cron.schedule('0 8 * * 0', async () => {
    console.log('\n========================================');
    console.log('[Cron] Weekly Insight Job Started (Sunday 8 AM)');
    console.log('========================================\n');

    try {
      const userIds = await getAllUserIds();
      console.log(`[Cron] Found ${userIds.length} users to process`);

      if (userIds.length === 0) {
        console.log('[Cron] No users found, skipping weekly insights');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          await generateInsight(userId, 'weekly');
          successCount++;
        } catch (error) {
          console.error(`[Cron] Failed to generate weekly insight for ${userId}:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n[Cron] Weekly Insight Job Completed:`);
      console.log(`  ✅ Success: ${successCount}`);
      console.log(`  ❌ Errors: ${errorCount}`);
      console.log('========================================\n');

    } catch (error) {
      console.error('[Cron] Weekly Insight Job Error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('[Cron] Weekly insight job scheduled (Sunday 8 AM)');
}

/**
 * Initialize all cron jobs
 */
function initializeCronJobs() {
  setupDailyInsightJob();
  setupWeeklyInsightJob();
  console.log('[Cron] All insight cron jobs initialized');
}

module.exports = { initializeCronJobs };

