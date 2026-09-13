const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),

  createBooking: (body) => request("/bookings", { method: "POST", body: JSON.stringify(body) }),
  getBookings: () => request("/bookings"),
  getBooking: (id) => request(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getProviders: () => request("/providers"),
  getProvider: (id) => request(`/providers/${id}`),
  createProvider: (body) => request("/providers", { method: "POST", body: JSON.stringify(body) }),

  createReview: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  getProviderReviews: (id) => request(`/reviews/provider/${id}`),

  getPlatformFee: () => request("/settings/platform-fee"),
};
