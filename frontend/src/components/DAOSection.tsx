import { useState } from 'react';
import { useDAO } from '../hooks/useDAO';
import { useReputation } from '../hooks/useReputation';

export default function DAOSection({ walletAddress, approvedTasks, addNotification }: { walletAddress: string | null, approvedTasks: any[], addNotification: (notif: any) => void }) {
  // We need reputation score to pass to useDAO. In a real app we'd get the overall from context or state.
  const { overall } = useReputation(walletAddress, approvedTasks);
  const { proposals, castVote, votingPower, votedOn } = useDAO(walletAddress, overall);
  
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleVote = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!walletAddress) {
      setMsg({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    try {
      const res = await castVote(proposalId, vote);
      if (res.success) {
        addNotification({
          type: 'dao',
          icon: '🗳️',
          title: 'Vote Cast Successfully',
          message: `Your vote of "${vote.toUpperCase()}" with ${res.power} power was recorded.`
        });
        setMsg({ text: `Vote cast successfully! Power: ${res.power}`, type: 'success' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <section className="glass-panel" style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🏛 University DAO Governance</h2>
          <p style={styles.subtitle}>Vote on campus policies. Your voting power is your reputation score.</p>
        </div>
        <div style={styles.powerBadge}>
          Voting Power: <strong>{walletAddress ? votingPower : '0.00'}</strong>
        </div>
      </div>

      {msg && (
        <div style={{
          ...styles.msgAlert,
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${msg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {msg.type === 'success' ? '✅' : '❌'} {msg.text}
        </div>
      )}

      <div style={styles.proposalsGrid}>
        {proposals.map(prop => {
          const totalVotes = prop.yesVotes + prop.noVotes;
          const yesPercent = totalVotes > 0 ? (prop.yesVotes / totalVotes) * 100 : 0;
          const hasVoted = votedOn.has(prop.id);
          
          return (
            <div key={prop.id} style={styles.proposalCard}>
              <div style={styles.propHeader}>
                <span style={styles.categoryBadge}>{prop.category}</span>
                <span style={{
                  ...styles.statusBadge,
                  background: prop.status === 'active' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: prop.status === 'active' ? 'var(--accent-blue)' : 'var(--success)'
                }}>
                  {prop.status === 'active' ? '🟢 Active' : '✅ Passed'}
                </span>
              </div>
              
              <h3 style={styles.propTitle}>{prop.title}</h3>
              <p style={styles.propDesc}>{prop.description}</p>
              
              <div style={styles.metaInfo}>
                <span>By: {prop.proposedBy}</span>
                <span>Deadline: {prop.deadline}</span>
              </div>

              <div style={styles.resultsContainer}>
                <div style={styles.barHeader}>
                  <span>Yes: {prop.yesVotes.toFixed(2)}</span>
                  <span>No: {prop.noVotes.toFixed(2)}</span>
                </div>
                <div style={styles.track}>
                  {totalVotes > 0 ? (
                    <div style={{ ...styles.fillYes, width: `${yesPercent}%` }} />
                  ) : (
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  )}
                </div>
              </div>

              {prop.status === 'active' && (
                <div style={styles.voteActions}>
                  <button 
                    disabled={hasVoted || !walletAddress}
                    onClick={() => handleVote(prop.id, 'yes')}
                    style={{
                      ...styles.voteBtn,
                      background: hasVoted ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.15)',
                      color: hasVoted ? 'var(--text-secondary)' : 'var(--success)',
                      borderColor: hasVoted ? 'transparent' : 'rgba(16, 185, 129, 0.3)',
                      cursor: hasVoted || !walletAddress ? 'not-allowed' : 'pointer'
                    }}
                  >
                    👍 Vote Yes
                  </button>
                  <button 
                    disabled={hasVoted || !walletAddress}
                    onClick={() => handleVote(prop.id, 'no')}
                    style={{
                      ...styles.voteBtn,
                      background: hasVoted ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.15)',
                      color: hasVoted ? 'var(--text-secondary)' : 'var(--danger)',
                      borderColor: hasVoted ? 'transparent' : 'rgba(239, 68, 68, 0.3)',
                      cursor: hasVoted || !walletAddress ? 'not-allowed' : 'pointer'
                    }}
                  >
                    👎 Vote No
                  </button>
                </div>
              )}
              {hasVoted && (
                <div style={styles.votedNotice}>
                  You have already voted on this proposal.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)',
    marginTop: '32px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0
  },
  powerBadge: {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))',
    border: '1px solid var(--accent-purple)',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    color: 'white'
  },
  msgAlert: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  proposalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  proposalCard: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  propHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  categoryBadge: {
    background: 'rgba(255,255,255,0.1)',
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '6px',
    color: 'var(--text-secondary)'
  },
  statusBadge: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 'bold'
  },
  propTitle: {
    fontSize: '16px',
    margin: '0 0 8px 0',
    color: 'white'
  },
  propDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: '0 0 16px 0',
    flexGrow: 1
  },
  metaInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '12px'
  },
  resultsContainer: {
    marginBottom: '16px'
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '6px',
    color: 'var(--text-secondary)'
  },
  track: {
    width: '100%',
    height: '6px',
    background: 'rgba(239, 68, 68, 0.4)', // No color as background
    borderRadius: '3px',
    overflow: 'hidden'
  },
  fillYes: {
    height: '100%',
    background: 'var(--success, #10b981)',
    transition: 'width 0.5s ease-in-out'
  },
  voteActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  voteBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  votedNotice: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '10px',
    padding: '8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '6px'
  }
};
