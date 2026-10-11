const rewardsService = require('../services/rewardsService');
const { successResponse, errorResponse } = require('../utils/response');

class RewardsController {
  _extractUserId(req) {
    // 0. From route params
    if (req.params && req.params.userId) return req.params.userId;

    // 1. From authenticated JWT user
    if (req.user && req.user.id) return req.user.id;
    if (req.user && req.user.phone) return req.user.phone;

    // 2. From query param or header
    if (req.query && req.query.userId) return req.query.userId;
    if (req.headers && req.headers['x-user-id']) return req.headers['x-user-id'];
    if (req.body && req.body.userId) return req.body.userId;

    // 3. Fallback to default citizen session
    return 'default_citizen';
  }

  /**
   * GET /api/rewards/catalogue
   */
  async getCatalogue(req, res) {
    try {
      const catalogue = await rewardsService.getCatalogue();
      return successResponse(res, catalogue, 'Rewards catalogue retrieved successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/rewards/balance
   */
  async getBalance(req, res) {
    try {
      const userId = this._extractUserId(req);
      const summary = await rewardsService.getUserSummary(userId);
      return successResponse(res, summary, 'User rewards summary retrieved');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/rewards/award
   * Body: { complaintId, description }
   */
  async awardComplaint(req, res) {
    try {
      const userId = this._extractUserId(req);
      const { complaintId, description } = req.body;

      if (!complaintId) {
        return errorResponse(res, 'complaintId is required to award Grievance Coins', 400);
      }

      const result = await rewardsService.awardComplaintReward(userId, complaintId, description);
      if (!result.success && result.alreadyAwarded) {
        return res.status(200).json({
          success: false,
          alreadyAwarded: true,
          message: result.message,
          data: result
        });
      }

      return successResponse(res, result, result.message, 201);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/rewards/redeem
   * Body: { rewardId }
   */
  async redeemReward(req, res) {
    try {
      const userId = this._extractUserId(req);
      const { rewardId } = req.body;

      if (!rewardId) {
        return errorResponse(res, 'rewardId is required', 400);
      }

      const result = await rewardsService.redeemReward(userId, rewardId);
      return successResponse(res, result, result.message, 200);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_COINS') {
        return res.status(400).json({
          success: false,
          error: 'INSUFFICIENT_COINS',
          message: err.message,
          details: err.details
        });
      }
      return errorResponse(res, err.message, err.statusCode || 400);
    }
  }

  /**
   * GET /api/rewards/transactions
   */
  async getTransactions(req, res) {
    try {
      const userId = this._extractUserId(req);
      const transactions = await rewardsService.getTransactionHistory(userId);
      return successResponse(res, transactions, `Fetched ${transactions.length} GC transactions`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/rewards/claims
   */
  async getClaims(req, res) {
    try {
      const userId = this._extractUserId(req);
      const claims = await rewardsService.getClaimedRewards(userId);
      return successResponse(res, claims, `Fetched ${claims.length} claimed demo rewards`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/rewards/reset
   * Resets demo user to clean 0 GC state
   */
  async reset(req, res) {
    try {
      const userId = this._extractUserId(req);
      const summary = await rewardsService.resetUser(userId);
      return successResponse(res, summary, 'User rewards data reset to 0 GC successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }
}

module.exports = new RewardsController();
