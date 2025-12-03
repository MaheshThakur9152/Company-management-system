const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login for nandani...');
        const response = await axios.post('http://localhost:3000/api/login', {
            email: 'nandani[',
            password: 'admin' 
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
            console.log(error.stack);
        }
    }
}

testLogin();
