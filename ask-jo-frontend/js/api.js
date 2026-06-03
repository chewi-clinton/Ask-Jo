class ApiService {
  constructor() {
    this.baseUrl = "https://api.amino-vault.com/api";
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = StorageManager.getAccessToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token && !options.skipAuth) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = { ...options, headers };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.detail || "API Endpoint Request Failed",
        );
      }
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  login(email, password) {
    return this.request("/auth/login/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  }

  register(username, email, password, confirmPassword, lang = "en") {
    return this.request("/auth/register/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        username,
        email,
        password,
        confirm_password: confirmPassword,
        preferred_language: lang,
      }),
    });
  }

  getConversations() {
    return this.request("/conversations/");
  }

  createConversation(title = "New Conversation") {
    return this.request("/conversations/", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  sendMessage(conversationId, content, location = "Yaoundé") {
    return this.request(`/conversations/${conversationId}/send/`, {
      method: "POST",
      body: JSON.stringify({ content, location }),
    });
  }
}

const API = new ApiService();
