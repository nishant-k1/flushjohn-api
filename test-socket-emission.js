/**
 * Test script to verify socket event emission when creating a lead
 * This will help diagnose why real-time notifications aren't working
 */

import { config } from 'dotenv';
config({ path: './.env' });

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const testLeadCreation = async () => {
  console.log('🧪 Testing Lead Creation & Socket Emission...\n');

  const testLead = {
    fName: 'Socket',
    lName: 'Test',
    email: `sockettest${Date.now()}@test.com`,
    phone: '555-1234',
    company: 'Socket Test Inc',
    leadSource: 'CRM',
    streetAddress: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    message: 'Testing socket event emission',
    products: [],
  };

  try {
    console.log('📤 Creating test lead:', {
      name: `${testLead.fName} ${testLead.lName}`,
      email: testLead.email,
    });

    console.log('📦 Lead data being sent:', JSON.stringify(testLead, null, 2));

    const response = await axios.post(`${API_BASE_URL}/leads`, testLead, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ Lead created successfully!');
    console.log('Lead ID:', response.data.data._id);
    console.log('Lead No:', response.data.data.leadNo);

    console.log('\n🔍 Now check the API terminal for these logs:');
    console.log('  - 🔔 Creating notifications for lead...');
    console.log('  - 👥 Found X active users');
    console.log('  - ✅ Successfully created X notifications');
    console.log('  - 📢 Emitted leadCreated event for lead [ID]');
    console.log('  - 📢 Emitted X notificationCreated events');

    console.log('\n🔍 And check the CRM browser console for:');
    console.log('  - 📢 Notification created event received with data');
    console.log('  - ✅ Adding new notification to list');

    console.log('\n💡 If you see API logs but NOT browser logs:');
    console.log('  - Socket connection might be working');
    console.log('  - But event listeners might not be set up properly');
    console.log('  - Or namespace emission might not be reaching clients');

    console.log('\n🎯 Created test lead with ID:', response.data.data._id);
  } catch (error) {
    console.error('\n❌ Error creating test lead:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testLeadCreation().catch(console.error);
