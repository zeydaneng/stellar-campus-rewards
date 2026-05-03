// src/hooks/useReputation.js
// Decentralized Reputation Graph — computes on-chain composite score

import { useState, useEffect } from 'react'

const DIMENSIONS = [
  { key: 'academic',     label: 'Academic Tasks',   weight: 0.25, color: '#00b4d8' },
  { key: 'volunteering', label: 'Volunteering',      weight: 0.15, color: '#10b981' },
  { key: 'opensource',   label: 'Open Source',       weight: 0.20, color: '#6c63ff' },
  { key: 'attendance',   label: 'Attendance',         weight: 0.15, color: '#f5a623' },
  { key: 'peerReview',   label: 'Peer Reviews',      weight: 0.10, color: '#ec4899' },
  { key: 'innovation',   label: 'Innovation',         weight: 0.15, color: '#3b82f6' },
]

/**
 * Computes a weighted reputation score from approved tasks.
 * In production this reads from a Soroban contract storage map.
 */
export function useReputation(walletAddress, approvedTasks = []) {
  const [scores, setScores] = useState({})
  const [overall, setOverall] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) {
      setScores({})
      setOverall(0)
      setLoading(false)
      return
    }

    // Simulate on-chain read latency
    const timer = setTimeout(() => {
      const dimensionScores = {}

      DIMENSIONS.forEach(({ key }) => {
        // Map App.tsx taskType to Reputation Dimensions
        const relevant = approvedTasks.filter(t => {
          if (key === 'academic') return t.taskType === 'Workshop' || t.taskType === 'Course Completion'
          if (key === 'volunteering') return t.taskType === 'Volunteering' || t.taskType === 'Community Help'
          if (key === 'opensource') return t.taskType === 'Course Completion'
          if (key === 'attendance') return t.taskType === 'Workshop'
          if (key === 'peerReview') return t.taskType === 'Community Help'
          if (key === 'innovation') return t.taskType === 'Course Completion' || t.taskType === 'Workshop'
          return false
        })
        
        // Base score of 10 just for connecting wallet, +15 per relevant task
        dimensionScores[key] = Math.min(100, relevant.length * 15 + 10)
      })

      const composite = Math.round(
        DIMENSIONS.reduce((sum, { key, weight }) => sum + (dimensionScores[key] || 0) * weight * 10, 0)
      )

      setScores(dimensionScores)
      setOverall(composite)
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [walletAddress, approvedTasks])

  return { scores, overall, dimensions: DIMENSIONS, loading }
}
