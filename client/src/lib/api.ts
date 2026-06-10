const BASE = "/api";

function getToken() {
  return localStorage.getItem("auth_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: any }>("/auth/me"),

  // Leads
  submitLead: (data: any) =>
    request<{ success: boolean; lead: any }>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLeads: (status?: string) =>
    request<{ leads: any[] }>(`/leads${status ? `?status=${status}` : ""}`),
  getLead: (id: number) => request<{ lead: any }>(`/leads/${id}`),
  updateStatus: (id: number, status: string, notes?: string) =>
    request<{ lead: any }>(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
  updateCarePlan: (id: number, carePlan: string) =>
    request<{ lead: any }>(`/leads/${id}/care-plan`, {
      method: "PATCH",
      body: JSON.stringify({ carePlan }),
    }),
  updateGiftCard: (id: number, sent: boolean) =>
    request<{ lead: any }>(`/leads/${id}/gift-card`, {
      method: "PATCH",
      body: JSON.stringify({ sent }),
    }),
  getCommissionSummary: () =>
    request<{ summary: any }>("/leads/summary/commission"),

  // Analytics
  getAnalyticsOverview: () => request<any>("/analytics/overview"),
  getSuburbs: () => request<any>("/analytics/suburbs"),
  getStates: () => request<any>("/analytics/states"),
  getServices: () => request<any>("/analytics/services"),
  getReferrers: () => request<any>("/analytics/referrers"),
  getTrend: (days = 30) => request<any>(`/analytics/trend?days=${days}`),
  getSources: () => request<any>("/analytics/sources"),
  getLocations: () => request<any>("/analytics/locations"),
  getRecentLeads: (limit = 20) => request<any>(`/analytics/recent-leads?limit=${limit}`),

  // AI
  generateOutreach: (leadId: number, type: "email" | "sms") =>
    request<{ message: string }>("/ai/outreach", {
      method: "POST",
      body: JSON.stringify({ leadId, type }),
    }),

  // Chat
  sendChatMessage: (sessionId: string, message: string) =>
    request<{ reply: string }>("/chat/message", {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    }),
  getChatSessions: () => request<{ sessions: any[] }>("/chat/sessions"),
  getChatMessages: (sessionId: string) =>
    request<{ messages: any[] }>(`/chat/sessions/${sessionId}/messages`),
  staffReply: (sessionId: string, content: string) =>
    request<{ success: boolean }>(`/chat/sessions/${sessionId}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  updateSessionStatus: (sessionId: string, status: string) =>
    request<{ success: boolean }>(`/chat/sessions/${sessionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getSettings: () => request<{ settings: Record<string, string> }>("/settings"),
  updateSettings: (settings: Record<string, string>) =>
    request<{ success: boolean }>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};
