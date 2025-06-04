import cron from 'node-cron';
import { NotificationService } from './services/NotificationService';

const notificationService = new NotificationService();

// Run every minute during development
// In production, change this back to '0 0 * * *' for daily at midnight
cron.schedule('* * * * *', async () => {
  console.log('Running notification check at:', new Date().toISOString());
  try {
    await notificationService.checkExpiringItems();
    console.log('Notification check completed successfully');
  } catch (error) {
    console.error('Error during notification check:', error);
  }
});

// Also check immediately when server starts
console.log('Running initial notification check...');
notificationService.checkExpiringItems()
  .then(() => console.log('Initial notification check completed'))
  .catch(error => console.error('Error during initial notification check:', error)); 