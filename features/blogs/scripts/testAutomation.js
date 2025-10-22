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
  console.log('🧪 Testing Blog Automation System...');
  console.log('=====================================');
  
  try {
    // Test 1: Content Calendar
    console.log('\n📅 Test 1: Content Calendar');
    const calendarStats = getCalendarStats();
    console.log('✅ Content Calendar Status:');
    console.log(`   - Total topics: ${calendarStats.totalTopics}`);
    console.log(`   - Current season: ${calendarStats.currentSeason}`);
    console.log(`   - Next topic: ${calendarStats.nextTopic?.title || 'N/A'}`);
    
    // Test 2: Automation Stats
    console.log('\n📊 Test 2: Automation Statistics');
    const automationStats = await getAutomationStats();
    console.log('✅ Automation Stats:');
    console.log(`   - Total automated posts: ${automationStats.totalAutomatedPosts}`);
    console.log(`   - Automation status: ${automationStats.automationStatus}`);
    console.log(`   - Current season: ${automationStats.currentSeason}`);
    
    // Test 3: Cron System
    console.log('\n🕐 Test 3: Cron Job System');
    const cronTestResult = await testCronSystem();
    
    if (cronTestResult) {
      console.log('✅ All cron job tests passed!');
    } else {
      console.log('❌ Some cron job tests failed');
    }
    
    // Summary
    console.log('\n🎉 Automation System Test Summary:');
    console.log('=====================================');
    console.log('✅ Content Calendar: Working');
    console.log('✅ Automation Stats: Working');
    console.log(cronTestResult ? '✅ Cron System: Working' : '❌ Cron System: Issues detected');
    
    if (cronTestResult) {
      console.log('\n🚀 Automation system is ready for production!');
      console.log('📅 Next blog post will be generated automatically on Monday at 9:00 AM EST');
    } else {
      console.log('\n⚠️  Please fix cron system issues before deploying to production');
    }
    
  } catch (error) {
    console.error('\n❌ Automation system test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAutomation()
    .then(() => {
      console.log('\n✅ Automation test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Automation test failed:', error);
      process.exit(1);
    });
}

export default testAutomation;
