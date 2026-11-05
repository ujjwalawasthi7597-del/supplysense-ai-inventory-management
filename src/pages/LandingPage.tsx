import React, { useState } from 'react';
import {
  Boxes,
  BrainCircuit,
  TrendingUp,
  Warehouse,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Layers,
  Clock,
  Lock,
  Mail,
  User,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Modal } from '../components/common/Modal.tsx';

export const LandingPage: React.FC = () => {
  const { login, register, quickLoginAs } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ name, email, password, role, phone });
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">SupplySense</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Enterprise Inventory & Logistics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEmail('admin@supplysense.com');
              setPassword('admin123');
              setAuthModal('login');
            }}
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => quickLoginAs('admin')}
            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span>Live Demo (Admin)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Next-Gen Inventory Control with Google Gemini 3.8 Flash</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Take Control of Your Inventory with{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            AI-Powered Insights
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Manage warehouses, multi-vendor purchase orders, automated stock movements, and real-time sales analytics from a single intelligent control center.
        </p>

        {/* Quick Demo Login Cards */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => quickLoginAs('admin')}
            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Launch as Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => quickLoginAs('staff')}
            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/15 transition-all flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            <span>Launch as Warehouse Staff</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModal('register');
            }}
            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-sm transition-all"
          >
            Create New Account
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500 font-medium">
          Instant access with preloaded demo products, sales records, and warehouse inventory.
        </p>

        {/* Hero Preview Card */}
        <div className="mt-14 relative rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-left max-w-5xl mx-auto overflow-hidden">
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Live Enterprise Snapshot</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">SupplySense Executive Overview</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Database Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Total Active SKUs</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">12 Products</p>
              <span className="text-[11px] text-blue-600 font-semibold">Across 4 Warehouses</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Inventory Valuation</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">$48,930.00</p>
              <span className="text-[11px] text-emerald-600 font-semibold">+18.4% monthly ROI</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Stock Out Alerts</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">1 Critical</p>
              <span className="text-[11px] text-rose-500 font-semibold">Auto-reorder generated</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Gemini Demand Accuracy</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">94.8%</p>
              <span className="text-[11px] text-indigo-500 font-semibold">Past 30-day velocity</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 bg-white border-y border-slate-200 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Built for Modern SMEs & Supply Chain Teams
            </h2>
            <p className="mt-3 text-slate-600">
              Everything required to coordinate purchasing, storage, dispatch, and demand planning without complex ERP bloat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Warehouse Inventory</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Track stock across multiple hubs with real-time stock-in, stock-out, and audited adjustment movement logs. Negative stock prevention built-in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Demand & Stock-Out Forecasting</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Calculates average 30-day daily velocity, runs mathematical safety stock formulas, and leverages Gemini 3.8 Flash for procurement recommendations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Automated Procurement Workflow</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Staff creates PO requests, Admins approve or reject. When marked Received, stock automatically increments and movements are logged without duplicates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Sales & Dispatch</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Record customer orders with real-time stock validation. Over-selling is impossible; inventory automatically decrements upon sale confirmation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Supplier Delay Analytics</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Compare expected vs actual delivery dates to calculate supplier delay days, on-time delivery rates, and vendor SLA reliability scores.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Custom Role Authorization</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Secure JWT & bcrypt authentication. Distinct Admin and Staff permissions protect sensitive margins, stock adjustments, and supplier contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase font-extrabold text-blue-600 tracking-wider">Streamlined Operations</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">How SupplySense Powers Your Business</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Ingest & Organize</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define your warehouses, suppliers, and catalog items with unique SKUs and minimum safety levels.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Track & Fulfill</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record sales and dispatch movements with instant stock deductions and zero-risk availability validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-slate-900 mb-2">AI Analyzes Velocity</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mathematical algorithms + Gemini compute stock-out risk horizons, slow-moving lines, and optimal reorders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-4">
              4
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Automate Procurement</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate 1-click purchase orders from reorder suggestions, receive goods, and restock seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white py-16 px-6 sm:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Optimize Your Supply Chain?
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-base">
            Experience the full working system with pre-configured realistic data, AI demand forecasting, and complete inventory management.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => quickLoginAs('admin')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
            >
              Enter Admin Portal
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('staff')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
            >
              Enter Staff Portal
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-6 sm:px-12 text-center text-xs border-t border-slate-800">
        <p>© 2026 SupplySense Platform. AI-Powered Inventory & Supply Chain Management.</p>
      </footer>

      {/* Auth Modal */}
      <Modal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        title={authModal === 'login' ? 'Sign In to SupplySense' : 'Register New Account'}
        subtitle={
          authModal === 'login'
            ? 'Enter your credentials or choose a quick demo account below.'
            : 'Create your credentials to manage inventory and purchase orders.'
        }
        maxWidth="md"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {authModal === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@supplysense.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Quick Demo Logins */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('admin')}
                  className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Admin (admin123)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('staff')}
                  className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Staff (staff123)
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthModal('register')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Need an account? Register here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jordan Vance"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Permission</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'staff'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Staff Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'admin'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 mt-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthModal('login')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
