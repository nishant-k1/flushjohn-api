/**
 * Test OpenAI API Key
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing OpenAI API Key...');
console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? 'Found' : 'Not found'}`);

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('🚀 Sending test request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Write a 50-word summary about porta potty rentals for events."
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    console.log('✅ OpenAI API is working!');
    console.log('📝 Test response:');
    console.log(content);
    console.log('\n🎯 Ready to generate blog posts!');
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    if (error.code === 'invalid_api_key') {
      console.error('🔑 Invalid API key. Please check your OPENAI_API_KEY.');
    } else if (error.code === 'insufficient_quota') {
      console.error('💳 Insufficient quota. Please check your OpenAI billing.');
    } else {
      console.error('🌐 Network or other error:', error.message);
    }
    return false;
  }
}

// Run the test
testOpenAI()
  .then(success => {
    if (success) {
      console.log('\n✅ Test completed successfully. Ready to generate blogs!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed. Please fix the issue before generating blogs.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
