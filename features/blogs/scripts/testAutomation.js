/**
 * Test Automation System
 * Tests the complete blog automation system
 */

import dotenv from 'dotenv';
dotenv.config();

import { testCronSystem } from '../services/cronScheduler.js';
import { getAutomationStats } from '../services/automatedBlogService.js';
import { getCalendarStats } from '../services/contentCalendar.js';

async function testAutomation() {
  
  try {
    const calendarStats = getCalendarStats();
    
    const automationStats = await getAutomationStats();
    
    const cronTestResult = await testCronSystem();
    
    if (cronTestResult) {
    } else {
    }
    
    
    if (cronTestResult) {
    } else {
    }
    
  } catch (error) {
    console.error('\n❌ Automation system test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAutomation()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Automation test failed:', error);
      process.exit(1);
    });
}

export default testAutomation;
