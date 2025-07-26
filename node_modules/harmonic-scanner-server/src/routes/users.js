const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');
const TelegramBot = require('../utils/telegramBot');

const telegramBot = new TelegramBot();

/**
 * POST /api/users/register - Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'harmonic-scanner-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferences: user.preferences
      },
      token
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

/**
 * POST /api/users/login - User login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'harmonic-scanner-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt
      },
      token
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log in'
    });
  }
});

/**
 * GET /api/users/profile - Get user profile (requires auth)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /api/users/preferences - Update user preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid preferences object is required'
      });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...user.preferences,
      ...preferences
    };

    user.preferences = updatedPreferences;
    await user.save();

    res.json({
      success: true,
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * POST /api/users/telegram/connect - Connect Telegram account
 */
router.post('/telegram/connect', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram chat ID is required'
      });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Test Telegram connection
    const testResult = await telegramBot.testConnection(null, chatId);

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `Telegram connection failed: ${testResult.message}`
      });
    }

    // Update user with Telegram chat ID
    user.telegramChatId = chatId;
    
    // Enable Telegram in preferences
    const updatedPreferences = {
      ...user.preferences,
      enableTelegram: true
    };
    user.preferences = updatedPreferences;
    
    await user.save();

    // Add chat ID to bot service
    telegramBot.addChatId(chatId);

    res.json({
      success: true,
      message: 'Telegram account connected successfully',
      telegramChatId: chatId
    });

  } catch (error) {
    console.error('Error connecting Telegram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Telegram account'
    });
  }
});

/**
 * DELETE /api/users/telegram/disconnect - Disconnect Telegram account
 */
router.delete('/telegram/disconnect', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const oldChatId = user.telegramChatId;

    // Remove Telegram connection
    user.telegramChatId = null;
    
    // Disable Telegram in preferences
    const updatedPreferences = {
      ...user.preferences,
      enableTelegram: false
    };
    user.preferences = updatedPreferences;
    
    await user.save();

    // Remove chat ID from bot service
    if (oldChatId) {
      telegramBot.removeChatId(oldChatId);
    }

    res.json({
      success: true,
      message: 'Telegram account disconnected successfully'
    });

  } catch (error) {
    console.error('Error disconnecting Telegram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Telegram account'
    });
  }
});

/**
 * POST /api/users/test-telegram - Test Telegram connection
 */
router.post('/test-telegram', async (req, res) => {
  try {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Bot token and chat ID are required'
      });
    }

    const result = await telegramBot.testConnection(botToken, chatId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Telegram test message sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Error testing Telegram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Telegram connection'
    });
  }
});

/**
 * PUT /api/users/password - Change password
 */
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * DELETE /api/users/account - Delete user account
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required'
      });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Remove from Telegram if connected
    if (user.telegramChatId) {
      telegramBot.removeChatId(user.telegramChatId);
    }

    // Delete user account
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'harmonic-scanner-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

module.exports = router;
