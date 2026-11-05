import React, { useState } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Database,
  Sparkles,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  ArrowRightLeft,
  Server,
  Layers,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, quickLoginAs } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.auth.updateProfile({ name, phone });
      if (res.success && res.user) {
        updateUser(res.user);
        setStatusMessage('Profile information updated successfully.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">System & Account Settings</h2>
        <p className="text-xs text-slate-500">
          Manage your personal profile, access roles, and review backend database & AI runtime status.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Role & Fast Switcher Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              user?.role === 'admin' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              {user?.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  user?.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {user?.role} Access Level
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.role === 'admin'
                  ? 'Full administrative control over products, warehouses, procurement approvals, and analytics.'
                  : 'Warehouse Staff permissions: stock movements, sales dispatch, and purchase order requests.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => quickLoginAs(user?.role === 'admin' ? 'staff' : 'admin')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Switch to {user?.role === 'admin' ? 'Staff' : 'Admin'} Role</span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">User Profile Information</h3>
        <p className="text-xs text-slate-400 mb-5">Update your display name and contact phone number.</p>

        <form onSubmit={handleProfileSave} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Database & Infrastructure Architecture Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Architecture & Data Engine Status</h3>
        <p className="text-xs text-slate-400 mb-5">
          Underlying stack parameters for SupplySense full-stack platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">MongoDB Persistence Engine</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Full CRUD support across Users, Products, Warehouses, Suppliers, Movements, POs, and Sales.
              </p>
              <span className="inline-block mt-2 font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                Status: Connected & Persistent
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Google Gemini AI Engine</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Model: <code className="font-mono text-blue-700">gemini-3.8-flash</code> via <code className="font-mono">@google/genai</code> SDK.
              </p>
              <span className="inline-block mt-2 font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                Telemetry: User-Agent: aistudio-build
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Server className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Node.js Express REST API</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                JWT custom authentication, bcrypt password hashing, and role-based middleware verification.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Layers className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">React & Vite Frontend</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Tailwind CSS styling, Recharts visualizations, and responsive viewport support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
