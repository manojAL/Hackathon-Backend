import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Schemas/userSchema.mjs';
import Session from '../Schemas/session.mjs';

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Create session
    const newSession = new Session({
      userId: user._id,
      token
    });
    await newSession.save();

    // Return user data (without password) and token
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      department: user.department,
      position: user.position,
      phoneNumber: user.phoneNumber
    };

    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await Session.deleteOne({ token });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile (for settings)
// Update user profile (for settings)
router.put('/profile', async (req, res) => {
    try {
      // 1. Verify Authorization
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token required' });
      }
  
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // 2. Get data from request
      const { userId, department, position, phoneNumber } = req.body;
  
      // 3. Validate userId matches token
      if (userId !== decoded.userId) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
  
      // 4. Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // 5. Prepare update data
      const updateData = {};
      if (department !== undefined) updateData.department = department;
      if (position !== undefined) updateData.position = position;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  
      // 6. Check if anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          message: 'No changes provided',
          currentData: {
            department: user.department,
            position: user.position,
            phoneNumber: user.phoneNumber
          }
        });
      }
  
      // 7. Perform update
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
  
      // 8. Return success
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
  
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation failed',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to update profile',
        error: error.message 
      });
    }
  });
  // Add this to your backend routes
router.get('/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
  
      // Verify token
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
  
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  
      // Get user data
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: error.message });
    }
  });

export default router;