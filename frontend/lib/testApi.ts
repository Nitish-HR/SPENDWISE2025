import { client } from './apiClient';

export async function testApi() {
  try {
    const result = await client.get('/api/insights/latest?userId=test-user-1');
    console.log('API Test Result:', result);
    return result;
  } catch (error) {
    console.error('API Test Error:', error);
    return { success: false, message: 'Test failed' };
  }
}

