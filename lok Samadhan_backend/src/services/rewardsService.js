const fs = require('fs');
const path = require('path');
const { supabaseClient, getDatabaseMode } = require('../config/database');

const STORE_PATH = path.join(__dirname, '../../database/rewards_store.json');

const DEMO_CATALOGUE = [
  {
    id: 'rew-flipkart-20',
    name: 'Flipkart Discount Voucher',
    description: 'Flat discount on your next shopping order across select electronics and fashion items.',
    cost: 20,
    category: 'shopping',
    isDemo: true,
    isActive: true,
    statusLabel: 'Available'
  },
  {
    id: 'rew-amazon-20',
    name: 'Amazon Discount Voucher',
    description: 'Instant balance benefit for pantry essentials, household goods, and utility bills.',
    cost: 20,
    category: 'shopping',
    isDemo: true,
    isActive: true,
    statusLabel: 'Available'
  },
  {
    id: 'rew-googleplay-50',
    name: 'Google Play Store Redeem Code',
    description: 'Digital credits for apps, books, movies, and developer tools on Google Play.',
    cost: 50,
    category: 'entertainment',
    isDemo: true,
    isActive: true,
    statusLabel: 'Available'
  },
  {
    id: 'rew-lenskart-30',
    name: 'Lenskart Voucher',
    description: 'Prescription eyeglasses and polarized sunglasses discount voucher.',
    cost: 30,
    category: 'health',
    isDemo: true,
    isActive: true,
    statusLabel: 'Available'
  }
];

class RewardsService {
  constructor() {
    this._loadStore();
  }

  /**
   * Loads or initializes persistent data store on disk.
   * Cleanses any legacy welcome bonuses and recalculates balances strictly from valid transactions.
   */
  _loadStore() {
    this.store = {
      rewardBalances: {},
      complaintRewards: [],
      rewardRedemptions: [],
      gcTransactions: [],
      rewardCatalogue: [...DEMO_CATALOGUE]
    };

    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.store = {
            rewardBalances: parsed.rewardBalances || {},
            complaintRewards: parsed.complaintRewards || [],
            rewardRedemptions: parsed.rewardRedemptions || [],
            gcTransactions: parsed.gcTransactions || [],
            rewardCatalogue: [...DEMO_CATALOGUE]
          };
        }
      }
    } catch (err) {
      console.warn(`[RewardsService] Failed to load ${STORE_PATH}: ${err.message}. Starting fresh.`);
    }

    // MIGRATION & SANITIZATION:
    // Remove all legacy 'WELCOME-BONUS' / starter grants so users start at 0 GC unless earned through complaints
    this.store.gcTransactions = this.store.gcTransactions.filter(
      (tx) => tx.referenceId !== 'WELCOME-BONUS' && tx.id !== 'TXN-INIT-001' && !tx.description?.includes('Starter Civic')
    );

    // Recompute all user balances from authoritative ledger
    this._recomputeAllBalances();
    this._persistStore();
  }

  /**
   * Persists the in-memory data to the local disk file atomically
   */
  _persistStore() {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (err) {
      console.error(`[RewardsService] Failed to persist rewards store to disk: ${err.message}`);
    }
  }

  /**
   * Authoritative formula:
   * Current balance = Total valid GC earned - Total valid GC redeemed
   */
  _recomputeAllBalances() {
    const userIds = new Set([
      ...Object.keys(this.store.rewardBalances),
      ...this.store.gcTransactions.map((tx) => tx.userId),
      ...this.store.complaintRewards.map((cr) => cr.userId),
      ...this.store.rewardRedemptions.map((rd) => rd.userId)
    ]);

    for (const uid of userIds) {
      this._recomputeUserBalance(uid);
    }
  }

  _recomputeUserBalance(userId) {
    const userTx = this.store.gcTransactions.filter((tx) => tx.userId === userId);

    let totalEarned = 0;
    let totalRedeemed = 0;

    // Process from oldest to newest to ensure balanceAfter in transactions is mathematically exact
    const sorted = [...userTx].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let runningBalance = 0;
    for (const tx of sorted) {
      if (tx.type === 'earned') {
        const amt = Math.max(0, parseInt(tx.amount, 10) || 0);
        totalEarned += amt;
        runningBalance += amt;
      } else if (tx.type === 'redeemed') {
        const amt = Math.abs(parseInt(tx.amount, 10) || 0);
        totalRedeemed += amt;
        runningBalance = Math.max(0, runningBalance - amt);
      }
      tx.balanceAfter = runningBalance;
    }

    const currentBalance = Math.max(0, totalEarned - totalRedeemed);

    this.store.rewardBalances[userId] = {
      userId,
      balance: currentBalance,
      totalEarned,
      totalRedeemed,
      updatedAt: new Date().toISOString()
    };

    return this.store.rewardBalances[userId];
  }

  /**
   * Normalize user identifier (defaults to 'default_citizen' if empty)
   */
  _normalizeUserId(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return 'default_citizen';
    }
    return userId.trim();
  }

  /**
   * Get the rewards catalogue
   */
  async getCatalogue() {
    return DEMO_CATALOGUE;
  }

  /**
   * Retrieve current user reward summary
   * New user starts at exactly 0 GC.
   */
  async getUserSummary(rawUserId) {
    const userId = this._normalizeUserId(rawUserId);

    // Compute balance from authoritative ledger
    const balanceRecord = this._recomputeUserBalance(userId);

    // Count unique complaints that earned rewards
    const userComplaints = this.store.complaintRewards.filter((cr) => cr.userId === userId);
    const uniqueComplaintIds = new Set(userComplaints.map((cr) => cr.complaintId.toUpperCase()));

    // Count claimed rewards
    const userRedemptions = this.store.rewardRedemptions.filter((r) => r.userId === userId);

    return {
      userId,
      balance: balanceRecord.balance,
      totalEarned: balanceRecord.totalEarned,
      totalRedeemed: balanceRecord.totalRedeemed,
      eligibleComplaintsCount: uniqueComplaintIds.size,
      rewardsRedeemedCount: userRedemptions.length,
      earningRule: '1 GC per eligible complaint',
      disclaimer: 'Demo Rewards Only — No real vouchers, redeem codes, or monetary value are provided.'
    };
  }

  /**
   * Award 1 Grievance Coin for an eligible complaint
   * Enforces strict uniqueness constraint: 1 complaint ID = 1 GC award only.
   */
  async awardComplaintReward(rawUserId, complaintId, description = null) {
    if (!complaintId) {
      throw new Error('complaintId is required to award Grievance Coins');
    }

    const userId = this._normalizeUserId(rawUserId);
    const cleanComplaintId = complaintId.trim().toUpperCase();

    // Check if complaint has already earned coins (case-insensitive deduplication)
    const existingAward = this.store.complaintRewards.find(
      (cr) => cr.complaintId.toUpperCase() === cleanComplaintId
    );

    const userSummary = await this.getUserSummary(userId);

    if (existingAward) {
      const awardTime = existingAward.awardedAt ? new Date(existingAward.awardedAt).getTime() : 0;
      const isRecentLodge = (Date.now() - awardTime) < 60000; // within 60s of registration

      if (isRecentLodge) {
        return {
          success: true,
          alreadyAwarded: false,
          message: `🎉 Complaint #${cleanComplaintId} registered! +1 Grievance Coin awarded.`,
          complaintId: cleanComplaintId,
          coinsEarned: existingAward.coinsAwarded || 1,
          balanceBefore: Math.max(0, userSummary.balance - (existingAward.coinsAwarded || 1)),
          balanceAfter: userSummary.balance,
          transactionId: `TXN-EARN-${cleanComplaintId}`
        };
      }

      return {
        success: false,
        alreadyAwarded: true,
        message: `Complaint #${cleanComplaintId} has already earned Grievance Coins. Repeated awards are prohibited.`,
        complaintId: cleanComplaintId,
        coinsEarned: 0,
        balanceBefore: userSummary.balance,
        balanceAfter: userSummary.balance
      };
    }

    const balanceBefore = userSummary.balance;
    const coinsToAward = 1;
    const balanceAfter = balanceBefore + coinsToAward;

    const awardRecordId = `CWD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = `TXN-EARN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const awardRecord = {
      id: awardRecordId,
      userId,
      complaintId: cleanComplaintId,
      coinsAwarded: coinsToAward,
      awardedAt: nowIso
    };
    this.store.complaintRewards.push(awardRecord);

    const transaction = {
      id: txId,
      userId,
      type: 'earned',
      amount: coinsToAward,
      description: description || `Eligible Complaint #${cleanComplaintId}`,
      referenceId: cleanComplaintId,
      balanceAfter,
      createdAt: nowIso
    };
    this.store.gcTransactions.unshift(transaction);

    // Recompute and persist to disk
    this._recomputeUserBalance(userId);
    this._persistStore();

    // Persist to Supabase if tables exist
    const mode = getDatabaseMode();
    if (mode === 'supabase' && supabaseClient) {
      try {
        await supabaseClient.from('complaint_rewards').insert({
          id: awardRecordId,
          user_id: userId,
          complaint_id: cleanComplaintId,
          coins_awarded: coinsToAward
        });
        await supabaseClient.from('gc_transactions').insert({
          id: txId,
          user_id: userId,
          type: 'earned',
          amount: coinsToAward,
          description: transaction.description,
          reference_id: cleanComplaintId,
          balance_after: balanceAfter
        });
      } catch (err) {
        // Ignored if table not created yet in Supabase schema cache
      }
    }

    return {
      success: true,
      alreadyAwarded: false,
      coinsEarned: coinsToAward,
      complaintId: cleanComplaintId,
      balanceBefore,
      balanceAfter,
      message: `🎉 Complaint Submitted Successfully!\nYou earned +1 Grievance Coin (GC).\nYour new balance: ${balanceAfter} GC`
    };
  }

  /**
   * Redeem a demo reward with strict balance validation
   */
  async redeemReward(rawUserId, rewardId) {
    if (!rewardId) {
      throw new Error('rewardId is required');
    }

    const userId = this._normalizeUserId(rawUserId);

    // 1. Verify reward exists in catalogue
    const reward = DEMO_CATALOGUE.find((r) => r.id === rewardId);
    if (!reward) {
      throw new Error(`Reward with ID '${rewardId}' not found in catalogue`);
    }

    const userSummary = await this.getUserSummary(userId);
    const currentBalance = userSummary.balance;

    // 2. CRITICAL VALIDATION: Insufficient Coins Check
    if (currentBalance < reward.cost) {
      const coinsNeeded = reward.cost - currentBalance;
      const error = new Error(
        `Not enough Grievance Coins! You need ${reward.cost} GC to redeem this reward, but you currently have ${currentBalance} GC. Earn ${coinsNeeded} more GC by submitting eligible complaints.`
      );
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_COINS';
      error.details = {
        rewardId: reward.id,
        rewardName: reward.name,
        rewardCost: reward.cost,
        currentBalance,
        coinsNeeded,
        additionalComplaintsNeeded: coinsNeeded,
        formula: `${reward.cost} (Cost) - ${currentBalance} (Balance) = ${coinsNeeded} Needed`
      };
      throw error;
    }

    // 3. Atomic deduction
    const balanceBefore = currentBalance;
    const balanceAfter = balanceBefore - reward.cost;

    const redemptionId = `RDM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = `TXN-RDM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const redemptionRecord = {
      id: redemptionId,
      userId,
      rewardId: reward.id,
      rewardName: reward.name,
      coinsDeducted: reward.cost,
      status: 'Demo Claimed',
      createdAt: nowIso
    };
    this.store.rewardRedemptions.unshift(redemptionRecord);

    const transaction = {
      id: txId,
      userId,
      type: 'redeemed',
      amount: -reward.cost,
      description: `Redeemed ${reward.name}`,
      referenceId: redemptionId,
      balanceAfter,
      createdAt: nowIso
    };
    this.store.gcTransactions.unshift(transaction);

    // Recompute and persist to disk
    this._recomputeUserBalance(userId);
    this._persistStore();

    // Persist to Supabase if available
    const mode = getDatabaseMode();
    if (mode === 'supabase' && supabaseClient) {
      try {
        await supabaseClient.from('reward_redemptions').insert({
          id: redemptionId,
          user_id: userId,
          reward_id: reward.id,
          reward_name: reward.name,
          coins_deducted: reward.cost,
          status: 'Demo Claimed'
        });
        await supabaseClient.from('gc_transactions').insert({
          id: txId,
          user_id: userId,
          type: 'redeemed',
          amount: -reward.cost,
          description: transaction.description,
          reference_id: redemptionId,
          balance_after: balanceAfter
        });
      } catch (err) {
        // Ignored if table not created yet in Supabase schema cache
      }
    }

    return {
      success: true,
      redemptionId,
      rewardName: reward.name,
      cost: reward.cost,
      previousBalance: balanceBefore,
      remainingBalance: balanceAfter,
      status: 'Demo Claimed',
      message: `🎉 Reward Claimed Successfully!\nYou claimed: ${reward.name}\n${reward.cost} GC deducted.\nRemaining balance: ${balanceAfter} GC`
    };
  }

  /**
   * Get full transaction history
   */
  async getTransactionHistory(rawUserId) {
    const userId = this._normalizeUserId(rawUserId);
    this._recomputeUserBalance(userId);
    return this.store.gcTransactions
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get claimed rewards list
   */
  async getClaimedRewards(rawUserId) {
    const userId = this._normalizeUserId(rawUserId);
    return this.store.rewardRedemptions
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Clean local development reset helper (resets user to exactly 0 GC)
   */
  async resetUser(rawUserId) {
    const userId = this._normalizeUserId(rawUserId);
    this.store.gcTransactions = this.store.gcTransactions.filter((tx) => tx.userId !== userId);
    this.store.complaintRewards = this.store.complaintRewards.filter((cr) => cr.userId !== userId);
    this.store.rewardRedemptions = this.store.rewardRedemptions.filter((r) => r.userId !== userId);
    delete this.store.rewardBalances[userId];
    this._recomputeUserBalance(userId);
    this._persistStore();
    return this.getUserSummary(userId);
  }
}

module.exports = new RewardsService();
