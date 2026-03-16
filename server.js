const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log('Request body:', req.body);
  next();
});

// Mock user data (in production, use a real database)
let users = [
  {
    email: 'user@example.com',
    password: 'Password123',
    name: 'Test User',
    token: 'mock-jwt-token-12345'
  }
];

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  console.log('Registration attempt:', { email, name });
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }
  
  // Create new user
  const newUser = {
    email,
    password,
    name: name || email.split('@')[0], // Use name or default to email prefix
    token: `mock-jwt-token-${Date.now()}` // Generate unique token
  };
  
  users.push(newUser);
  
  console.log('User registered successfully:', { email: newUser.email, name: newUser.name });
  
  res.json({
    success: true,
    user: {
      email: newUser.email,
      name: newUser.name
    },
    token: newUser.token
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  
  console.log('Login attempt:', { login, password });
  
  // Find user by email
  const user = users.find(u => u.email === login && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name
      },
      token: user.token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// List all users (for testing/debugging)
app.get('/api/users', (req, res) => {
  const userList = users.map(u => ({
    email: u.email,
    name: u.name
  }));
  res.json({
    success: true,
    users: userList,
    total: users.length
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Test credentials:');
  console.log('Email: user@example.com');
  console.log('Password: Password123');
});
