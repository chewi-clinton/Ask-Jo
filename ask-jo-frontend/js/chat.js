const ChatWorkspace = {
  conversations: [],
  activeConversationId: null,

  init: async function () {
    this.setupEventListeners();
    await this.loadConversations();
  },

  setupEventListeners: function () {
    document.getElementById("chat-input-form").onsubmit = (e) => {
      e.preventDefault();
      this.handleOutgoingMessage();
    };
    document.getElementById("btn-new-chat").onclick = () =>
      this.createNewSession();
  },

  loadConversations: async function () {
    try {
      this.conversations = await API.getConversations();
      this.renderRecentSidebar();

      if (this.conversations.length > 0) {
        this.selectConversation(this.conversations[0].id);
      } else {
        await this.createNewSession();
      }
    } catch (e) {
      console.error("Failed loading chat history indexes", e);
    }
  },

  renderRecentSidebar: function () {
    const container = document.getElementById("recent-conversations-list");
    if (!container) return;

    container.innerHTML = "";
    this.conversations.forEach((c) => {
      const div = document.createElement("div");
      div.className = `recent-item ${this.activeConversationId === c.id ? "active" : ""}`;
      div.textContent = c.title || `Session #${c.id}`;
      div.onclick = () => this.selectConversation(c.id);
      container.appendChild(div);
    });
  },

  selectConversation: function (id) {
    this.activeConversationId = id;
    const target = this.conversations.find((c) => c.id === id);

    const titleBadge = document.getElementById("current-conversation-title");
    if (titleBadge) {
      titleBadge.textContent =
        target && target.title ? target.title : "Active Session";
    }

    this.renderRecentSidebar();

    const historyContainer = document.getElementById("chat-messages-container");
    if (!historyContainer) return;
    historyContainer.innerHTML = "";

    if (target && target.messages) {
      target.messages.forEach((m) =>
        this.appendMessageBubble(m.role, m.content),
      );
    }
  },

  createNewSession: async function () {
    try {
      const newSession = await API.createConversation("New Session");
      this.conversations.unshift(newSession);
      this.selectConversation(newSession.id);
    } catch (e) {
      console.error("Could not trigger clean workspace reset", e);
    }
  },

  handleOutgoingMessage: async function () {
    const inputField = document.getElementById("chat-input-field");
    const content = inputField ? inputField.value.trim() : "";
    if (!content || !this.activeConversationId) return;

    this.appendMessageBubble("user", content);
    inputField.value = "";

    try {
      const response = await API.sendMessage(
        this.activeConversationId,
        content,
      );

      if (response.assistant_message) {
        this.appendMessageBubble(
          "assistant",
          response.assistant_message.content,
          response.sources,
        );
      }
    } catch (err) {
      this.appendMessageBubble(
        "assistant",
        "I encountered a processing issue. Please verify endpoint access parameters.",
      );
    }
  },

  appendMessageBubble: function (role, text, sources = []) {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;

    const row = document.createElement("div");
    row.className = `msg-row ${role}-row`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = Utils.parseMarkdownLinks(text);

    if (sources && sources.length > 0) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "sources-container";
      sourcesDiv.innerHTML = `<div class="sources-title">Verified Sources:</div>`;
      sources.forEach((src) => {
        sourcesDiv.innerHTML += `<a class="source-tag" href="${src.url}" target="_blank" rel="noopener noreferrer">${src.title || "Link"}</a>`;
      });
      bubble.appendChild(sourcesDiv);
    }

    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  },
};
