import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Users, TrendingUp, DollarSign, MapPin, BarChart3, ArrowLeft, RefreshCw,
  CheckCircle, Clock, Award, Globe
} from "lucide-react";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

type Tab = "overview" | "leads" | "location" | "referrers";

export default function Analytics() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [suburbs, setSuburbs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [referrers, setReferrers] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [trendDays, setTrendDays] = useState(30);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    try {
      const [ov, sub, st, svc, ref, tr, src, loc, rl] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getSuburbs(),
        api.getStates(),
        api.getServices(),
        api.getReferrers(),
        api.getTrend(trendDays),
        api.getSources(),
        api.getLocations(),
        api.getRecentLeads(30),
      ]);
      setOverview(ov);
      setSuburbs(sub.data || []);
      setStates(st.data || []);
      setServices(svc.data || []);
      setReferrers(ref.data || []);
      setTrend(tr.data || []);
      setSources(src.data || []);
      setLocations(loc.data || []);
      setRecentLeads(rl.data || []);
    } catch (err) { console.error(err); }
    finally { setDataLoading(false); }
  }, [trendDays]);

  useEffect(() => { if (isAuthenticated) loadAll(); }, [isAuthenticated, loadAll]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const funnel = overview?.funnel;
  const summary = overview?.summary;
  const total = funnel?.total || 0;

  const funnelData = [
    { name: "Total Leads", value: Number(total), color: "#3b82f6" },
    { name: "Contacted", value: Number(funnel?.contacted || 0), color: "#f59e0b" },
    { name: "Enrolled", value: Number(funnel?.enrolled || 0), color: "#10b981" },
    { name: "Paid", value: Number(funnel?.paid || 0), color: "#8b5cf6" },
  ];

  const convRate = total > 0 ? ((Number(funnel?.enrolled || 0) / total) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg">Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">Marketing performance & lead intelligence</p>
          </div>
        </div>
        <button onClick={loadAll} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Leads", value: summary?.totalLeads ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", sub: "All time" },
            { label: "Enrolled", value: summary?.enrolledCount ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", sub: `${convRate}% conversion` },
            { label: "Net Revenue", value: `$${(summary?.totalNet ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", sub: "Your profit" },
            { label: "Gift Cards Owed", value: summary?.enrolledCount ?? 0, icon: Award, color: "text-amber-600", bg: "bg-amber-50", sub: `$${((summary?.enrolledCount ?? 0) * 200).toLocaleString()} total` },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm mb-6 overflow-x-auto">
          {(["overview", "leads", "location", "referrers"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 min-w-max px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "leads" ? "Live Leads" : t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Conversion Funnel</h3>
                <div className="space-y-3">
                  {funnelData.map(step => (
                    <div key={step.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{step.name}</span>
                        <span className="text-sm font-bold text-slate-900">{step.value}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${total > 0 ? (step.value / total) * 100 : 0}%`, background: step.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Sources */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Referral Sources</h3>
                {sources.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}>
                        {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Daily Trend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Daily Lead Trend</h3>
                <select value={trendDays} onChange={e => setTrendDays(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
              {trend.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Leads" />
                    <Line type="monotone" dataKey="enrolled" stroke="#10b981" strokeWidth={2} dot={false} name="Enrolled" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Service Demand */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Service Demand by Disability Type</h3>
              {services.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={services} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="disability_type" type="category" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ── LIVE LEADS TAB ───────────────────────────────────────────────── */}
        {tab === "leads" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Live Lead Feed</h3>
              <span className="text-xs text-slate-400">{recentLeads.length} recent leads</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Name", "Suburb", "IP Location", "Disability", "Referrer", "Source", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No leads yet.</td></tr>
                  ) : recentLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{lead.participantName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.suburb ? `${lead.suburb}, ${lead.state || ""}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {lead.ipCity ? <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400" />{lead.ipCity}, {lead.ipState}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.disabilityType || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.referrerName || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{lead.referralSource || "Direct"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${lead.status === "enrolled" || lead.status === "paid" ? "bg-green-100 text-green-700" : lead.status === "contacted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(Number(lead.createdAt)).toLocaleDateString("en-AU")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LOCATION TAB ─────────────────────────────────────────────────── */}
        {tab === "location" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Top Suburbs</h3>
                {suburbs.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={suburbs} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="suburb" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">State Distribution</h3>
                {states.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
                ) : (
                  <div className="space-y-3">
                    {states.map((s, i) => {
                      const total = states.reduce((a, b) => a + Number(b.count), 0);
                      const pct = total > 0 ? ((Number(s.count) / total) * 100).toFixed(1) : "0";
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{s.state}</span>
                            <span className="text-sm text-slate-500">{s.count} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">IP-Detected Visitor Locations</h3>
              {locations.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-slate-400 text-sm">No IP location data yet. Locations are captured automatically when leads are submitted.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {locations.map((loc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{loc.city}</div>
                        <div className="text-xs text-slate-400">{loc.state} · {loc.count} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REFERRERS TAB ────────────────────────────────────────────────── */}
        {tab === "referrers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-slate-900">Referrer Leaderboard</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["#", "Referrer", "Total Leads", "Enrolled", "Conv %", "Gift Cards", "Your Net"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400">No referrer data yet.</td></tr>
                    ) : referrers.map((ref, i) => {
                      const conv = Number(ref.totalLeads ?? ref.total_leads) > 0 ? ((Number(ref.enrolled) / Number(ref.totalLeads ?? ref.total_leads)) * 100).toFixed(0) : "0";
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{ref.referrerName || ref.referrer_name}</div>
                            {(ref.referrerEmail || ref.referrer_email) && <div className="text-xs text-slate-400">{ref.referrerEmail || ref.referrer_email}</div>}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{ref.totalLeads ?? ref.total_leads}</td>
                          <td className="px-4 py-3 font-bold text-green-600">{ref.enrolled}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${Number(conv) >= 50 ? "bg-green-100 text-green-700" : Number(conv) >= 25 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                              {conv}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-amber-600 font-semibold">{ref.giftCardsSent ?? ref.gift_cards_sent ?? 0} sent</td>
                          <td className="px-4 py-3 font-bold text-purple-600">${Number(ref.totalEarned ?? ref.total_earned ?? 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
