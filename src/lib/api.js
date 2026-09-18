const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_BASE = rawApiBase.replace(/\/+$/, "");

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const endpoint = path.startsWith("/") ? path : `/${path}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to the backend server. Please make sure the backend is running and online."
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned status ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  googleLogin: (credential) => request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  me: () => request("/auth/me"),

  createBooking: (body) => request("/bookings", { method: "POST", body: JSON.stringify(body) }),
  getBookings: () => request("/bookings"),
  getBooking: (id) => request(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getProviderBookings: () => request("/bookings/provider"),

  getProviders: () => request("/providers"),
  getProvider: (id) => request(`/providers/${id}`),
  createProvider: (body) => request("/providers", { method: "POST", body: JSON.stringify(body) }),
  getMyProviderProfile: () => request("/providers/me"),
  updateMyProviderProfile: (body) => request("/providers/me", { method: "PATCH", body: JSON.stringify(body) }),
  getProviderEarnings: () => request("/providers/earnings"),
  submitVerification: (body) => request("/providers/verification", { method: "POST", body: JSON.stringify(body) }),
  getSavedProviders: () => request("/providers/saved"),
  toggleSavedProvider: (providerId) => request(`/providers/saved/${providerId}`, { method: "POST" }),

  createReview: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  getProviderReviews: (id) => request(`/reviews/provider/${id}`),

  getPlatformFee: () => request("/settings/platform-fee"),
  getDashboard: () => request("/dashboard"),

  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),

  getConversations: () => request("/messages/conversations"),
  getConversation: (userId) => request(`/messages/${userId}`),
  sendMessage: (body) => request("/messages", { method: "POST", body: JSON.stringify(body) }),

  getMyPayments: () => request("/payments"),
  fileReport: (body) => request("/reports", { method: "POST", body: JSON.stringify(body) }),

  adminGetUsers: () => request("/admin/users"),
  adminUpdateUser: (id, body) => request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminGetProviders: () => request("/admin/providers"),
  adminUpdateProvider: (id, body) => request(`/admin/providers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminGetBookings: () => request("/admin/bookings"),
  adminUpdateBookingStatus: (bookingId, status) =>
    request(`/admin/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminSetBookingStatus: (bookingId, status) =>
    request(`/admin/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminGetPayments: () => request("/admin/payments"),
  adminGetReviews: () => request("/admin/reviews"),
  adminDeleteReview: (id) => request(`/admin/reviews/${id}`, { method: "DELETE" }),
  adminGetServices: () => request("/admin/services"),
  adminCreateService: (body) => request("/admin/services", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateService: (id, body) => request(`/admin/services/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminDeleteService: (id) => request(`/admin/services/${id}`, { method: "DELETE" }),
  adminGetVerifications: () => request("/admin/verifications"),
  adminSetVerification: (id, status) =>
    request(`/admin/verifications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminGetReports: () => request("/admin/reports"),
  adminSetReport: (id, status) =>
    request(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminGetAnalytics: () => request("/admin/analytics"),
  adminGetActivity: () => request("/admin/activity"),
};
