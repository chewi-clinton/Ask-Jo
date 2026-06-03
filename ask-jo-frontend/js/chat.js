let currentActiveConversationId = null;

window.addEventListener("DOMContentLoaded", async () => {
  evaluateHeaderAuthState();
  await renderSidebarContext();
  initializeConversationScreen();
});

function evaluateHeaderAuthState() {
  const container = document.getElementById("header-user-actions");
  if (StorageManager.isAuthenticated()) {
    const user = StorageManager.getUser();
    container.innerHTML = `
            <span class="btn-text" style="padding-right:10px;">Hi, ${user?.username || "User"}</span>
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

  // Always show the new chat button for both guests and authenticated users
  document.getElementById("new-chat-btn").style.display = "";

  if (!StorageManager.isAuthenticated()) {
    // Guest: show local history from localStorage
    const locals = StorageManager.getGuestHistory() || [];
    if (locals.length === 0) {
      track.innerHTML = `
              <div class="sidebar-promo-box">
                  <strong>Guest Session</strong><br>
                  Chats are temporary. <a href="auth.html?mode=register" style="text-decoration:underline; font-weight:600;">Sign up</a> to secure your records permanently.
              </div>
          `;
    } else {
      track.innerHTML = `
              <div class="conversation-row-item active">Current Session</div>
              <div class="sidebar-promo-box" style="margin-top:8px;">
                  <a href="auth.html?mode=register" style="text-decoration:underline; font-weight:600;">Sign up</a> to save your history permanently.
              </div>
          `;
    }
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

  // Check if coming from a "new conversation" intent (from homepage or new chat btn)
  const params = new URLSearchParams(window.location.search);
  const startNew = params.get("new") === "1";

  if (!StorageManager.isAuthenticated()) {
    const locals = StorageManager.getGuestHistory() || [];
    if (locals.length === 0 || startNew) {
      // Clear guest history if starting fresh
      if (startNew) StorageManager.clearGuestHistory();
      appendMessageBubble(
        "assistant",
        "Hello! I am Jo, your guidance companion. How can I assist you today?",
      );
    } else {
      locals.forEach((msg) => appendMessageBubble(msg.role, msg.content));
    }
  } else {
    if (startNew) {
      // Auto-create a new conversation for authenticated users
      autoCreateNewConversation();
    } else {
      appendMessageBubble(
        "assistant",
        "Welcome to your workspace. Select a conversation or start a new one above.",
      );
    }
  }
}

async function autoCreateNewConversation() {
  try {
    const res = await API.createConversation("New Conversation");
    currentActiveConversationId = res.id;
    // Update URL without reload
    window.history.replaceState({}, "", "chat.html");
    await renderSidebarContext();
    appendMessageBubble(
      "assistant",
      "Hello! I am Jo, your guidance companion. How can I assist you today?",
    );
  } catch (e) {
    appendMessageBubble(
      "assistant",
      "Hello! I am Jo, your guidance companion. How can I assist you today?",
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
  if (!StorageManager.isAuthenticated()) {
    // Guest: just clear the feed and start fresh
    StorageManager.clearGuestHistory();
    currentActiveConversationId = null;
    const feed = document.getElementById("chat-output-feed");
    feed.innerHTML = "";
    await renderSidebarContext();
    appendMessageBubble(
      "assistant",
      "Hello! I am Jo, your guidance companion. How can I assist you today?",
    );
    return;
  }

  try {
    const title = prompt("Enter topic heading:") || "New Conversation";
    const res = await API.createConversation(title);
    currentActiveConversationId = res.id;
    await renderSidebarContext();
    const feed = document.getElementById("chat-output-feed");
    feed.innerHTML = "";
    appendMessageBubble(
      "assistant",
      "New session started. How can I assist you today?",
    );
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
    let replyText = "";
    let crisisFlagged = false;

    if (StorageManager.isAuthenticated()) {
      if (!currentActiveConversationId) {
        const auto = await API.createConversation(
          text.substring(0, 25) + "...",
        );
        currentActiveConversationId = auto.id;
        await renderSidebarContext();
      }
      const data = await API.sendMessage(currentActiveConversationId, text);
      replyText = data.assistant_message?.content || "";
      crisisFlagged = data.crisis_flagged;
    } else {
      StorageManager.saveGuestMessage("user", text);
      const data = await API.sendGuestMessage(text);
      replyText = data.assistant_message?.content || data.reply || "";
      crisisFlagged = data.crisis_flagged;
      StorageManager.saveGuestMessage("assistant", replyText);
    }

    loader.remove();
    appendMessageBubble("assistant", replyText, crisisFlagged);
  } catch (err) {
    loader.remove();
    appendMessageBubble(
      "assistant",
      "I encountered an issue connecting to my core processing node. Please try again.",
    );
  }
}
