async function testWebhook() {
  console.log('Starting test webhook script...');

  const testPayload = {
    data: {
      id: 'test-id',
      properties: {
        'Main Channel(s)': {
          url: 'https://www.instagram.com/sonyalrobinson/?hl=en',
        },
      },
    },
  };

  console.log('Payload:', JSON.stringify(testPayload, null, 2));

  try {
    console.log('Attempting to fetch from webhook...');
    const response = await fetch('http://localhost:8888/.netlify/functions/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error in test webhook:', error);
    process.exit(1);
  }
}

console.log('Script started');
testWebhook()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
