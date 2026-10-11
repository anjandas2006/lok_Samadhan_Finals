const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');

// GET /api/rewards/catalogue - Rewards store catalogue
router.get('/catalogue', (req, res) => rewardsController.getCatalogue(req, res));

// GET /api/rewards/balance - Current GC balance and summary
router.get('/balance', (req, res) => rewardsController.getBalance(req, res));
router.get('/balance/:userId', (req, res) => rewardsController.getBalance(req, res));

// POST /api/rewards/award - Award 1 GC for an eligible complaint
router.post('/award', (req, res) => rewardsController.awardComplaint(req, res));

// POST /api/rewards/redeem - Redeem a demo reward
router.post('/redeem', (req, res) => rewardsController.redeemReward(req, res));

// GET /api/rewards/transactions - Full GC transactions history
router.get('/transactions', (req, res) => rewardsController.getTransactions(req, res));
router.get('/transactions/:userId', (req, res) => rewardsController.getTransactions(req, res));

// GET /api/rewards/claims - My claimed demo rewards
router.get('/claims', (req, res) => rewardsController.getClaims(req, res));
router.get('/claims/:userId', (req, res) => rewardsController.getClaims(req, res));

// POST /api/rewards/reset - Reset demo user to 0 GC
router.post('/reset', (req, res) => rewardsController.reset(req, res));

module.exports = router;
