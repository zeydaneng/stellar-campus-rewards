import { useState, useEffect } from "react";
import "./index.css";
import { requestAccess, signTransaction, isConnected, getAddress } from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset
} from "@stellar/stellar-sdk";

import NotificationCenter from "./components/NotificationCenter";
import ReputationPanel from "./components/ReputationPanel";
import AchievementsGrid from "./components/AchievementsGrid";
import DAOSection from "./components/DAOSection";
import Leaderboard from "./components/Leaderboard";
import { useNotifications } from "./hooks/useNotifications";
import { checkAndMintAchievements } from "./hooks/useAchievements";

// Initialize Stellar Testnet Server
const server = new Horizon.Server("https://horizon-testnet.stellar.org");

async function sendReward(studentAddress: string, amount: number) {
  try {
    const addressResponse: any = await getAddress();
    const publicKey = typeof addressResponse === 'string' ? addressResponse : addressResponse.address;

    if (!publicKey) {
      throw new Error(addressResponse.error || "Could not fetch address");
    }

    const account = await server.loadAccount(publicKey);

    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: studentAddress,
          asset: Asset.native(),
          amount: amount.toString(),
        })
      )
      .setTimeout(30)
      .build();

    const signedTxResponse: any = await signTransaction(tx.toXDR(), {
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    const signedTxXdr = typeof signedTxResponse === 'string' ? signedTxResponse : signedTxResponse.signedTxXdr;

    if (!signedTxXdr) {
      throw new Error(signedTxResponse.error || "User declined or signing failed.");
    }

    const result = await server.submitTransaction(
      TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET)
    );

    // Remove default alert for better custom UI modal
    // alert("✅ Reward sent successfully!\nHash: " + result.hash);

    console.log(result);
    return result;

  } catch (error: any) {
    console.error("Send Reward Error:", error);
    alert(`❌ Transaction failed: ${error.message || JSON.stringify(error)}`);
    throw error;
  }
}

type TaskType = "Workshop" | "Volunteering" | "Course Completion" | "Community Help";
type TaskStatus = "Pending" | "Approved" | "Rejected" | "Funded";
type Role = "student" | "teacher";

type CampusTask = {
  id: number;
  studentName: string;
  university: string;
  wallet: string;
  taskType: TaskType;
  description: string;
  amount: number;
  status: TaskStatus;
};

type TransactionRecord = {
  id: string;
  studentName: string;
  amount: number;
  date: string;
  hash: string;
};

export default function App() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  
  // App State with localStorage persistence
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem("campusRole") as Role) || "student";
  });

  const [tasks, setTasks] = useState<CampusTask[]>(() => {
    const saved = localStorage.getItem("campusTasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem("campusTransactions");
    return saved ? JSON.parse(saved) : [];
  });

  // Form States
  const [studentName, setStudentName] = useState("");
  const [university, setUniversity] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("Workshop");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Teacher Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Filters & UI States
  const [filter, setFilter] = useState<"All" | TaskStatus>("All");
  const [successModal, setSuccessModal] = useState<{show: boolean, hash: string} | null>(null);
  
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem("campusAchievements");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [confirmRewardModal, setConfirmRewardModal] = useState<CampusTask | null>(null);

  const { notifications, unreadCount, markAllRead, addNotification } = useNotifications(wallet);

  useEffect(() => {
    localStorage.setItem("campusAchievements", JSON.stringify(earnedAchievements));
  }, [earnedAchievements]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("campusRole", role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem("campusTasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("campusTransactions", JSON.stringify(transactions));
  }, [transactions]);

  // Stats
  const totalRewardsSent = tasks.filter(t => t.status === "Funded").reduce((sum, t) => sum + t.amount, 0);
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;
  const approvedTasks = tasks.filter(t => t.status === "Approved").length;
  const fundedTasks = tasks.filter(t => t.status === "Funded").length;

  const studentStats = {
    totalTasks: fundedTasks + approvedTasks,
    tasksThisWeek: fundedTasks + approvedTasks,
    blockchainTasks: tasks.filter(t => t.taskType === "Workshop" && (t.status === "Approved" || t.status === "Funded")).length,
    volunteerTasks: tasks.filter(t => t.taskType === "Volunteering" && (t.status === "Approved" || t.status === "Funded")).length,
    projects: tasks.filter(t => t.taskType === "Course Completion" && (t.status === "Approved" || t.status === "Funded")).length,
    leaderboardRank: 1,
    level: 1
  };

  useEffect(() => {
    if (!wallet) return;
    const mintNew = async () => {
      // Mock minting function
      const mintNFT = async () => new Promise(res => setTimeout(res, 500));
      const newlyEarned = await checkAndMintAchievements(studentStats, earnedAchievements, mintNFT);
      if (newlyEarned.length > 0) {
        setEarnedAchievements(prev => [...prev, ...newlyEarned]);
        newlyEarned.forEach(id => {
          addNotification({
            type: 'nft',
            icon: '🎖️',
            title: 'Achievement Unlocked!',
            message: `You earned a new Proof-of-Contribution certificate.`
          });
        });
      }
    };
    mintNew();
  }, [studentStats.totalTasks, studentStats.level, wallet]);

  const connectWallet = async () => {
    try {
      const connected = await isConnected();
      const isExtConnected = typeof connected === 'boolean' ? connected : (connected as any).isConnected;
      
      if (!isExtConnected) {
        return alert("⚠️ Freighter wallet is not installed! Please install the browser extension.");
      }

      await requestAccess();

      const addressResponse: any = await getAddress();
      const publicKey = typeof addressResponse === 'string' ? addressResponse : addressResponse.address;

      if (!publicKey) {
        return alert(`⚠️ Could not fetch address. ${addressResponse.error || "Please unlock your wallet."}`);
      }

      setWallet(publicKey);
      
      try {
        const account = await server.loadAccount(publicKey);
        const nativeBalance = account.balances.find((b: any) => b.asset_type === "native");
        if (nativeBalance) {
          setBalance(nativeBalance.balance);
        }
      } catch (accErr) {
        console.warn("Account not found on testnet", accErr);
        setBalance("0");
      }
    } catch (error: any) {
      console.error("Wallet connection error", error);
      alert(`❌ Connection failed: ${error.message || "Please check Freighter popup."}`);
    }
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === "teacher@bozok.edu.tr" && loginPassword === "admin123") {
      setRole("teacher");
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } else {
      alert("❌ Invalid credentials!");
    }
  };

  const submitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !university || !walletAddress || !description || !amount) {
      return alert("Please fill in all fields.");
    }

    const newTask: CampusTask = {
      id: Date.now(),
      studentName,
      university,
      wallet: walletAddress,
      taskType,
      description,
      amount: Number(amount),
      status: "Pending"
    };

    setTasks([newTask, ...tasks]);
    
    // Reset form
    setStudentName("");
    setUniversity("");
    setWalletAddress("");
    setTaskType("Workshop");
    setDescription("");
    setAmount("");
    addNotification({ type: 'submit', icon: '📝', title: 'Task Submitted', message: `Your task "${description.substring(0, 20)}..." is pending review.` });
    alert("✅ Task submitted successfully!");
  };

  const updateTaskStatus = (id: number, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (status === "Approved") {
      addNotification({ type: 'approve', icon: '✅', title: 'Task Approved!', message: `A teacher approved your task. Awaiting funding.` });
    } else if (status === "Rejected") {
      addNotification({ type: 'reject', icon: '❌', title: 'Task Rejected', message: `Your task was rejected.` });
    }
  };

  const confirmAndSendReward = async (task: CampusTask) => {
    setConfirmRewardModal(null);
    try {
      const result = await sendReward(task.wallet, task.amount);
      if (result && result.hash) {
        updateTaskStatus(task.id, "Funded");
        
        const newTx: TransactionRecord = {
          id: result.hash,
          studentName: task.studentName,
          amount: task.amount,
          date: new Date().toLocaleString(),
          hash: result.hash
        };
        setTransactions(prev => [newTx, ...prev]);
        setSuccessModal({ show: true, hash: result.hash });
        addNotification({ type: 'reward', icon: '💰', title: 'Reward Funded!', message: `${task.amount} XLM has been sent to ${task.studentName}.` });

        // Refresh balance
        if (wallet) {
          const account = await server.loadAccount(wallet);
          const nativeBalance = account.balances.find((b: any) => b.asset_type === "native");
          if (nativeBalance) setBalance(nativeBalance.balance);
        }
      }
    } catch (e) {
      // Errors handled inside sendReward
    }
  };

  const filteredTasks = tasks.filter(t => filter === "All" ? true : t.status === filter);

  return (
    <div style={styles.container}>
      {/* Header Navigation */}
      <nav style={styles.navbar} className="glass-panel">
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>🎓</div>
          <h1 style={styles.navTitle} className="text-gradient">Stellar Campus Rewards</h1>
        </div>
        
        <div style={{display: "flex", gap: "15px", alignItems: "center"}}>
          <div style={styles.roleTabs}>
            <button 
              style={{...styles.tabButton, background: role === "student" ? "var(--accent-blue)" : "transparent"}}
              onClick={() => { setRole("student"); setShowLogin(false); }}
            >
              🧑‍🎓 Student
            </button>
            <button 
              style={{...styles.tabButton, background: role === "teacher" ? "var(--accent-purple)" : "transparent"}}
              onClick={() => role === "teacher" ? null : setShowLogin(true)}
            >
              👩‍🏫 Teacher
            </button>
          </div>

          <NotificationCenter notifications={notifications} unreadCount={unreadCount} markAllRead={markAllRead} />

          {!wallet ? (
            <button style={styles.connectButton} className="btn-glow" onClick={connectWallet}>
              🚀 Connect Freighter
            </button>
          ) : (
            <div style={styles.walletInfo}>
              <div style={styles.walletBadge}>
                <span style={{color: "var(--accent-purple)"}}>●</span> {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
              </div>
              <div style={styles.balanceBadge}>
                {Number(balance).toFixed(2)} XLM
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection} className="float-animation">
        <h2 style={styles.heroTitle}>
          {role === "teacher" ? "Teacher Dashboard" : "Empower Student Contributions"}
        </h2>
        <p style={styles.heroSubtitle}>
          {role === "teacher" 
            ? "Review submissions, manage tasks, and send instant XLM rewards securely on the Stellar Testnet." 
            : "Seamlessly reward campus activities, workshops, and volunteering efforts directly through the power of the Stellar Testnet."}
        </p>
      </section>

      <main style={styles.main}>
        
        {/* Teacher Login Modal/Card */}
        {showLogin && role !== "teacher" && (
          <section style={{...styles.card, maxWidth: "400px", margin: "0 auto", border: "1px solid var(--accent-purple)"}} className="glass-panel">
            <h2 style={{...styles.cardTitle, textAlign: "center", marginBottom: "20px"}}>Teacher Login</h2>
            <form onSubmit={handleTeacherLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input required type="email" style={styles.input} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="teacher@bozok.edu.tr" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input required type="password" style={styles.input} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="admin123" />
              </div>
              <button type="submit" style={{...styles.submitButton, background: "var(--accent-purple)"}} className="btn-glow">Login to Dashboard</button>
              <button type="button" onClick={() => setShowLogin(false)} style={{background: "transparent", color: "var(--text-secondary)", border: "none", cursor: "pointer", marginTop: "10px"}}>Cancel</button>
            </form>
          </section>
        )}

        {/* --- STUDENT VIEW --- */}
        {role === "student" && !showLogin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{...styles.card, padding: '20px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', border: '1px solid var(--accent-purple)'}} className="glass-panel">
              <div style={{textAlign: 'center'}}><div style={{fontSize: '24px', fontWeight: 'bold'}}>{studentStats.totalTasks}</div><div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Total Tasks</div></div>
              <div style={{textAlign: 'center'}}><div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)'}}>{studentStats.level}</div><div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Level</div></div>
              <div style={{textAlign: 'center'}}><div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--success)'}}>{fundedTasks}</div><div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Funded Tasks</div></div>
              <div style={{textAlign: 'center'}}><div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--warning)'}}>{totalRewardsSent} XLM</div><div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Total Earned</div></div>
            </div>

            <div style={styles.contentGrid}>
              <ReputationPanel walletAddress={wallet} approvedTasks={tasks.filter(t => t.status === "Approved" || t.status === "Funded")} />
              <AchievementsGrid earnedIds={earnedAchievements} />
            </div>

            <div style={styles.contentGrid}>
              {/* Submission Form */}
              <section style={styles.card} className="glass-panel">
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>📝 Submit a Task</h2>
                <p style={styles.cardSubtitle}>Fill out your details to claim your reward</p>
              </div>
              
              <form onSubmit={submitTask} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Student Name</label>
                    <input required style={styles.input} value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>University</label>
                    <input required style={styles.input} value={university} onChange={e => setUniversity(e.target.value)} placeholder="Stanford" />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stellar Wallet Address (Testnet)</label>
                  <input required style={styles.input} value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="GABC..." />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Task Type</label>
                    <select style={styles.input} value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
                      <option value="Workshop">Workshop</option>
                      <option value="Volunteering">Volunteering</option>
                      <option value="Course Completion">Course Completion</option>
                      <option value="Community Help">Community Help</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Reward (XLM)</label>
                    <input required type="number" min="1" style={styles.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="100" />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea required style={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="What did you achieve?" />
                </div>
                
                <button type="submit" style={styles.submitButton} className="btn-glow">Submit Application</button>
              </form>
            </section>

            {/* Student Task List (Read-only) */}
            <section style={styles.card} className="glass-panel">
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>📋 Recent Submissions</h2>
                <p style={styles.cardSubtitle}>Track task statuses</p>
              </div>
              <div style={styles.taskList}>
                {tasks.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={{fontSize: "3rem", marginBottom: "10px", opacity: 0.5}}>📭</div>
                    <p>🚀 Submit your first campus contribution.</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} style={{...styles.taskCard, padding: "16px"}}>
                      <div style={styles.taskHeader}>
                        <div>
                          <h3 style={{...styles.taskStudentName, fontSize: "16px"}}>{task.studentName}</h3>
                          <span style={{...styles.taskTypeBadge, fontSize: "10px"}}>{task.taskType}</span>
                        </div>
                        <span style={{
                          ...styles.statusBadge, fontSize: "10px", padding: "4px 8px",
                          background: task.status === "Pending" ? "rgba(245, 158, 11, 0.15)" : 
                                      task.status === "Approved" ? "rgba(59, 130, 246, 0.15)" : 
                                      task.status === "Rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: task.status === "Pending" ? "var(--warning)" : 
                                 task.status === "Approved" ? "var(--accent-blue)" : 
                                 task.status === "Rejected" ? "var(--danger)" : "var(--success)"
                        }}>
                          {task.status}
                        </span>
                      </div>
                      <div style={{...styles.rewardBox, padding: "8px", marginBottom: "0"}}>
                        <span style={{fontSize: "12px"}}>Requested:</span>
                        <strong style={{fontSize: "14px"}}>{task.amount} XLM</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            </div>

            <DAOSection walletAddress={wallet} approvedTasks={tasks.filter(t => t.status === "Approved" || t.status === "Funded")} addNotification={addNotification} />
            <Leaderboard tasks={tasks} currentWallet={wallet} />
          </div>
        )}

        {/* --- TEACHER VIEW --- */}
        {role === "teacher" && (
          <>
            {/* Dashboard Stats */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard} className="glass-panel">
                <div style={styles.statIconWrapper}>💰</div>
                <div>
                  <p style={styles.statLabel}>Total Sent</p>
                  <h3 style={{...styles.statValue, color: "var(--accent-purple)"}}>{totalRewardsSent} <span style={{fontSize:"1rem"}}>XLM</span></h3>
                </div>
              </div>
              <div style={styles.statCard} className="glass-panel">
                <div style={styles.statIconWrapper}>⏳</div>
                <div>
                  <p style={styles.statLabel}>Pending</p>
                  <h3 style={{...styles.statValue, color: "var(--warning)"}}>{pendingTasks}</h3>
                </div>
              </div>
              <div style={styles.statCard} className="glass-panel">
                <div style={styles.statIconWrapper}>✅</div>
                <div>
                  <p style={styles.statLabel}>Approved</p>
                  <h3 style={{...styles.statValue, color: "var(--accent-blue)"}}>{approvedTasks}</h3>
                </div>
              </div>
              <div style={styles.statCard} className="glass-panel">
                <div style={styles.statIconWrapper}>🚀</div>
                <div>
                  <p style={styles.statLabel}>Funded</p>
                  <h3 style={{...styles.statValue, color: "var(--success)"}}>{fundedTasks}</h3>
                </div>
              </div>
            </div>

            {/* Filters & Task Board */}
            <section style={styles.card} className="glass-panel">
              <div style={{...styles.cardHeader, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px"}}>
                <div>
                  <h2 style={styles.cardTitle}>📋 Task Management</h2>
                  <p style={styles.cardSubtitle}>Review and fund student activities</p>
                </div>
                
                {/* Filters */}
                <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                  {["All", "Pending", "Approved", "Funded", "Rejected"].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f as any)}
                      style={{
                        background: filter === f ? "var(--glass-border)" : "transparent",
                        color: filter === f ? "white" : "var(--text-secondary)",
                        border: "1px solid var(--glass-border)",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: filter === f ? "bold" : "normal"
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px"}}>
                {filteredTasks.length === 0 ? (
                  <div style={{...styles.emptyState, gridColumn: "1 / -1"}}>
                    <div style={{fontSize: "3rem", marginBottom: "10px", opacity: 0.5}}>📭</div>
                    <p>No tasks found for this filter.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div key={task.id} style={styles.taskCard}>
                      <div style={styles.taskHeader}>
                        <div>
                          <h3 style={styles.taskStudentName}>{task.studentName}</h3>
                          <span style={styles.taskTypeBadge}>{task.taskType}</span>
                          <span style={{...styles.taskTypeBadge, background: "linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(234, 179, 8, 0.15))", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)", display: "inline-block", marginTop: "5px"}}>Top Contributor 🏆</span>
                        </div>
                        
                        <span style={{
                          ...styles.statusBadge, 
                          background: task.status === "Pending" ? "rgba(245, 158, 11, 0.15)" : 
                                      task.status === "Approved" ? "rgba(59, 130, 246, 0.15)" : 
                                      task.status === "Rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: task.status === "Pending" ? "var(--warning)" : 
                                 task.status === "Approved" ? "var(--accent-blue)" : 
                                 task.status === "Rejected" ? "var(--danger)" : "var(--success)",
                          border: `1px solid ${
                                 task.status === "Pending" ? "var(--warning)" : 
                                 task.status === "Approved" ? "var(--accent-blue)" : 
                                 task.status === "Rejected" ? "var(--danger)" : "var(--success)"}`
                        }}>
                          {task.status === "Pending" && "⏳"}
                          {task.status === "Approved" && "✨"}
                          {task.status === "Rejected" && "❌"}
                          {task.status === "Funded" && "🚀"}
                          &nbsp;{task.status}
                        </span>
                      </div>
                      
                      <div style={styles.taskMeta}>
                        <p><strong>🏛 University:</strong> {task.university}</p>
                        <p><strong>💼 Wallet:</strong> <span style={{opacity: 0.8}}>{task.wallet.substring(0,8)}...{task.wallet.substring(task.wallet.length-4)}</span></p>
                      </div>
                      
                      <div style={styles.descriptionBox}>"{task.description}"</div>
                      
                      <div style={styles.rewardBox}>
                        <span style={{fontWeight: 600, color: "var(--text-primary)"}}>Reward:</span>
                        <strong style={{fontSize: "1.2rem", textShadow: "0 0 10px var(--accent-purple-glow)"}}>{task.amount} XLM</strong>
                      </div>

                      {/* Admin Actions */}
                      <div style={styles.actions}>
                        {task.status === "Pending" && (
                          <>
                            <button 
                              style={{...styles.actionBtn, background: "rgba(16, 185, 129, 0.2)", color: "var(--success)", border: "1px solid var(--success)"}} 
                              onClick={() => updateTaskStatus(task.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button 
                              style={{...styles.actionBtn, background: "rgba(239, 68, 68, 0.2)", color: "var(--danger)", border: "1px solid var(--danger)"}} 
                              onClick={() => updateTaskStatus(task.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {task.status === "Approved" && (
                          <button 
                            className="btn-glow"
                            style={{...styles.actionBtn, background: "linear-gradient(to right, var(--accent-purple), var(--accent-blue))", color: "white", width: "100%", border: "none"}} 
                            onClick={() => setConfirmRewardModal(task)}
                          >
                            💸 Send Reward ({task.amount} XLM)
                          </button>
                        )}
                        {task.status === "Funded" && (
                          <button 
                            disabled
                            style={{...styles.actionBtn, background: "rgba(255,255,255,0.05)", color: "var(--success)", width: "100%", border: "1px solid var(--success)", opacity: 0.7, cursor: "not-allowed"}} 
                          >
                            🚀 Already Funded
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Transaction History */}
            <section style={styles.card} className="glass-panel">
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>🔗 Transaction History</h2>
                <p style={styles.cardSubtitle}>Record of all successful XLM rewards</p>
              </div>
              
              <div style={{overflowX: "auto"}}>
                {transactions.length === 0 ? (
                  <p style={{color: "var(--text-secondary)", textAlign: "center", padding: "20px"}}>No rewards sent yet.</p>
                ) : (
                  <table style={{width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left"}}>
                    <thead>
                      <tr style={{borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)"}}>
                        <th style={{padding: "12px"}}>Date</th>
                        <th style={{padding: "12px"}}>Student</th>
                        <th style={{padding: "12px"}}>Amount (XLM)</th>
                        <th style={{padding: "12px"}}>Hash Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={idx} style={{borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                          <td style={{padding: "12px", color: "var(--text-secondary)"}}>{tx.date}</td>
                          <td style={{padding: "12px"}}>{tx.studentName}</td>
                          <td style={{padding: "12px", color: "var(--accent-purple)", fontWeight: "bold"}}>{tx.amount}</td>
                          <td style={{padding: "12px"}}>
                            <a href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{color: "var(--accent-neon)", textDecoration: "underline"}}>
                              {tx.hash.substring(0, 10)}...
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Confirm Reward Modal */}
      {confirmRewardModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", 
          alignItems: "center", zIndex: 1000, backdropFilter: "blur(5px)"
        }}>
          <div style={{...styles.card, background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--warning)", textAlign: "center", maxWidth: "400px"}}>
            <div style={{fontSize: "4rem", marginBottom: "10px"}}>⚠️</div>
            <h2 style={{margin: "0 0 10px 0", color: "white"}}>Confirm Reward</h2>
            <p style={{color: "var(--text-secondary)", marginBottom: "20px", fontSize: "14px"}}>
              You are about to send <strong>{confirmRewardModal.amount} XLM</strong> to <strong>{confirmRewardModal.studentName}</strong>.
            </p>
            <p style={{color: "var(--text-secondary)", marginBottom: "20px", fontSize: "12px", wordBreak: "break-all"}}>
              Wallet: {confirmRewardModal.wallet}
            </p>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                style={{...styles.submitButton, background: "rgba(255,255,255,0.1)", color: "white"}}
                onClick={() => setConfirmRewardModal(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-glow"
                style={{...styles.submitButton}}
                onClick={() => confirmAndSendReward(confirmRewardModal)}
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && successModal.show && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", 
          alignItems: "center", zIndex: 1000, backdropFilter: "blur(5px)"
        }}>
          <div style={{...styles.card, background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--success)", textAlign: "center", maxWidth: "400px"}}>
            <div style={{fontSize: "4rem", marginBottom: "10px"}}>✅</div>
            <h2 style={{margin: "0 0 10px 0", color: "var(--success)"}}>Reward sent successfully!</h2>
            <p style={{color: "var(--text-secondary)", marginBottom: "20px", fontSize: "14px"}}>
              The XLM has been transferred to the student.
            </p>
            <div style={{background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "8px", marginBottom: "20px", wordBreak: "break-all", fontSize: "12px", border: "1px solid var(--glass-border)"}}>
              <a href={`https://stellar.expert/explorer/testnet/tx/${successModal.hash}`} target="_blank" rel="noreferrer" style={{color: "var(--accent-blue)", textDecoration: "none"}}>
                View on Stellar Expert ↗
              </a>
            </div>
            <button 
              onClick={() => setSuccessModal(null)}
              style={{...styles.submitButton, background: "var(--success)", width: "100%", padding: "12px"}}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "20px",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px"
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoIcon: {
    fontSize: "28px",
    background: "rgba(255,255,255,0.1)",
    padding: "8px",
    borderRadius: "12px"
  },
  navTitle: {
    fontSize: "24px",
    margin: 0
  },
  roleTabs: {
    display: "flex",
    background: "rgba(0,0,0,0.3)",
    padding: "4px",
    borderRadius: "12px",
    border: "1px solid var(--glass-border)"
  },
  tabButton: {
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.3s"
  },
  connectButton: {
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
    color: "white",
    border: "none",
    padding: "12px 28px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.2s",
    boxShadow: "0 4px 15px rgba(168, 85, 247, 0.4)"
  },
  walletInfo: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  walletBadge: {
    background: "rgba(255, 255, 255, 0.05)",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid var(--glass-border)",
    fontSize: "14px",
    fontWeight: 500
  },
  balanceBadge: {
    background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))",
    color: "white",
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid var(--accent-purple)",
    fontWeight: "bold",
    fontSize: "14px",
    boxShadow: "0 0 10px var(--accent-purple-glow)"
  },
  heroSection: {
    textAlign: "center",
    padding: "20px",
    marginBottom: "40px"
  },
  heroTitle: {
    fontSize: "3rem",
    marginBottom: "16px",
    background: "linear-gradient(to right, #f8fafc, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  heroSubtitle: {
    color: "var(--text-secondary)",
    fontSize: "1.1rem",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: 1.8
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: "40px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px"
  },
  statCard: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "transform 0.3s ease",
  },
  statIconWrapper: {
    fontSize: "32px",
    background: "rgba(255,255,255,0.05)",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    border: "1px solid var(--glass-border)"
  },
  statLabel: {
    color: "var(--text-secondary)",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "28px",
    margin: 0,
    textShadow: "0 0 20px rgba(0,0,0,0.5)"
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 5fr) minmax(0, 4fr)",
    gap: "32px",
    alignItems: "start"
  },
  card: {
    padding: "32px"
  },
  cardHeader: {
    marginBottom: "24px",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "16px"
  },
  cardTitle: {
    fontSize: "22px",
    marginBottom: "4px"
  },
  cardSubtitle: {
    color: "var(--text-secondary)",
    fontSize: "14px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    letterSpacing: "0.5px"
  },
  input: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid var(--glass-border)",
    padding: "14px",
    borderRadius: "12px",
    color: "white",
    transition: "all 0.3s"
  },
  textarea: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid var(--glass-border)",
    padding: "14px",
    borderRadius: "12px",
    color: "white",
    minHeight: "120px",
    transition: "all 0.3s"
  },
  submitButton: {
    background: "var(--accent-blue)",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 4px 15px var(--accent-blue-glow)"
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  emptyState: {
    textAlign: "center",
    color: "var(--text-secondary)",
    padding: "40px 20px"
  },
  taskCard: {
    background: "rgba(0,0,0,0.2)",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid var(--glass-border)",
    transition: "transform 0.2s"
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "10px"
  },
  taskStudentName: {
    fontSize: "18px",
    margin: "0 0 8px 0"
  },
  taskTypeBadge: {
    fontSize: "12px",
    background: "rgba(255,255,255,0.1)",
    padding: "4px 10px",
    borderRadius: "6px",
    color: "var(--text-secondary)"
  },
  statusBadge: {
    fontSize: "12px",
    padding: "6px 14px",
    borderRadius: "20px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    letterSpacing: "0.5px"
  },
  taskMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginBottom: "16px"
  },
  descriptionBox: {
    background: "rgba(255,255,255,0.03)",
    padding: "16px",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: 1.6,
    fontStyle: "italic",
    color: "var(--text-secondary)",
    marginBottom: "20px",
    borderLeft: "3px solid var(--accent-purple)"
  },
  rewardBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))",
    padding: "16px",
    borderRadius: "10px",
    color: "var(--accent-purple)",
    marginBottom: "20px",
    border: "1px solid rgba(168, 85, 247, 0.2)"
  },
  actions: {
    display: "flex",
    gap: "12px"
  },
  actionBtn: {
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px"
  }
};
