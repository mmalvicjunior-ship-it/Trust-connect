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

  getProviders: () => request("/providers"),
  getProvider: (id) => request(`/providers/${id}`),
  createProvider: (body) => request("/providers", { method: "POST", body: JSON.stringify(body) }),

  createReview: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  getProviderReviews: (id) => request(`/reviews/provider/${id}`),

  getPlatformFee: () => request("/settings/platform-fee"),
};
