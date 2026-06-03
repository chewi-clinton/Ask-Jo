let currentActiveConversationId = null;

window.addEventListener("DOMContentLoaded", async () => {
  if (!StorageManager.isAuthenticated()) {
    try {
      const guestSession = await API.registerGuest();
      StorageManager.saveSession(
        guestSession.access,
        guestSession.refresh,
        guestSession.user,
      );
    } catch (err) {
      console.error(err);
    }
  }

  evaluateHeaderAuthState();
  await renderSidebarContext();
  initializeConversationScreen();
});

function evaluateHeaderAuthState() {
  const container = document.getElementById("header-user-actions");
  const user = StorageManager.getUser();
  const isTrueUser =
    StorageManager.isAuthenticated() &&
    user &&
    !user.username.startsWith("guest_");

  if (isTrueUser) {
    container.innerHTML = `
            <span class="btn-text" style="padding-right:10px;">Hi, ${user.username}</span>
            <button class="btn-secondary" onclick="executeLogoutSequence()">Logout</button>
        `;
  } else {
    container.innerHTML = `
            <a href="auth.html?mode=login" class="btn-text" style="padding-right:15px;">Login</a>
            <a href="auth.html?mode=register" class="btn-primary">Create Account</a>
        `;
  }
}

function executeLogoutSequence() {
  StorageManager.clearTokens();
  window.location.replace("index.html");
}

async function renderSidebarContext() {
  const track = document.getElementById("conversations-list");
  const user = StorageManager.getUser();
  const isGuest =
    !StorageManager.isAuthenticated() ||
    (user && user.username.startsWith("guest_"));

  if (isGuest) {
    track.innerHTML = `
            <div class="sidebar-promo-box">
                <strong>Guest Session</strong><br>
                Chats are temporary. <a href="auth.html?mode=register" style="text-decoration:underline; font-weight:600;">Sign up</a> to secure your records permanently.
            </div>
        `;
    document.getElementById("new-chat-btn").style.display = "none";
    return;
  }

  try {
    const chains = await API.getConversations();
    if (chains.length === 0) {
      track.innerHTML = `<div style="font-size:0.85rem; color:gray; text-align:center; padding-top:20px;">No records yet.</div>`;
      return;
    }
    track.innerHTML = chains
      .map(
        (c) => `
            <div class="conversation-row-item ${c.id === currentActiveConversationId ? "active" : ""}" onclick="switchActiveConversation(${c.id})">
                ${c.title || "Untitled Session"}
            </div>
        `,
      )
      .join("");
  } catch (e) {
    track.innerHTML = `<div style="font-size:0.85rem; color:red;">Failed to load logs.</div>`;
  }
}

function initializeConversationScreen() {
  const feed = document.getElementById("chat-output-feed");
  feed.innerHTML = "";

  if (!currentActiveConversationId) {
    appendMessageBubble(
      "assistant",
      "Hello! I am Jo, your guidance companion. How can I assist you with career paths, administration, or counseling today?",
    );
  }
}

async function switchActiveConversation(id) {
  currentActiveConversationId = id;
  await renderSidebarContext();
  const feed = document.getElementById("chat-output-feed");
  feed.innerHTML =
    '<div class="typing-skeleton"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';

  try {
    const conversation = await API.getConversationDetails(id);
    feed.innerHTML = "";

    if (!conversation.messages || conversation.messages.length === 0) {
      appendMessageBubble(
        "assistant",
        "This context channel is active. Drop your prompt below.",
      );
    } else {
      conversation.messages.forEach((msg) =>
        appendMessageBubble(msg.role, msg.content, msg.is_crisis_flagged),
      );
    }
  } catch (e) {
    feed.innerHTML = `<div style="color:red; padding:20px;">Failed to recover session logs.</div>`;
  }
}

async function createNewChatSession() {
  try {
    const title = prompt("Enter topic heading:") || "New Conversation";
    const res = await API.createConversation(title);
    currentActiveConversationId = res.id;
    await renderSidebarContext();
    switchActiveConversation(res.id);
  } catch (e) {
    alert("Failed to initialize tracking container.");
  }
}

function appendMessageBubble(role, text, isCrisis = false) {
  const feed = document.getElementById("chat-output-feed");
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${role} ${isCrisis ? "crisis-intervention" : ""}`;
  bubble.textContent = text;
  feed.appendChild(bubble);
  feed.scrollTop = feed.scrollHeight;
}

async function transmitUserPrompt(event) {
  event.preventDefault();
  const box = document.getElementById("chat-input-box");
  const text = box.value.trim();
  if (!text) return;

  appendMessageBubble("user", text);
  box.value = "";

  const feed = document.getElementById("chat-output-feed");
  const loader = document.createElement("div");
  loader.className = "message-bubble assistant";
  loader.innerHTML =
    '<div class="typing-skeleton"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  feed.appendChild(loader);
  feed.scrollTop = feed.scrollHeight;

  try {
    if (!currentActiveConversationId) {
      const auto = await API.createConversation(text.substring(0, 25) + "...");
      currentActiveConversationId = auto.id;
      await renderSidebarContext();
    }

    const data = await API.sendMessage(currentActiveConversationId, text);

    loader.remove();

    if (data.assistant_message && data.assistant_message.content) {
      appendMessageBubble(
        "assistant",
        data.assistant_message.content,
        data.crisis_flagged,
      );
    }
  } catch (err) {
    loader.remove();
    appendMessageBubble(
      "assistant",
      "I encountered an issue connecting to my core processing node. Please try again.",
    );
  }
}
