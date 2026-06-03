const StorageManager = {
  setTokens: (access, refresh) => {
    localStorage.setItem("askjo_access_token", access);
    localStorage.setItem("askjo_refresh_token", refresh);
  },
  getAccessToken: () => localStorage.getItem("askjo_access_token"),
  getRefreshToken: () => localStorage.getItem("askjo_refresh_token"),
  clearAuth: () => {
    localStorage.removeItem("askjo_access_token");
    localStorage.removeItem("askjo_refresh_token");
    localStorage.removeItem("askjo_user");
  },
  setUser: (userObj) => {
    localStorage.setItem("askjo_user", JSON.stringify(userObj));
  },
  getUser: () => {
    const user = localStorage.getItem("askjo_user");
    return user ? JSON.parse(user) : null;
  },
};
