const assert = require('assert');
const rewardsService = require('../src/services/rewardsService');

async function runRewardsTests() {
  console.log('🧪 Starting Rewards System Automated Unit Tests...');

  const testUserId = `test_citizen_${Date.now()}`;
  const complaint1 = `LS-TEST-${Date.now()}-1`;
  const complaint2 = `LS-TEST-${Date.now()}-2`;

  // 1. Initial summary
  const initialSummary = await rewardsService.getUserSummary(testUserId);
  assert.strictEqual(initialSummary.balance, 0, 'Initial balance should be 0 GC');
  console.log('  ✅ [PASS] Initial balance is 0 GC');

  // 2. Award complaint 1
  const award1 = await rewardsService.awardComplaintReward(testUserId, complaint1, 'Test Complaint 1');
  assert.strictEqual(award1.success, true, 'First award should succeed');
  assert.strictEqual(award1.coinsEarned, 1, 'Should award 1 coin');
  assert.strictEqual(award1.balanceAfter, 1, 'Balance after should be 1');
  console.log('  ✅ [PASS] First complaint awards 1 GC (Balance = 1)');

  // 3. Companion call for complaint 1 (within 60s)
  const companionAward = await rewardsService.awardComplaintReward(testUserId, complaint1, 'Companion Call');
  assert.strictEqual(companionAward.success, true, 'Companion award within 60s should return success');
  assert.strictEqual(companionAward.balanceAfter, 1, 'Balance after companion call should remain 1');
  console.log('  ✅ [PASS] Companion complaint call in live lodge flow succeeds smoothly');

  // 4. Award complaint 2
  const award2 = await rewardsService.awardComplaintReward(testUserId, complaint2, 'Test Complaint 2');
  assert.strictEqual(award2.success, true, 'Second award should succeed');
  assert.strictEqual(award2.balanceAfter, 2, 'Balance after second award should be 2');
  console.log('  ✅ [PASS] Second complaint awards +1 GC (Balance = 2)');

  // 5. Test insufficient balance redemption (cost 20 GC when balance is 2 GC)
  try {
    await rewardsService.redeemReward(testUserId, 'rew-flipkart-20');
    assert.fail('Should have thrown INSUFFICIENT_COINS');
  } catch (err) {
    assert.strictEqual(err.code, 'INSUFFICIENT_COINS', 'Should reject with INSUFFICIENT_COINS');
    console.log('  ✅ [PASS] Rejects redemption when coins are insufficient');
  }

  console.log('======================================================');
  console.log('🎉 ALL REWARDS UNIT TESTS PASSED!');
  console.log('======================================================');
}

runRewardsTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
