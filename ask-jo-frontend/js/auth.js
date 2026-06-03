let currentAuthMode = "login";

function switchAuthMode(mode) {
  currentAuthMode = mode;
  const titleEl = document.getElementById("auth-title");
  const subtitleEl = document.getElementById("auth-subtitle");
  const submitBtn = document.getElementById("auth-submit-btn");
  const userGroup = document.getElementById("group-username");
  const confirmGroup = document.getElementById("group-confirm-password");
  const errorBanner = document.getElementById("auth-error-msg");

  errorBanner.classList.add("hidden");

  document
    .getElementById("tab-login")
    .classList.toggle("active", mode === "login");
  document
    .getElementById("tab-register")
    .classList.toggle("active", mode === "register");

  if (mode === "login") {
    titleEl.textContent = "Welcome back";
    subtitleEl.textContent =
      "Enter your details to access your mentorship dashboard.";
    submitBtn.textContent = "Log in to Ask Jo";
    userGroup.classList.add("hidden");
    confirmGroup.classList.add("hidden");
  } else {
    titleEl.textContent = "Create an account";
    subtitleEl.textContent = "Join Ask Jo to start secure matching pathways.";
    submitBtn.textContent = "Register Account";
    userGroup.classList.remove("hidden");
    confirmGroup.classList.remove("hidden");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const errorBanner = document.getElementById("auth-error-msg");
  errorBanner.classList.add("hidden");

  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  try {
    if (currentAuthMode === "login") {
      const data = await API.login(email, password);
      StorageManager.setTokens(data.tokens.access, data.tokens.refresh);
      StorageManager.setUser(data.user);
      window.location.replace("chat.html");
    } else {
      const username = document.getElementById("auth-username").value;
      const confirmPass = document.getElementById(
        "auth-confirm-password",
      ).value;

      if (password !== confirmPass) {
        throw new Error("Passwords do not match.");
      }

      const data = await API.register(username, email, password, confirmPass);
      StorageManager.setTokens(data.tokens.access, data.tokens.refresh);
      StorageManager.setUser(data.user);
      window.location.replace("chat.html");
    }
  } catch (err) {
    errorBanner.textContent =
      err.message || "An authentication error occurred.";
    errorBanner.classList.remove("hidden");
  }
}
