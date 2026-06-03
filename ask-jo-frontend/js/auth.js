let currentMode = "login";

function switchAuthMode(mode) {
  currentMode = mode;
  const groupUsername = document.getElementById("group-username");
  const groupConfirmPassword = document.getElementById(
    "group-confirm-password",
  );
  const authTitle = document.getElementById("auth-title");
  const authSubtitle = document.getElementById("auth-subtitle");
  const submitBtn = document.getElementById("auth-submit-btn");

  document.getElementById("auth-error-msg").classList.add("hidden");
  document
    .getElementById("tab-login")
    .classList.toggle("active", mode === "login");
  document
    .getElementById("tab-register")
    .classList.toggle("active", mode === "register");

  if (mode === "register") {
    groupUsername.classList.remove("hidden");
    groupConfirmPassword.classList.remove("hidden");
    document.getElementById("auth-username").required = true;
    document.getElementById("auth-confirm-password").required = true;
    authTitle.textContent = "Create an account";
    authSubtitle.textContent =
      "Sign up to sync your chat history across multiple devices.";
    submitBtn.textContent = "Register Account";
  } else {
    groupUsername.classList.add("hidden");
    groupConfirmPassword.classList.add("hidden");
    document.getElementById("auth-username").required = false;
    document.getElementById("auth-confirm-password").required = false;
    authTitle.textContent = "Welcome back";
    authSubtitle.textContent =
      "Enter your details to access your mentorship dashboard.";
    submitBtn.textContent = "Log in to Ask Jo";
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const errorBanner = document.getElementById("auth-error-msg");
  errorBanner.classList.add("hidden");

  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  try {
    if (currentMode === "register") {
      const username = document.getElementById("auth-username").value.trim();
      const confirmPassword = document.getElementById(
        "auth-confirm-password",
      ).value;

      if (password !== confirmPassword)
        throw new Error("Passwords do not match.");

      await API.register(username, email, password, confirmPassword, "en");
      switchAuthMode("login");
      errorBanner.style.backgroundColor = "#EBF5FF";
      errorBanner.style.color = "#1E429F";
      errorBanner.textContent =
        "Account verified! Enter your credentials to log in.";
      errorBanner.classList.remove("hidden");
    } else {
      const data = await API.login(email, password);
      StorageManager.setTokens(data.access, data.refresh);
      if (data.user) StorageManager.setUser(data.user);

      const locals = StorageManager.getGuestHistory();
      if (locals.length > 0) {
        await API.migrateHistory(locals).catch((e) => console.error(e));
        StorageManager.clearGuestHistory();
      }
      window.location.replace("chat.html");
    }
  } catch (err) {
    errorBanner.style.backgroundColor = "#FDF2F2";
    errorBanner.style.color = "#9B1C1C";
    errorBanner.textContent =
      err.message || "An authentication error occurred.";
    errorBanner.classList.remove("hidden");
  }
}
