import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  Users, MessageSquare, BarChart3, LogOut, Heart, CheckCircle,
  Clock, DollarSign, X, ChevronDown, Copy, Send, RefreshCw,
  Phone, Mail, MapPin, User, Gift, FileText, AlertCircle, ExternalLink, Facebook, Settings, Sparkles
} from "lucide-react";

type Tab = "clients" | "conversations";
type LeadStatus = "pending" | "contacted" | "enrolled" | "paid";

const STATUS_COLORS: Record<LeadStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  enrolled: "bg-green-100 text-green-800",
  paid: "bg-purple-100 text-purple-800",
};

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("clients");
  const [leads, setLeads] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [outreachMsg, setOutreachMsg] = useState("");
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const loadLeads = useCallback(async () => {
    try {
      const [leadsData, summaryData] = await Promise.all([
        api.getLeads(statusFilter || undefined),
        api.getCommissionSummary(),
      ]);
      setLeads(leadsData.leads);
      setSummary(summaryData.summary);
    } catch (err) { console.error(err); }
  }, [statusFilter]);

  const loadChatSessions = useCallback(async () => {
    try {
      const data = await api.getChatSessions();
      setChatSessions(data.sessions);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
      loadChatSessions();
      api.getSettings().then(res => {
        if (res.settings?.facebook_url) setFacebookUrl(res.settings.facebook_url);
      }).catch(() => {});
    }
  }, [isAuthenticated, loadLeads, loadChatSessions]);

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await api.getChatMessages(sessionId);
      setMessages(data.messages);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.updateStatus(id, status);
      await loadLeads();
      if (selectedLead?.id === id) setSelectedLead((p: any) => ({ ...p, status }));
    } catch (err) { console.error(err); }
  };

  const handleGiftCard = async (id: number, sent: boolean) => {
    try {
      await api.updateGiftCard(id, sent);
      await loadLeads();
      if (selectedLead?.id === id) setSelectedLead((p: any) => ({ ...p, giftCardSent: sent }));
    } catch (err) { console.error(err); }
  };

  const generateOutreach = async (type: "email" | "sms") => {
    if (!selectedLead) return;
    setOutreachLoading(true);
    try {
      const data = await api.generateOutreach(selectedLead.id, type);
      setOutreachMsg(data.message);
    } catch (err) { console.error(err); }
    finally { setOutreachLoading(false); }
  };

  const sendStaffReply = async () => {
    if (!selectedSession || !replyText.trim()) return;
    try {
      await api.staffReply(selectedSession.session_id, replyText);
      setReplyText("");
      await loadMessages(selectedSession.session_id);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pendingCount = Math.max(0, (summary?.totalLeads ?? 0) - (summary?.enrolledCount ?? 0) - (summary?.paidCount ?? 0));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 md:hidden bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Accurate Home Care</span>
        </div>
        <button onClick={() => setMobileMenuOpen(o => !o)} className="text-white p-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <div className="flex flex-col gap-1"><span className="block w-5 h-0.5 bg-white" /><span className="block w-5 h-0.5 bg-white" /><span className="block w-5 h-0.5 bg-white" /></div>}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col transition-transform duration-300 bg-slate-900 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Accurate Home Care</div>
              <div className="text-xs text-slate-400">NDIS Admin Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {([
            { id: "clients" as Tab, label: "Clients", icon: Users, badge: summary?.totalLeads },
            { id: "conversations" as Tab, label: "Conversations", icon: MessageSquare, badge: chatSessions.filter(s => s.status === "escalated").length || undefined },
          ]).map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-500 text-white">{item.badge}</span>
              )}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-700">
            <button onClick={() => { navigate("/analytics"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-amber-400 hover:bg-slate-800">
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Analytics</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">New</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <a href="https://ndis-referral-system.onrender.com" target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-emerald-400 hover:bg-slate-800 cursor-pointer">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">View Website</span>
            </a>
            {/* Facebook group */}
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              {facebookUrl ? (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-blue-400 hover:bg-slate-800 cursor-pointer border-b border-slate-700">
                  <Facebook className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Facebook Page</span>
                </a>
              ) : (
                <button onClick={() => navigate("/settings")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-blue-400 hover:bg-slate-800 opacity-60 border-b border-slate-700">
                  <Facebook className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Add Facebook Page</span>
                </button>
              )}
              <button onClick={() => navigate("/content")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all text-amber-400 hover:bg-slate-800 hover:text-amber-300">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Create Reel Content</span>
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">AI</span>
              </button>
            </div>
            <button onClick={() => navigate("/settings")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:bg-slate-800 hover:text-white">
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {/* ── CLIENTS ─────────────────────────────────────────────────────── */}
        {tab === "clients" && (
          <div className="p-4 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">Client Tracker</h1>
              <p className="text-sm text-slate-500 mt-1">Track every lead, referral, and commission in one place.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Leads", value: summary?.totalLeads ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Enrolled", value: summary?.enrolledCount ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                { label: "Net Earned", value: `$${(summary?.totalNet ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
                    <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{card.value}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="enrolled">Enrolled</option>
                <option value="paid">Paid</option>
              </select>
              <button onClick={loadLeads} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Participant</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Referrer</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Location</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No leads yet. Share your referral link to get started.</td></tr>
                    ) : leads.map(lead => (
                      <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{lead.participantName}</div>
                          <div className="text-xs text-slate-400">{lead.participantPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700">{lead.referrerName || "—"}</div>
                          <div className="text-xs text-slate-400">{lead.referrerRelation || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{lead.suburb ? `${lead.suburb}, ${lead.state || ""}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status as LeadStatus] || "bg-gray-100 text-gray-700"}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(Number(lead.createdAt)).toLocaleDateString("en-AU")}</td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status}
                            onChange={e => { e.stopPropagation(); handleStatusChange(lead.id, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="enrolled">Enrolled</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CONVERSATIONS ────────────────────────────────────────────────── */}
        {tab === "conversations" && (
          <div className="p-4 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">Live Conversations</h1>
              <p className="text-sm text-slate-500 mt-1">Respond to website chat sessions in real time.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Sessions</span>
                  <button onClick={loadChatSessions} className="text-slate-400 hover:text-slate-600">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {chatSessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">No chat sessions yet.</div>
                  ) : chatSessions.map(session => (
                    <button key={session.id} onClick={() => { setSelectedSession(session); loadMessages(session.session_id); }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedSession?.id === session.id ? "bg-amber-50 border-l-2 border-amber-500" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 text-sm">{session.visitor_name || `Visitor #${session.id}`}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${session.status === "escalated" ? "bg-red-100 text-red-700" : session.status === "resolved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(Number(session.updatedAt || session.updated_at)).toLocaleString("en-AU")}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                {!selectedSession ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8 text-center">
                    Select a conversation to view messages and reply.
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{selectedSession.visitor_name || `Visitor #${selectedSession.id}`}</div>
                        <div className="text-xs text-slate-400">{selectedSession.session_id}</div>
                      </div>
                      <div className="flex gap-2">
                        {["active", "resolved"].map(s => (
                          <button key={s} onClick={() => { api.updateSessionStatus(selectedSession.session_id, s); setSelectedSession((p: any) => ({ ...p, status: s })); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium capitalize">
                            Mark {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-96">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-gray-100 text-slate-800" : msg.role === "staff" ? "bg-amber-500 text-white" : "bg-blue-100 text-blue-900"}`}>
                            {msg.role !== "user" && <div className="text-xs opacity-70 mb-1">{msg.role === "staff" ? "Staff" : "AI"}</div>}
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 flex gap-2">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendStaffReply()}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Type a reply..." />
                      <button onClick={sendStaffReply} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Lead Detail Drawer ────────────────────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedLead(null)} />
          <div className="w-full max-w-lg bg-white overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-900">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[selectedLead.status as LeadStatus]}`}>{selectedLead.status}</span>
                <select value={selectedLead.status} onChange={e => handleStatusChange(selectedLead.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Participant */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Participant</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700"><User className="w-4 h-4 text-slate-400" /> {selectedLead.participantName}</div>
                  <div className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" /> {selectedLead.participantPhone}</div>
                  {selectedLead.participantEmail && <div className="flex items-center gap-2 text-slate-700"><Mail className="w-4 h-4 text-slate-400" /> {selectedLead.participantEmail}</div>}
                  {selectedLead.suburb && <div className="flex items-center gap-2 text-slate-700"><MapPin className="w-4 h-4 text-slate-400" /> {selectedLead.suburb}, {selectedLead.state}</div>}
                  {selectedLead.disabilityType && <div className="flex items-center gap-2 text-slate-700"><AlertCircle className="w-4 h-4 text-slate-400" /> {selectedLead.disabilityType}</div>}
                  {selectedLead.age && <div className="text-slate-600">Age: {selectedLead.age} · NDIS: {selectedLead.ndisStatus || "—"} · Citizenship: {selectedLead.citizenship || "—"}</div>}
                </div>
              </div>

              {/* Referrer */}
              {selectedLead.referrerName && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Referrer</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700"><User className="w-4 h-4 text-slate-400" /> {selectedLead.referrerName} ({selectedLead.referrerRelation || "—"})</div>
                    <div className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" /> {selectedLead.referrerPhone}</div>
                    {selectedLead.referrerEmail && <div className="flex items-center gap-2 text-slate-700"><Mail className="w-4 h-4 text-slate-400" /> {selectedLead.referrerEmail}</div>}
                  </div>
                </div>
              )}

              {/* Commission */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Commission</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-lg font-black text-slate-900">${selectedLead.grossCommission || 1000}</div>
                    <div className="text-xs text-slate-500">Gross</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="text-lg font-black text-amber-600">${selectedLead.referrerPayout || 200}</div>
                    <div className="text-xs text-slate-500">Gift Card</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-lg font-black text-green-600">${selectedLead.netCommission || 800}</div>
                    <div className="text-xs text-slate-500">Your Net</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" id="giftcard" checked={!!selectedLead.giftCardSent}
                    onChange={e => handleGiftCard(selectedLead.id, e.target.checked)}
                    className="w-4 h-4 accent-amber-500" />
                  <label htmlFor="giftcard" className="text-sm text-slate-700 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-500" /> $200 gift card sent to referrer
                  </label>
                </div>
              </div>

              {/* Outreach */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Outreach Message Generator</h3>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => generateOutreach("email")} disabled={outreachLoading}
                    className="flex-1 text-sm bg-slate-900 hover:bg-slate-700 text-white py-2 rounded-xl transition-colors disabled:opacity-60">
                    {outreachLoading ? "Generating..." : "Generate Email"}
                  </button>
                  <button onClick={() => generateOutreach("sms")} disabled={outreachLoading}
                    className="flex-1 text-sm bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl transition-colors disabled:opacity-60">
                    Generate SMS
                  </button>
                </div>
                {outreachMsg && (
                  <div className="bg-gray-50 rounded-xl p-4 relative">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{outreachMsg}</pre>
                    <button onClick={() => navigator.clipboard.writeText(outreachMsg)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
