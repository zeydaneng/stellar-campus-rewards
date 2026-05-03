import { useMemo } from 'react';
import { calculateLevel } from '../hooks/useAchievements';

export default function Leaderboard({ tasks, currentWallet }: { tasks: any[], currentWallet: string | null }) {
  const leaderboardData = useMemo(() => {
    // Aggregate real tasks
    const statsMap: Record<string, any> = {};

    tasks.forEach(task => {
      if (task.status !== 'Approved' && task.status !== 'Funded') return;
      
      const key = task.wallet || task.studentName;
      if (!statsMap[key]) {
        statsMap[key] = {
          id: key,
          name: task.studentName,
          wallet: task.wallet,
          xp: 0,
          tasksCount: 0,
          rewards: 0,
          isCurrent: currentWallet === task.wallet
        };
      }
      statsMap[key].tasksCount++;
      statsMap[key].rewards += Number(task.amount) || 0;
      // Rough XP calc: 50 xp per task + bonus for reward amount
      statsMap[key].xp += 50 + (Number(task.amount) || 0);
    });

    // Add demo users if the list is small
    const demos = [
      { id: 'demo1', name: 'Zeynep Kaya', wallet: 'GDemo...123', xp: 2850, tasksCount: 42, rewards: 850, isCurrent: false },
      { id: 'demo2', name: 'Mehmet Yilmaz', wallet: 'GDemo...456', xp: 1940, tasksCount: 31, rewards: 420, isCurrent: false },
      { id: 'demo3', name: 'Prof. Ahmad', wallet: 'GDemo...789', xp: 1420, tasksCount: 18, rewards: 0, isCurrent: false },
      { id: 'demo4', name: 'Ayse Demir', wallet: 'GDemo...ABC', xp: 950, tasksCount: 12, rewards: 150, isCurrent: false },
      { id: 'demo5', name: 'Ali Veli', wallet: 'GDemo...XYZ', xp: 620, tasksCount: 8, rewards: 90, isCurrent: false }
    ];

    let combined = [...Object.values(statsMap)];
    demos.forEach(demo => {
      // Don't add demo if they share a name with a real user
      if (!combined.find(c => c.name === demo.name)) {
        combined.push(demo);
      }
    });

    // Calculate levels and sort
    combined = combined.map(user => {
      const levelInfo = calculateLevel(user.xp);
      return { ...user, ...levelInfo };
    });

    return combined.sort((a, b) => b.xp - a.xp).slice(0, 10);
  }, [tasks, currentWallet]);

  return (
    <section className="glass-panel" style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏆 Campus Leaderboard</h2>
        <p style={styles.subtitle}>Top contributors ranked by Experience Points (XP)</p>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Level</th>
              <th style={styles.th}>Tasks</th>
              <th style={styles.th}>Total XP</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  No data yet.
                </td>
              </tr>
            ) : (
              leaderboardData.map((user, idx) => (
                <tr key={user.id} style={{
                  ...styles.tr,
                  background: user.isCurrent ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  borderLeft: user.isCurrent ? '3px solid var(--accent-purple)' : '3px solid transparent'
                }}>
                  <td style={styles.td}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: user.isCurrent ? 'bold' : 'normal', color: user.isCurrent ? 'var(--accent-purple)' : 'white' }}>
                      {user.name} {user.isCurrent && '(You)'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {user.wallet.substring(0, 8)}...
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.levelBadge}>Lvl {user.level}</div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${user.progress}%` }} />
                    </div>
                  </td>
                  <td style={styles.td}>{user.tasksCount}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: 'var(--accent-blue)' }}>{user.xp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    marginBottom: '20px'
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
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  trHead: {
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    textTransform: 'uppercase'
  },
  th: {
    padding: '12px 16px',
    fontWeight: 600
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.2s'
  },
  td: {
    padding: '16px',
    fontSize: '14px'
  },
  levelBadge: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--accent-blue)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '6px'
  },
  progressBar: {
    width: '60px',
    height: '4px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))'
  }
};
