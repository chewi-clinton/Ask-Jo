const StorageManager = {
  setTokens(access, refresh) {
    localStorage.setItem("askjo_access_token", access);
    localStorage.removeItem("askjo_refresh_token");
    localStorage.setItem("askjo_refresh_token", refresh);
  },
  getAccessToken() {
    return localStorage.getItem("askjo_access_token");
  },
  clearTokens() {
    localStorage.removeItem("askjo_access_token");
    localStorage.removeItem("askjo_refresh_token");
    localStorage.removeItem("askjo_user_profile");
  },
  setUser(userObj) {
    localStorage.setItem("askjo_user_profile", JSON.stringify(userObj));
  },
  getUser() {
    const user = localStorage.getItem("askjo_user_profile");
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated() {
    return !!this.getAccessToken();
  },

  getGuestHistory() {
    const history = localStorage.getItem("askjo_guest_history");
    return history ? JSON.parse(history) : [];
  },
  saveGuestMessage(role, content) {
    const history = this.getGuestHistory();
    history.push({ role, content, timestamp: new Date().toISOString() });
    localStorage.setItem("askjo_guest_history", JSON.stringify(history));
  },
  clearGuestHistory() {
    localStorage.removeItem("askjo_guest_history");
  },
};
