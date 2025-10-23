/**
 * Test OpenAI API Key
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    
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

testOpenAI()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
