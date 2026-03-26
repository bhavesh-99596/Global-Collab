const Joi = require('joi');
const authService = require('../services/AuthService');

// Validation schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().allow('', null).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

class AuthController {
    async register(req, res, next) {
        try {
            const { error, value } = registerSchema.validate(req.body);
            if (error) {
                const err = new Error(error.details[0].message);
                err.statusCode = 400;
                err.isOperational = true;
                throw err;
            }

            const result = await authService.registerUser(value);
            res.status(201).json({
                success: true,
                message: 'Registration successful',
                ...result
            });
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                const err = new Error(error.details[0].message);
                err.statusCode = 400;
                err.isOperational = true;
                throw err;
            }

            const result = await authService.loginUser(value.email, value.password);
            res.json({
                success: true,
                message: 'Login successful',
                ...result
            });
        } catch (err) {
            next(err);
        }
    }

    logout(req, res, next) {
        // Logout endpoint (client flushes token, server just acks)
        res.json({ success: true, message: 'Logged out successfully' });
    }
}

module.exports = new AuthController();
