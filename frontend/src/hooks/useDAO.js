// src/hooks/useDAO.js
// University DAO Governance — reputation-weighted voting

import { useState, useEffect } from 'react'

/**
 * Voting power = reputation score / 100
 * So a student with score 892 gets 8.92 voting power.
 * This scales contribution fairly and discourages low-effort accounts.
 */
export function calculateVotingPower(reputationScore) {
  return (reputationScore / 100).toFixed(2)
}

export const DEMO_PROPOSALS = [
  {
    id: 'prop_001',
    title: 'Increase volunteer task reward from 10 XLM to 15 XLM',
    description: 'Volunteer activities are undervalued relative to academic tasks. This proposal increases the base reward to better reflect real-world impact.',
    status: 'active',
    yesVotes: 142,
    noVotes: 70,
    deadline: '2025-02-15',
    proposedBy: 'Zeynep Kaya',
    category: 'Rewards',
  },
  {
    id: 'prop_002',
    title: 'Add "Research Publication" as an approved task category',
    description: 'Students who publish academic research currently cannot claim rewards. Adding this category incentivizes original research.',
    status: 'active',
    yesVotes: 98,
    noVotes: 19,
    deadline: '2025-02-18',
    proposedBy: 'Prof. Ahmad',
    category: 'Categories',
  },
  {
    id: 'prop_003',
    title: 'Monthly XLM bonus for Top 3 leaderboard students',
    description: 'A 50 XLM monthly bonus for the top 3 contributors creates healthy competition and rewards consistent excellence.',
    status: 'active',
    yesVotes: 203,
    noVotes: 83,
    deadline: '2025-02-20',
    proposedBy: 'Mehmet Yilmaz',
    category: 'Incentives',
  },
  {
    id: 'prop_004',
    title: 'Reduce task review time SLA to 48 hours',
    description: 'Current review times can exceed 5 days. A 48-hour SLA with automatic escalation improves student experience.',
    status: 'passed',
    yesVotes: 310,
    noVotes: 31,
    deadline: '2025-01-20',
    proposedBy: 'Admin Council',
    category: 'Process',
  },
]

export function useDAO(walletAddress, reputationScore) {
  const [proposals, setProposals] = useState(() => {
    const saved = localStorage.getItem('daoProposals')
    return saved ? JSON.parse(saved) : DEMO_PROPOSALS
  })
  
  const [votedOn, setVotedOn] = useState(() => {
    const saved = localStorage.getItem('daoVotedOn')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  
  const votingPower = calculateVotingPower(reputationScore || 892)

  useEffect(() => {
    localStorage.setItem('daoProposals', JSON.stringify(proposals))
  }, [proposals])

  useEffect(() => {
    localStorage.setItem('daoVotedOn', JSON.stringify([...votedOn]))
  }, [votedOn])

  const castVote = async (proposalId, vote) => {
    if (votedOn.has(proposalId)) {
      throw new Error('Already voted on this proposal')
    }

    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p
      const power = parseFloat(votingPower)
      return {
        ...p,
        yesVotes: vote === 'yes' ? p.yesVotes + power : p.yesVotes,
        noVotes:  vote === 'no'  ? p.noVotes  + power : p.noVotes,
      }
    }))

    setVotedOn(prev => new Set([...prev, proposalId]))
    return { success: true, power: votingPower }
  }

  return { proposals, castVote, votingPower, votedOn }
}
