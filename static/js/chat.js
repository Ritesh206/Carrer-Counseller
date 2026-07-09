/* ═══════════════════════════════════════════════════════════════════════════
   CareerCompass AI — chat.js
   Real-time AI chat with IBM Watsonx.ai
═══════════════════════════════════════════════════════════════════════════ */

const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const sendBtn      = document.getElementById('sendBtn');
const typingInd    = document.getElementById('typingIndicator');
const charCount    = document.getElementById('charCount');
const clearChatBtn = document.getElementById('clearChatBtn');

document.addEventListener('DOMContentLoaded', () => {
  loadProfileSidebar();
  bindEvents();
  chatInput.focus();
});

function loadProfileSidebar() {
  const profile = JSON.parse(sessionStorage.getItem('cc-profile') || '{}');
  const nameEl = document.getElementById('sidebarName');
  const goalEl = document.getElementById('sidebarGoal');
  if (nameEl && profile.name)        nameEl.textContent = profile.name;
  if (goalEl && profile.career_goal) goalEl.textContent = profile.career_goal;
}

function bindEvents() {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    charCount.textContent  = `${chatInput.value.length} / 1000`;
  });
  document.querySelectorAll('.quick-q').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.q;
      chatInput.dispatchEvent(new Event('input'));
      sendMessage();
    });
  });
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', async () => {
      if (!confirm('Clear chat history?')) return;
      try {
        await apiPost('/api/clear-session', {});
        const msgs = chatMessages.querySelectorAll('.message');
        msgs.forEach((m, i) => { if (i > 0) m.remove(); });
        showToast('Chat cleared', 'info');
      } catch (e) { showToast('Failed to clear', 'error'); }
    });
  }
}

// ── SEND MESSAGE ───────────────────────────────────────────────────────────
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || sendBtn.disabled) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  charCount.textContent  = '0 / 1000';

  setInputState(true);
  showTyping(true);

  try {
    const data = await apiPost('/api/chat', { message: text });
    showTyping(false);
    appendMessage('ai', data.reply, data.timestamp);
  } catch (err) {
    showTyping(false);
    appendMessage('ai', '⚠️ Sorry, I encountered an issue connecting to the AI service. Please check your API credentials and try again.');
    console.error('Chat error:', err);
  } finally {
    setInputState(false);
    chatInput.focus();
  }
}

// ── DOM HELPERS ────────────────────────────────────────────────────────────
function appendMessage(role, text, time) {
  const isUser    = role === 'user';
  const timestamp = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatted = formatText(text);

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
  msgDiv.innerHTML = `
    <div class="message-avatar"><i class="bi bi-${isUser ? 'person-fill' : 'robot'}"></i></div>
    <div class="message-bubble">
      <div class="message-text">${formatted}</div>
      <div class="message-time">${timestamp}</div>
    </div>`;
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

function formatText(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code style="background:var(--surface-2);padding:.1rem .35rem;border-radius:4px;font-size:.88em;">$1</code>')
    .replace(/\n/g,'<br>');
}

function showTyping(visible) {
  typingInd.classList.toggle('d-none', !visible);
  if (visible) scrollToBottom();
}

function setInputState(disabled) {
  sendBtn.disabled    = disabled;
  chatInput.disabled  = disabled;
}

function scrollToBottom() {
  requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
}
