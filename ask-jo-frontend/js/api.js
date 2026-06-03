const API_BASE_URL = "https://api.amino-vault.com/api";

async function request(endpoint, options = {}) {
  const token = StorageManager.getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMsg = `Server returned status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || JSON.stringify(errorData);
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

const API = {
  login: (email, password) =>
    request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // FIX: argument order is (email, username, ...) — matches what auth.js passes
  register: (email, username, password, confirmPassword) =>
    request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        email,
        username,
        password,
        confirm_password: confirmPassword,
        preferred_language: "en",
      }),
    }),

  getConversations: () => request("/conversations/", { method: "GET" }),

  createConversation: (title = "New Conversation") =>
    request("/conversations/", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getConversationDetails: (id) =>
    request(`/conversations/${id}/`, { method: "GET" }),

  sendMessage: (conversationId, content, location = "Yaoundé") =>
    request(`/conversations/${conversationId}/send/`, {
      method: "POST",
      body: JSON.stringify({ content, location }),
    }),

  sendGuestMessage: (content, location = "Yaoundé") =>
    request("/conversations/guest-send/", {
      method: "POST",
      body: JSON.stringify({ content, location }),
    }),

  // FIX: was migrateHistory (didn't exist), correct name used in auth.js call
  migrateGuestHistory: (guestHistory) =>
    request("/conversations/migrate/", {
      method: "POST",
      body: JSON.stringify({ messages: guestHistory }),
    }),
};
