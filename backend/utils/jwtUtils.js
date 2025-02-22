const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { generateToken, verifyToken };
