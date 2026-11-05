import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Clock,
  Truck,
  Sparkles,
  RefreshCw,
  Send,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Package,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface AiInsightsPageProps {
  onNavigateToPOWithItem?: (item: any) => void;
}

export const AiInsightsPage: React.FC<AiInsightsPageProps> = ({ onNavigateToPOWithItem }) => {
  const [activeTab, setActiveTab] = useState<'demand' | 'risk' | 'reorder' | 'slow' | 'supplier' | 'chat'>('demand');
  const [loading, setLoading] = useState(false);

  // Data states
  const [demandData, setDemandData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [reorderData, setReorderData] = useState<any[]>([]);
  const [slowMovingData, setSlowMovingData] = useState<any[]>([]);
  const [supplierAnalysis, setSupplierAnalysis] = useState<any>(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your SupplySense AI Inventory Advisor powered by Gemini 3.8 Flash. I have full context of your live products, stock levels, sales velocity, and supplier delivery records. Ask me anything about procurement priorities, demand trends, or safety buffer recommendations.',
      time: 'Just now',
    },
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'demand' && !demandData) {
        const res = await api.ai.getDemandForecast();
        if (res.success) setDemandData(res);
      } else if (tab === 'risk' && riskData.length === 0) {
        const res = await api.ai.getStockRisk();
        if (res.success) setRiskData(res.alerts);
      } else if (tab === 'reorder' && reorderData.length === 0) {
        const res = await api.ai.getReorderSuggestions();
        if (res.success) setReorderData(res.suggestions);
      } else if (tab === 'slow' && slowMovingData.length === 0) {
        const res = await api.ai.getSlowMoving();
        if (res.success) setSlowMovingData(res.slowMoving);
      } else if (tab === 'supplier' && !supplierAnalysis) {
        const res = await api.ai.getSupplierAnalysis();
        if (res.success) setSupplierAnalysis(res);
      }
    } catch (err: any) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isAsking) return;

    const query = userQuery.trim();
    setUserQuery('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: query, time: now }]);
    setIsAsking(true);

    try {
      const res = await api.ai.chat(query);
      const answer = res.success ? res.answer : 'Unable to retrieve insights from the AI advisor.';
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer, time: now }]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `Error: ${err.message || 'AI service temporarily unavailable.'}`, time: now },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const tabs = [
    { id: 'demand', label: 'Demand Forecasting', icon: TrendingUp },
    { id: 'risk', label: 'Stock-Out Risk', icon: AlertTriangle },
    { id: 'reorder', label: 'Reorder Suggestions', icon: ShoppingCart },
    { id: 'slow', label: 'Slow-Moving SKUs', icon: Clock },
    { id: 'supplier', label: 'Supplier Delays', icon: Truck },
    { id: 'chat', label: 'AI Advisor Chat', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">AI Supply Chain Intelligence</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mathematical forecasting algorithms combined with Gemini AI strategic analysis grounded in actual MongoDB sales & inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDemandData(null);
            setRiskData([]);
            setReorderData([]);
            setSlowMovingData([]);
            setSupplierAnalysis(null);
            fetchTabData(activeTab);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Insights</span>
        </button>
      </div>

      {/* Module Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Demand Forecasting */}
      {activeTab === 'demand' && (
        <div className="space-y-5">
          {/* AI Executive Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-blue-800/40">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                Gemini 3.8 Flash Strategic Demand Synthesis
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-100">
              {demandData?.aiNarrative || 'Calculating multi-week demand velocity and lead-time buffering...'}
            </p>
            <p className="mt-3 text-[11px] text-slate-400 italic">
              {demandData?.disclaimer}
            </p>
          </div>

          {/* Forecast Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">30-Day Velocity & Next 30-Day Projected Demand</h3>
              <span className="text-xs text-slate-400">Based on past 30 days orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Past 30d Sales</th>
                    <th className="py-3 px-4 text-center">Avg Daily Rate</th>
                    <th className="py-3 px-4 text-center">Est. Next 30d Demand</th>
                    <th className="py-3 px-4 text-center">Velocity Trend</th>
                    <th className="py-3 px-4">AI Recommended Restock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Analyzing 30-day sales records...
                      </td>
                    </tr>
                  ) : demandData?.forecasts?.map((f: any) => (
                    <tr key={f.productId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{f.productName}</p>
                        <span className="font-mono text-[10px] text-slate-400">{f.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-800">{f.currentStock} units</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{f.soldPast30Days} units</td>
                      <td className="py-3 px-4 text-center text-slate-600 font-mono">{f.avgDailySales} / day</td>
                      <td className="py-3 px-4 text-center font-extrabold text-indigo-700 bg-indigo-50/50">
                        ~{f.estimatedNext30DaysDemand} units
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.trend.includes('High') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {f.trend}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{f.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock-Out Risk Alerts */}
      {activeTab === 'risk' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Stock Coverage Analysis:</strong> Days remaining calculated as{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Current Stock ÷ Avg Daily Sales</code>.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-slate-400 text-xs">Computing stock-out horizons...</div>
            ) : riskData.map(alert => (
              <div
                key={alert.productId}
                className={`p-5 rounded-2xl bg-white border transition-all shadow-2xs flex flex-col justify-between ${
                  alert.riskLevel === 'Critical'
                    ? 'border-rose-300 hover:border-rose-400'
                    : alert.riskLevel === 'High'
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{alert.sku}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        alert.riskLevel === 'Critical'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : alert.riskLevel === 'High'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : alert.riskLevel === 'Moderate'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {alert.riskLevel} Risk
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-1">{alert.productName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{alert.warehouseName}</p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Current Units:</span>
                      <span className="font-extrabold text-slate-900">{alert.currentStock} units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Daily Sales Velocity:</span>
                      <span className="font-semibold text-slate-700">{alert.avgDailySales} / day</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold text-[11px]">Estimated Stock Coverage:</span>
                      <span className={`font-black text-sm ${alert.estimatedDaysRemaining <= 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {alert.estimatedDaysRemaining === 0 ? '0 days (Depleted)' : `~${alert.estimatedDaysRemaining} days`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-600 font-medium mb-3">{alert.urgencyAction}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToPOWithItem) {
                        onNavigateToPOWithItem({
                          productId: alert.productId,
                          quantity: Math.max(alert.minimumStock * 2, 20),
                          unitPrice: 50,
                        });
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Create Replenishment PO</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reorder Suggestions */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold">Algorithmic Reorder Formula:</span>
              <p className="mt-0.5 text-blue-700">
                <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">
                  Reorder Quantity = Maximum Desired Stock - Current Stock
                </code>{' '}
                where Maximum Desired Stock = Monthly Demand + Safety Buffer (2× Min Stock).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recommended Purchase Requisitions</h3>
              <span className="text-xs text-slate-400">1-click automated purchase order generation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Current / Min</th>
                    <th className="py-3 px-4 text-center">Max Desired</th>
                    <th className="py-3 px-4 text-center">Suggested Reorder</th>
                    <th className="py-3 px-4 text-right">Est. Order Cost</th>
                    <th className="py-3 px-4">Preferred Vendor</th>
                    <th className="py-3 px-4 text-center">Urgency</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Calculating optimal replenishment quantities...
                      </td>
                    </tr>
                  ) : reorderData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No products currently require reordering. Inventory buffers are optimal.
                      </td>
                    </tr>
                  ) : (
                    reorderData.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className={item.currentStock <= item.minimumStock ? 'text-amber-600' : 'text-slate-800'}>
                            {item.currentStock}
                          </span>
                          <span className="text-slate-400 font-normal"> / {item.minimumStock}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">{item.maxDesiredStock} units</td>
                        <td className="py-3 px-4 text-center font-extrabold text-blue-600 bg-blue-50/50">
                          +{item.suggestedReorderQuantity} units
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ${item.estimatedOrderCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.supplierName}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.priority === 'Critical'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : item.priority === 'High'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToPOWithItem) {
                                onNavigateToPOWithItem({
                                  productId: item.productId,
                                  supplierId: item.supplierId,
                                  warehouseId: item.warehouseId,
                                  quantity: item.suggestedReorderQuantity,
                                  unitPrice: item.unitPrice,
                                });
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <span>Create PO</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Slow-Moving Inventory */}
      {activeTab === 'slow' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs">
            <span className="font-bold">Working Capital Optimization:</span> Identifies items with minimal sales in the past 30 days that are tying up warehouse liquidity.
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Units Sold (30d)</th>
                    <th className="py-3 px-4 text-right">Tied-Up Working Capital</th>
                    <th className="py-3 px-4">Last Recorded Sale</th>
                    <th className="py-3 px-4">AI Recommended Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Scanning inventory turnover...</td>
                    </tr>
                  ) : slowMovingData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Excellent turnover! No stagnant SKUs detected in inventory.
                      </td>
                    </tr>
                  ) : (
                    slowMovingData.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{item.currentStock} units</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">{item.unitsSoldLast30Days} sold</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">${item.tiedUpCapital.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.lastSaleDate !== 'No recorded sales in 60+ days' ? new Date(item.lastSaleDate).toLocaleDateString() : item.lastSaleDate}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm">{item.suggestedAction}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Supplier Delay Analysis */}
      {activeTab === 'supplier' && (
        <div className="space-y-5">
          {/* Gemini Analysis Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                Gemini 3.8 Flash Vendor SLA & Delay Assessment
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-200">
              {supplierAnalysis?.aiInsights || 'Evaluating vendor delivery performance records...'}
            </p>
          </div>

          {/* Supplier Delay Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Vendor Company</th>
                    <th className="py-3 px-4">Primary Contact</th>
                    <th className="py-3 px-4 text-center">Orders Fulfilled</th>
                    <th className="py-3 px-4 text-center">On-Time Rate</th>
                    <th className="py-3 px-4 text-center">Avg Lead-Time Delay</th>
                    <th className="py-3 px-4 text-center">Currently Overdue</th>
                    <th className="py-3 px-4 text-center">SLA Reliability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">Loading supplier delivery records...</td>
                    </tr>
                  ) : supplierAnalysis?.suppliers?.map((s: any) => (
                    <tr key={s.supplierId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.companyName}</td>
                      <td className="py-3 px-4 text-slate-600">{s.contactPerson}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{s.deliveredOrders} orders</td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-600">{s.onTimeDeliveryRate}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {s.avgDelayDays > 0 ? `+${s.avgDelayDays} days` : '0 days (On Schedule)'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.currentlyOverdue > 0 ? (
                          <span className="font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                            {s.currentlyOverdue} Overdue
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.reliabilityScore === 'Excellent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.reliabilityScore === 'Good'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.reliabilityScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Interactive AI Inventory Consultant Chat */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">SupplySense Real-Time Operations Advisor</h4>
                <p className="text-[10px] text-slate-400">Grounded in your actual MongoDB stock, warehouses, and sales</p>
              </div>
            </div>

            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Synced
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-600 rounded-tl-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Gemini is analyzing your live stock and sales database...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Try asking:</span>
            <button
              type="button"
              onClick={() => setUserQuery('Which products are at risk of running out of stock this month?')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 whitespace-nowrap"
            >
              Which products are at risk of stock-out?
            </button>
            <button
              type="button"
              onClick={() => setUserQuery('What are the top 3 recommended purchase orders I should create today?')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 whitespace-nowrap"
            >
              Top 3 recommended purchase orders today?
            </button>
            <button
              type="button"
              onClick={() => setUserQuery('Summarize our warehouse distribution balance and slow moving goods.')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 whitespace-nowrap"
            >
              Warehouse distribution & slow moving goods?
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="Ask SupplySense AI about stock, warehouses, suppliers, or sales..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isAsking || !userQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
