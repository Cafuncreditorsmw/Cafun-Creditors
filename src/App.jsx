
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  LayoutDashboard, Users, Wallet, FileText,
  CreditCard, ShieldCheck, LogOut, Menu,
  TrendingUp, BriefcaseBusiness
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import './styles.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    clients: 0,
    loans: 0,
    applications: 0,
    repayments: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          setProfile(null);
          setLoading(false);
        } else {
          loadProfile(newSession.user.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    if (error) setError('Could not load your profile.');
    else {
      setProfile(data);
      if (data.role === 'admin') loadStats();
    }
    setLoading(false);
  }

  async function loadStats() {
    const tables = ['clients', 'loans', 'loan_applications', 'repayments'];
    const results = await Promise.all(
      tables.map(table => supabase
        .from(table)
        .select('*', { count: 'exact', head: true }))
    );

    setStats({
      clients: results[0].count || 0,
      loans: results[1].count || 0,
      applications: results[2].count || 0,
      repayments: results[3].count || 0
    });
  }

  async function signIn(event) {
    event.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPage('Dashboard');
  }

  if (loading) {
    return (
      <>
        <main className="loading">Loading Cafun Creditors...</main>
        <Analytics />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <main className="login-page">
          <form className="login-card" onSubmit={signIn}>
            <div className="brand-icon"><ShieldCheck size={34} /></div>
            <h1>CAFUN CREDITORS</h1>
            <p>Loan Management System</p>
            <h2>Welcome back</h2>
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit">Sign in</button>
            <small>Secure access to your credit management system.</small>
          </form>
        </main>
        <Analytics />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <main className="loading">
          Your account profile could not be loaded. Please contact the administrator.
          {error && <p className="error">{error}</p>}
          <button onClick={signOut}>Sign out</button>
        </main>
        <Analytics />
      </>
    );
  }

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Clients', icon: Users },
    { name: 'Loan Applications', icon: FileText },
    { name: 'Loans', icon: Wallet },
    { name: 'Repayments', icon: CreditCard },
    { name: 'Collateral', icon: BriefcaseBusiness },
    { name: 'Expenses', icon: TrendingUp }
  ];

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <ShieldCheck size={30} />
            <div><strong>CAFUN</strong><small>CREDITORS</small></div>
          </div>
          <p className="nav-label">MAIN MENU</p>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={page === item.name ? 'nav-item active' : 'nav-item'}
                onClick={() => setPage(item.name)}
              >
                <Icon size={19} /> {item.name}
              </button>
            );
          })}
          <button className="nav-item logout" onClick={signOut}>
            <LogOut size={19} /> Sign out
          </button>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div>
              <span>CAFUN CREDITORS / </span>{page.toUpperCase()}
            </div>
            <div className="user-info">
              <span>{profile.full_name || session.user.email}</span>
              <small>{profile.role}</small>
            </div>
          </header>

          <section className="content">
            <h1>{page}</h1>
            <p className="welcome">
              Welcome, {profile.full_name || 'User'}. Manage your account here.
            </p>

            {profile.role === 'admin' && page === 'Dashboard' && (
              <>
                <div className="stat-grid">
                  <Stat title="Total Clients" value={stats.clients} />
                  <Stat title="Loan Accounts" value={stats.loans} />
                  <Stat title="Applications" value={stats.applications} />
                  <Stat title="Repayment Records" value={stats.repayments} />
                </div>
                <div className="panel">
                  <h2>Business overview</h2>
                  <p>Currency: MWK</p>
                  <p>Default monthly interest: 50%</p>
                  <p>Interest method: Simple interest on original principal</p>
                  <button onClick={loadStats}>Refresh figures</button>
                </div>
              </>
            )}

            {profile.role === 'client' && (
              <div className="panel">
                <h2>Client portal</h2>
                <p>Your account is active. Your loan information will appear here.</p>
              </div>
            )}

            {page !== 'Dashboard' && (
              <div className="panel">
                <h2>{page}</h2>
                <p>This section is being prepared for the Cafun Creditors management system.</p>
              </div>
            )}
          </section>
        </main>
      </div>
      <Analytics />
    </>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
