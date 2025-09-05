const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation.middleware');

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client'); // Add this import
const { generateToken } = require('../utils/jwt.util');
const { sendSuccess, sendError } = require('../utils/response.util'); // Add this import

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);


//additional 
const prisma = new PrismaClient(); // Initialize Prisma

// Generate reset token function (add this)
function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Your existing login and register routes...

// Add Password Reset Route
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Password reset request for:', email);
    
    if (!email || !email.trim()) {
      return sendError(res, 'Email is required', 400);
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, username: true }
    });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return sendSuccess(res, {}, 'If an account with that email exists, a password reset link has been sent');
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    });
    
    // In a real app, you would send an email here
    console.log(`🔑 Reset token for ${user.email}: ${resetToken}`);
    console.log(`⏰ Token expires at: ${resetTokenExpiry}`);
    
    // For development, log the reset token
    console.log(`📧 Password reset email would be sent to: ${user.email}`);
    console.log(`🔗 Reset link: http://localhost:3000/reset?token=${resetToken}`);
    
    sendSuccess(res, {}, 'Password reset link has been sent to your email');
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    sendError(res, 'Failed to process password reset request', 500);
  }
});

module.exports = router;