import { useReputation } from '../hooks/useReputation';

export default function ReputationPanel({ walletAddress, approvedTasks }: { walletAddress: string | null, approvedTasks: any[] }) {
  const { scores, overall, dimensions, loading } = useReputation(walletAddress, approvedTasks);

  if (!walletAddress) {
    return (
      <section className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 Reputation Graph</h2>
          <p style={styles.subtitle}>Connect wallet to view your on-chain reputation</p>
        </div>
        <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
          Wallet not connected
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="glass-panel" style={styles.card}>
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-purple)' }}>
          Computing on-chain score...
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel" style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Reputation Graph</h2>
        <p style={styles.subtitle}>Composite on-chain score across 6 dimensions</p>
      </div>

      <div style={styles.overallContainer}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreText}>{overall}</span>
          <span style={styles.scoreLabel}>OVERALL</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
          This score determines your DAO voting power.
        </p>
      </div>

      <div style={styles.barsContainer}>
        {dimensions.map(dim => {
          const score = scores[dim.key as keyof typeof scores] || 0;
          return (
            <div key={dim.key} style={styles.barItem}>
              <div style={styles.barHeader}>
                <span style={styles.barLabel}>{dim.label}</span>
                <span style={{ color: dim.color, fontWeight: 'bold', fontSize: '13px' }}>{score}/100</span>
              </div>
              <div style={styles.track}>
                <div 
                  style={{
                    ...styles.fill, 
                    width: `${score}%`, 
                    background: `linear-gradient(90deg, ${dim.color}88, ${dim.color})`,
                    boxShadow: `0 0 10px ${dim.color}44`
                  }} 
                />
              </div>
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
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0
  },
  overallContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px'
  },
  scoreCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.3)',
    border: '3px solid var(--accent-purple)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.2)'
  },
  scoreText: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 1,
    textShadow: '0 0 10px var(--accent-purple-glow)'
  },
  scoreLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    letterSpacing: '2px',
    marginTop: '4px'
  },
  barsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  track: {
    width: '100%',
    height: '8px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s ease-in-out'
  }
};
