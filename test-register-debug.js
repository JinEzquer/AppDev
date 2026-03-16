// Test registration with detailed error logging
async function testRegistration() {
  try {
    console.log('=== Testing Registration ===');
    
    const testData = {
      username: 'testuser456',
      email: 'test456@example.com',
      password: 'Test123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: ''
    };

    console.log('Sending data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://10.65.173.250:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('=== ERROR DETAILS ===');
      if (data.errors) {
        console.log('Validation errors:', data.errors);
        data.errors.forEach((error, index) => {
          console.log(`Error ${index + 1}:`, error);
        });
      }
      if (data.message) {
        console.log('Error message:', data.message);
      }
    }

  } catch (error) {
    console.error('Network error:', error);
  }
}

testRegistration();
