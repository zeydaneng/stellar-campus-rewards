// src/hooks/useAchievements.js
// Proof-of-Contribution NFT Certificate System

/**
 * Achievement definitions — each maps to an on-chain NFT.
 * In production: minted via Soroban contract when condition is met.
 */
export const ACHIEVEMENTS = [
  {
    id: 'first_steps',
    emoji: '🎓',
    name: 'First Steps',
    description: 'Complete your first task',
    xpReward: 50,
    condition: (stats) => stats.totalTasks >= 1,
    nftMetadata: { edition: 'Common', category: 'Milestone' },
  },
  {
    id: 'speed_learner',
    emoji: '⚡',
    name: 'Speed Learner',
    description: '3 approved tasks in one week',
    xpReward: 100,
    condition: (stats) => stats.tasksThisWeek >= 3,
    nftMetadata: { edition: 'Uncommon', category: 'Performance' },
  },
  {
    id: 'chain_master',
    emoji: '🔗',
    name: 'Chain Master',
    description: '10 blockchain-related tasks',
    xpReward: 200,
    condition: (stats) => stats.blockchainTasks >= 10,
    nftMetadata: { edition: 'Rare', category: 'Specialty' },
  },
  {
    id: 'community_hero',
    emoji: '🤝',
    name: 'Community Hero',
    description: '5 volunteer activities',
    xpReward: 150,
    condition: (stats) => stats.volunteerTasks >= 5,
    nftMetadata: { edition: 'Uncommon', category: 'Community' },
  },
  {
    id: 'innovator',
    emoji: '💡',
    name: 'Innovator',
    description: 'Submit an original project',
    xpReward: 300,
    condition: (stats) => stats.projects >= 1,
    nftMetadata: { edition: 'Rare', category: 'Innovation' },
  },
  {
    id: 'top_10',
    emoji: '🏆',
    name: 'Top 10',
    description: 'Reach top 10 on campus leaderboard',
    xpReward: 500,
    condition: (stats) => stats.leaderboardRank <= 10,
    nftMetadata: { edition: 'Epic', category: 'Achievement' },
  },
  {
    id: 'scholar',
    emoji: '🌟',
    name: 'Scholar',
    description: 'Reach Level 8',
    xpReward: 400,
    condition: (stats) => stats.level >= 8,
    nftMetadata: { edition: 'Rare', category: 'Progression' },
  },
  {
    id: 'diamond_coder',
    emoji: '💎',
    name: 'Diamond Coder',
    description: '20+ approved tasks',
    xpReward: 600,
    condition: (stats) => stats.totalTasks >= 20,
    nftMetadata: { edition: 'Epic', category: 'Milestone' },
  },
]

/**
 * Checks which achievements are earned and triggers NFT minting.
 * @param {object} stats - Current student stats
 * @param {string[]} alreadyEarned - IDs of already-minted NFTs
 * @param {function} mintNFT - Soroban contract call to mint
 * @returns {string[]} Newly earned achievement IDs
 */
export async function checkAndMintAchievements(stats, alreadyEarned = [], mintNFT) {
  const newlyEarned = []

  for (const achievement of ACHIEVEMENTS) {
    if (alreadyEarned.includes(achievement.id)) continue
    if (achievement.condition(stats)) {
      newlyEarned.push(achievement.id)
      // In production: await mintNFT(achievement)
      console.log(`[NFT] Minting: ${achievement.name} for wallet`)
    }
  }

  return newlyEarned
}

/**
 * Calculates XP and level from total earned XP.
 */
export function calculateLevel(xp) {
  const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1
  }
  const currentThreshold = thresholds[Math.min(level - 1, thresholds.length - 1)]
  const nextThreshold = thresholds[Math.min(level, thresholds.length - 1)]
  const progress = nextThreshold > currentThreshold
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100
  return { level, progress: Math.round(progress), nextAt: nextThreshold }
}
