const userService = require('../services/UserService');

class UserController {
    async getMyProfile(req, res, next) {
        try {
            const profile = await userService.getProfile(req.user.id);
            res.json({ success: true, data: profile });
        } catch (err) {
            next(err);
        }
    }

    async updateMyProfile(req, res, next) {
        try {
            const user = await userService.updateProfile(req.user.id, req.body);
            res.json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    async getProfile(req, res, next) {
        try {
            const profile = await userService.getProfile(req.params.id);
            res.json({ success: true, data: profile });
        } catch (err) {
            next(err);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const user = await userService.updateProfile(req.params.id, req.body);
            res.json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    async getPublicPortfolio(req, res, next) {
        try {
            const user = await userService.getPublicPortfolio(req.params.username);
            res.json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    async getAll(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            res.json({ success: true, data: users });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController();
