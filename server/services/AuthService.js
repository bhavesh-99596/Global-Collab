const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development';
    }

    async registerUser(userData) {
        const { username, email, password, full_name } = userData;

        const existingUsers = await userRepository.findByEmailOrUsername(email, username);
        if (existingUsers.length > 0) {
            const error = new Error('User with that email or username already exists');
            error.statusCode = 400;
            error.isOperational = true;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await userRepository.createUser(username, email, password_hash, full_name);

        const token = jwt.sign(
            { id: user.id, username: user.username },
            this.jwtSecret,
            { expiresIn: '24h' }
        );

        return { user, token };
    }

    async loginUser(email, password) {
        const user = await userRepository.findByEmail(email);

        if (!user || !user.password_hash) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.isOperational = true;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.isOperational = true;
            throw error;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            this.jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                reputation: user.reputation
            }
        };
    }
}

module.exports = new AuthService();
