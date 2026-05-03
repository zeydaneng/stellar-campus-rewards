import { ACHIEVEMENTS } from '../hooks/useAchievements';

export default function AchievementsGrid({ earnedIds }: { earnedIds: string[] }) {

  return (
    <section className="glass-panel" style={styles.card}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.title}>🎖 NFT Certificates</h2>
            <p style={styles.subtitle}>Proof-of-Contribution on Stellar</p>
          </div>
          <div style={styles.countBadge}>
            {earnedIds.length} / {ACHIEVEMENTS.length} Unlocked
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {ACHIEVEMENTS.map((ach: any) => {
          const isEarned = earnedIds.includes(ach.id);
          return (
            <div 
              key={ach.id} 
              style={{
                ...styles.nftCard, 
                opacity: isEarned ? 1 : 0.5,
                filter: isEarned ? 'none' : 'grayscale(80%)',
                borderColor: isEarned ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={styles.nftEmoji}>{ach.emoji}</div>
              <h4 style={styles.nftName}>{ach.name}</h4>
              <p style={styles.nftDesc}>{ach.description}</p>
              
              <div style={styles.metaRow}>
                <span style={{
                  ...styles.badge, 
                  background: ach.nftMetadata.edition === 'Common' ? 'rgba(156, 163, 175, 0.2)' :
                              ach.nftMetadata.edition === 'Uncommon' ? 'rgba(16, 185, 129, 0.2)' :
                              ach.nftMetadata.edition === 'Rare' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                  color: ach.nftMetadata.edition === 'Common' ? '#9ca3af' :
                         ach.nftMetadata.edition === 'Uncommon' ? '#10b981' :
                         ach.nftMetadata.edition === 'Rare' ? '#3b82f6' : '#a855f7'
                }}>
                  {ach.nftMetadata.edition}
                </span>
                <span style={{...styles.badge, color: 'var(--text-secondary)'}}>
                  +{ach.xpReward} XP
                </span>
              </div>
              
              {isEarned && (
                <>
                  <div style={styles.mintedTag}>
                    ✅ Minted
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-blue)', marginTop: '8px', opacity: 0.8 }}>
                    ID: 0x{Array.from(ach.id).reduce((s: string, c: any) => s + String(c).charCodeAt(0).toString(16), '').substring(0, 8)}...
                  </div>
                </>
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
    height: '100%'
  },
  header: {
    marginBottom: '24px'
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
  countBadge: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--accent-blue)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px'
  },
  nftCard: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.3s',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  },
  nftEmoji: {
    fontSize: '36px',
    marginBottom: '10px',
    background: 'rgba(255,255,255,0.05)',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  nftName: {
    fontSize: '15px',
    margin: '0 0 6px 0',
    color: 'var(--text-primary)'
  },
  nftDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    margin: '0 0 16px 0',
    lineHeight: 1.4
  },
  metaRow: {
    display: 'flex',
    gap: '6px',
    marginTop: 'auto'
  },
  badge: {
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)'
  },
  mintedTag: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'var(--success)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  }
};
