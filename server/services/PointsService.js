const pointsRepository = require('../repositories/PointsRepository');
const socketLib = require('../utils/socket');

class PointsService {
    async getWallet(userId) {
        return await pointsRepository.getPoints(userId);
    }

    async getHistory(userId) {
        return await pointsRepository.getHistory(userId);
    }

    async addPoints(userId, points, description) {
        const newTotal = await pointsRepository.addPoints(userId, points, description);
        try {
            socketLib.getIo().emit('pointsUpdated', { userId, total_points: newTotal, delta: points });
        } catch (_) {}
        return newTotal;
    }

    async redeemPoints(userId, points, description) {
        const newTotal = await pointsRepository.redeemPoints(userId, points, description);
        try {
            socketLib.getIo().emit('pointsUpdated', { userId, total_points: newTotal, delta: -points });
        } catch (_) {}
        return newTotal;
    }

    calculateDiscount(pointsToUse) {
        if (pointsToUse >= 8000) return 100;
        if (pointsToUse >= 4000) return 100;
        if (pointsToUse >= 2000) return 50;
        if (pointsToUse >= 1000) return 25;
        if (pointsToUse >= 500) return 10;
        return 0;
    }
}

module.exports = new PointsService();
