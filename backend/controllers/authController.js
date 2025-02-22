const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = await User.create({ username, email, password });
        res.status(201).json({ 
            message: 'User registered successfully', 
            token: generateToken(newUser) 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send user info without sensitive data
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email
        };

        res.json({
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
