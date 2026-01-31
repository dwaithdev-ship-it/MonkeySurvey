const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MSRUser = require('../models/MSRUser');

/**
 * POST /users/msr-register
 * Special MSR User Registration
 */
router.post('/msr-register', async (req, res) => {
  try {
    let { name, username, password, companyEmail, company, phoneNumber, demoTemplate } = req.body;

    // Sanitize phone number (strip all non-digits)
    if (phoneNumber) {
      phoneNumber = phoneNumber.toString().replace(/\D/g, '');
    }

    const existingUser = await MSRUser.findOne({
      $or: [{ companyEmail }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username or Email already exists'
        }
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = new MSRUser({
      name,
      username,
      password: hashedPassword,
      companyEmail,
      company,
      phoneNumber,
      demoTemplate
    });

    await user.save();

    // Create standard user for login compatibility
    const standardUser = new User({
      email: companyEmail,
      password: hashedPassword,
      firstName: name || username,
      lastName: company || 'MSR',
      role: 'creator',
      phoneNumber // Sync phone number to standard user for login compatibility
    });

    await standardUser.save();

    res.status(201).json({
      success: true,
      message: 'MSR Account created successfully'
    });
  } catch (error) {
    console.error('MSR Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});
const {
  generateToken,
  hashPassword,
  comparePassword,
  authMiddleware
} = require('../../shared/auth');
const {
  registerSchema,
  loginSchema,
  validate
} = require('../../shared/validation');

/**
 * POST /users/register
 * Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, district, municipality } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      district,
      municipality
    });

    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user'
      }
    });
  }
});

/**
 * POST /users/login
 * Authenticate user
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    let { email, phoneNumber, password, deviceId } = req.body;

    // Sanitize phone number if provided (strip all non-digits)
    if (phoneNumber) {
      phoneNumber = phoneNumber.toString().replace(/\D/g, '');
    }

    console.log('Login attempt:', { email, phoneNumber, deviceId });

    // Construct query based on provided credentials
    const query = {};
    if (email) {
      query.email = email.toLowerCase();
    } else if (phoneNumber) {
      query.phoneNumber = phoneNumber;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email or Phone Number is required'
        }
      });
    }

    // Find user
    const user = await User.findOne(query);

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials. Please try again.'
        }
      });
    }

    console.log('User found:', user._id, user.roles);

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('Login failed: Password mismatch for user', user.email);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials. Please try again.'
        }
      });
    }

    console.log('Password valid. Checking device restrictions...');

    // Apply device restriction to any account that has a phone number (except admins)
    // This prevents bypassing the lock by logging in via email.
    if (user.phoneNumber && user.role !== 'admin') {
      const currentDeviceId = (deviceId || '').toString().trim();
      const registeredId = (user.registeredDeviceId || '').toString().trim();
      const sessionDeviceId = (user.activeSession?.deviceId || '').toString().trim();

      console.log('🔐 Restriction Check:', {
        user: user.email,
        currentDeviceId,
        registeredId,
        sessionDeviceId,
        hasSession: !!user.activeSession?.token
      });

      // 1. Hardware Match (Registered Device)
      if (registeredId && currentDeviceId && registeredId !== currentDeviceId) {
        console.log('🚫 BLOCK: Device Hardware Mismatch', { registeredId, currentDeviceId });
        return res.status(403).json({
          success: false,
          error: {
            code: 'DEVICE_MISMATCH',
            message: `Your account is locked to a different device. (Registered: ...${registeredId.slice(-4)}, Current: ...${currentDeviceId.slice(-4)})`
          }
        });
      }

      // 2. Session Match (Single Active Session)
      if (user.activeSession?.token) {
        if (currentDeviceId && sessionDeviceId && sessionDeviceId !== currentDeviceId) {
          console.log('🚫 BLOCK: Active session on different device');
          return res.status(403).json({
            success: false,
            error: {
              code: 'ALREADY_LOGGED_IN',
              message: 'This account is already active on another device.'
            }
          });
        }
        console.log('✅ Re-login on same device allowed.');
      }

      // 3. Device Ownership Check (No sharing devices)
      if (currentDeviceId) {
        const otherUser = await User.findOne({
          registeredDeviceId: currentDeviceId,
          _id: { $ne: user._id }
        });

        if (otherUser) {
          console.log('🚫 BLOCK: Device already owned by another user', { otherUser: otherUser.email });
          return res.status(403).json({
            success: false,
            error: {
              code: 'DEVICE_OWNED',
              message: `This device is already registered to user: ${otherUser.email}. Multiple users per device are not allowed.`
            }
          });
        }
      }

      // 4. Register device if not yet set
      if (!user.registeredDeviceId && currentDeviceId) {
        user.registeredDeviceId = currentDeviceId;
        console.log('📱 Registered first device:', currentDeviceId);
      }
    }



    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Update active session
    user.activeSession = {
      token,
      deviceId: deviceId || null,
      loginTime: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    await user.save();

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          district: user.district,
          municipality: user.municipality,
          phoneNumber: user.phoneNumber
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login'
      }
    });
  }
});

/**
 * POST /users/logout
 * Logout user and clear active session
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.activeSession = {
        token: null,
        deviceId: null,
        loginTime: null,
        ipAddress: null
      };
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to logout'
      }
    });
  }
});


/**
 * GET /users/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get profile'
      }
    });
  }
});

/**
 * PUT /users/profile
 * Update user profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, profileImage, settings } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profileImage) updateData.profileImage = profileImage;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

/**
 * GET /users
 * List all users (admin only)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can list users'
        }
      });
    }

    const users = await User.find({}, 'firstName lastName email role district municipality');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list users'
      }
    });
  }
});

/**
 * POST /users/msr-users
 * Create MSR user (admin only)
 */
router.post('/msr-users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { name, username, password, companyEmail, company, phoneNumber, demoTemplate } = req.body;

    const existingUser = await MSRUser.findOne({
      $or: [{ companyEmail }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: { message: 'Username or Email already exists' } });
    }

    const hashedPassword = await hashPassword(password);
    const msrUser = new MSRUser({
      name,
      username,
      password: hashedPassword,
      companyEmail,
      company,
      phoneNumber,
      demoTemplate
    });

    await msrUser.save();

    // Create standard user for login compatibility
    const standardUser = new User({
      email: companyEmail,
      password: hashedPassword,
      firstName: name || username,
      lastName: company || 'MSR',
      role: 'creator',
      phoneNumber // Sync phone number to standard user
    });

    await standardUser.save();

    res.status(201).json({ success: true, data: msrUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PUT /users/msr-users/:id
 * Update MSR user (admin only)
 */
router.get('/msr-users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can list MSR users' }
      });
    }

    const users = await MSRUser.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('List MSR users error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list MSR users' }
    });
  }
});

router.put('/msr-users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { name, companyEmail, company, phoneNumber, demoTemplate } = req.body;
    const msrUser = await MSRUser.findById(req.params.id);

    if (!msrUser) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // Update MSR User
    msrUser.name = name || msrUser.name;
    msrUser.companyEmail = companyEmail || msrUser.companyEmail;
    msrUser.company = company || msrUser.company;
    msrUser.phoneNumber = phoneNumber || msrUser.phoneNumber;
    msrUser.demoTemplate = demoTemplate || msrUser.demoTemplate;
    await msrUser.save();

    // Sync with standard User
    await User.findOneAndUpdate(
      { email: msrUser.companyEmail },
      {
        firstName: msrUser.name,
        lastName: msrUser.company,
        phoneNumber: msrUser.phoneNumber // Sync phone number
      }
    );

    res.json({ success: true, data: msrUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PATCH /users/msr-users/:id/status
 * Toggle MSR user status (admin only)
 */
router.patch('/msr-users/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { isActive } = req.body;
    const msrUser = await MSRUser.findByIdAndUpdate(req.params.id, { isActive }, { new: true });

    // Sync with standard User
    if (msrUser) {
      await User.findOneAndUpdate({ email: msrUser.companyEmail }, { isActive });
    }

    res.json({ success: true, data: msrUser });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PATCH /users/msr-users/:id/password
 * Change MSR user password (admin only)
 */
router.patch('/msr-users/:id/password', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { password } = req.body;
    const hashedPassword = await hashPassword(password);

    const msrUser = await MSRUser.findById(req.params.id);
    if (!msrUser) return res.status(404).json({ success: false, error: { message: 'User not found' } });

    msrUser.password = hashedPassword;
    await msrUser.save();

    // Sync with standard User
    await User.findOneAndUpdate({ email: msrUser.companyEmail }, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PUT /users/profile/:id
 * Update any user profile by ID (admin only)
 */
router.put('/profile/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can update other users profiles'
        }
      });
    }

    const { firstName, lastName, profileImage, settings } = req.body;
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profileImage) updateData.profileImage = profileImage;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user profile'
      }
    });
  }
});

/**
 * GET /users/:id
 * Get any user profile by ID (admin only)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user' }
    });
  }
});

module.exports = router;
