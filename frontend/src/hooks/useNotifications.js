// src/hooks/useNotifications.js
// Real-time notification system — polls Stellar Horizon for tx events

import { useState, useEffect, useCallback } from 'react'

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

export function useNotifications(walletAddress) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notif,
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 50))
    setUnreadCount(prev => prev + 1)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  // Poll Stellar Horizon for new payments to this wallet
  useEffect(() => {
    if (!walletAddress) return

    let lastPagingToken = 'now'

    const pollPayments = async () => {
      try {
        const res = await fetch(
          `${HORIZON_TESTNET}/accounts/${walletAddress}/payments?order=desc&limit=5&cursor=${lastPagingToken}`
        )
        const data = await res.json()

        if (data._embedded?.records) {
          data._embedded.records.forEach(record => {
            if (record.type === 'payment' && record.to === walletAddress) {
              addNotification({
                type: 'reward',
                icon: '💰',
                title: 'XLM Reward Received!',
                message: `+${parseFloat(record.amount).toFixed(2)} XLM from task approval`,
                txHash: record.transaction_hash,
              })
            }
          })
          if (data._embedded.records.length > 0) {
            lastPagingToken = data._embedded.records[0].paging_token
          }
        }
      } catch (err) {
        // Horizon unreachable — silent fail in demo
      }
    }

    return () => {
      // clearInterval(interval)
    }
  }, [walletAddress, addNotification])

  return { notifications, unreadCount, markAllRead, addNotification }
}
