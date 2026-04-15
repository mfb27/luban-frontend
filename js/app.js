const els = {
  sessionsList: document.getElementById("sessionsList"),
  modelSelect: document.getElementById("modelSelect"),
  newChatBtn: document.getElementById("newChatBtn"),
  themeToggle: document.getElementById("themeToggle"),
  meBtn: document.getElementById("meBtn"),
  meDialog: document.getElementById("meDialog"),
  meClose: document.getElementById("meClose"),
  meAvatar: document.getElementById("meAvatar"),
  meName: document.getElementById("meName"),
  meAvatar2: document.getElementById("meAvatar2"),
  meName2: document.getElementById("meName2"),
  meId: document.getElementById("meId"),
  authDialog: document.getElementById("authDialog"),
  authClose: document.getElementById("authClose"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  messages: document.getElementById("messages"),
  prompt: document.getElementById("prompt"),
  sendBtn: document.getElementById("sendBtn"),
  errorBar: document.getElementById("errorBar"),
  fileInput: document.getElementById("fileInput"),
  attachments: document.getElementById("attachments"),
  logoutBtn: document.getElementById("logoutBtn"),
  dialogOverlay: document.getElementById("dialogOverlay"),
};

const state = {
  me: null,
  models: [],
  sessions: [],
  currentSessionId: "",
  currentModelId: "",
  attachmentURLs: [],
  theme: localStorage.getItem("theme") || "light",
  isSending: false,
  isAuthenticated: false,
};

// 错误类型枚举
const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  DEFAULT: 'default'
};

// 错误提示配置
const ErrorMessages = {
  // 网络错误
  NETWORK: {
    default: '网络连接失败，请检查网络',
    timeout: '请求超时，请稍后重试',
    offline: '网络已断开，请检查网络连接'
  },
  // 认证错误
  AUTH: {
    expired: '登录已过期，请重新登录',
    invalid: '用户名或密码错误',
    forbidden: '没有权限访问此资源',
    noToken: '请先登录'
  },
  // 验证错误
  VALIDATION: {
    required: '此字段为必填项',
    invalid: '输入格式不正确',
    tooShort: '内容太短',
    tooLong: '内容太长',
    fileTooLarge: '文件大小超过限制',
    fileTypeInvalid: '文件类型不支持'
  },
  // 服务器错误
  SERVER: {
    default: '服务器错误，请稍后重试',
    database: '数据库错误',
    upload: '上传失败',
    notFound: '资源不存在'
  }
};

// 设置错误提示
function setError(msg, type = ErrorType.DEFAULT, duration = 5000) {
  if (!msg) {
    hideError();
    return;
  }

  // 移除旧的错误类型
  els.errorBar.classList.remove('error-toast', 'error-network', 'error-auth', 'error-validation');

  // 设置错误消息
  els.errorBar.textContent = msg;
  els.errorBar.classList.remove("hidden");

  // 添加错误类型样式
  if (type !== ErrorType.DEFAULT) {
    els.errorBar.classList.add(`error-${type}`);
  }

  // 如果是toast类型，添加固定定位样式
  if (type === ErrorType.NETWORK || type === ErrorType.AUTH) {
    els.errorBar.classList.add('error-toast');
  }

  // 自动隐藏错误
  if (duration > 0) {
    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
      hideError();
    }, duration);
  }
}

// 隐藏错误提示
function hideError() {
  els.errorBar.classList.add("hidden");
  els.errorBar.classList.remove('error-toast', 'error-network', 'error-auth', 'error-validation');
  clearTimeout(window.errorTimeout);
}

// 显示网络错误
function showNetworkError(error) {
  let message = ErrorMessages.NETWORK.default;

  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    message = ErrorMessages.NETWORK.offline;
  } else if (error.name === 'TimeoutError') {
    message = ErrorMessages.NETWORK.timeout;
  }

  setError(message, ErrorType.NETWORK, 8000);
}

// 显示认证错误
function showAuthError(error) {
  let message = ErrorMessages.AUTH.invalid;

  if (error.message.includes('expired') || error.message.includes('token')) {
    message = ErrorMessages.AUTH.expired;
  } else if (error.message.includes('forbidden')) {
    message = ErrorMessages.AUTH.forbidden;
  } else if (error.message.includes('unauthorized')) {
    message = ErrorMessages.AUTH.noToken;
  }

  setError(message, ErrorType.AUTH, 5000);
}

// 显示验证错误
function showValidationError(field, error) {
  let message = ErrorMessages.VALIDATION.invalid;

  if (error.includes('required')) {
    message = ErrorMessages.VALIDATION.required;
  } else if (error.includes('too short')) {
    message = ErrorMessages.VALIDATION.tooShort;
  } else if (error.includes('too long')) {
    message = ErrorMessages.VALIDATION.tooLong;
  } else if (error.includes('file size')) {
    message = ErrorMessages.VALIDATION.fileTooLarge;
  } else if (error.includes('file type')) {
    message = ErrorMessages.VALIDATION.fileTypeInvalid;
  }

  setError(`${field}: ${message}`, ErrorType.VALIDATION, 4000);
}

// 显示服务器错误
function showServerError(error) {
  let message = ErrorMessages.SERVER.default;

  if (error.message.includes('database')) {
    message = ErrorMessages.SERVER.database;
  } else if (error.message.includes('upload')) {
    message = ErrorMessages.SERVER.upload;
  } else if (error.message.includes('404') || error.message.includes('not found')) {
    message = ErrorMessages.SERVER.notFound;
  }

  setError(message, ErrorType.SERVER, 5000);
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

// API base URL detection
function getApiBaseUrl() {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Check if backend is available on localhost:8080
    try {
      // Try to detect if we're running with backend
      if (window.ENV_CONFIG && window.ENV_CONFIG.API_URL) {
        return window.ENV_CONFIG.API_URL;
      }
      // Default development URL
      return 'http://localhost:8080';
    } catch (e) {
      return 'http://localhost:8080';
    }
  }

  // Production mode - use relative path (will be proxied by Nginx)
  return '';
}

// API base URL
const API_BASE_URL = getApiBaseUrl();

// 请求超时时间（毫秒）
const API_TIMEOUT = 10000;

// API请求函数
async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Add Authorization header if token exists and it's not an auth route
  if (token && !path.startsWith("/api/auth/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = API_BASE_URL + path;

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const isJSON = (res.headers.get("content-type") || "").includes("application/json");
    const body = isJSON ? await res.json() : await res.text();

    // Consider 2xx status codes as successful
    if (res.status >= 200 && res.status < 300) {
      // Extract data from APIResponse structure if present
      if (body && body.data !== undefined) {
        return body.data;
      }
      return body;
    }

    // 处理特定的HTTP状态码
    let error = new Error();

    if (res.status === 401 && !path.startsWith("/api/auth/")) {
      error.name = 'AuthError';
      error.message = body?.message || '认证失败，请检查登录状态';
      // 只有在非登录接口返回401时才清除token并刷新
      localStorage.removeItem("token");
      state.isAuthenticated = false;
      state.me = null;
      window.location.reload();
      throw error;
    } else if (res.status === 401 && path.startsWith("/api/auth/")) {
      // 登录接口返回401，显示错误但不刷新页面
      error.name = 'AuthError';
      error.message = body?.message || '邮箱或密码错误';
    } else if (res.status === 403) {
      error.name = 'AuthError';
      error.message = body?.message || '没有权限访问此资源';
    } else if (res.status === 404) {
      error.name = 'ServerError';
      error.message = body?.message || '请求的资源不存在';
    } else if (res.status >= 500) {
      error.name = 'ServerError';
      error.message = body?.message || '服务器内部错误，请稍后重试';
    } else {
      // 其他错误
      error.name = 'APIError';
      error.message = body?.message || body?.error || `HTTP ${res.status}: ${res.statusText}`;
    }

    throw error;
  } catch (err) {
    clearTimeout(timeoutId);

    // 处理不同的错误类型
    if (err.name === 'AuthError') {
      showAuthError(err);
    } else if (err.name === 'ServerError') {
      showServerError(err);
    } else if (err.name === 'AbortError' || err.message.includes('aborted')) {
      // 超时错误
      const timeoutError = new Error('请求超时，请检查网络连接');
      timeoutError.name = 'NetworkError';
      showNetworkError(timeoutError);
    } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      // 网络连接错误
      showNetworkError(err);
    } else {
      // 默认错误处理
      setError(err.message || '请求失败');
    }

    throw err; // 重新抛出错误以便调用者处理
  }
}

async function loadMe() {
  try {
    const me = await api("/api/user/me");
    state.me = me;
    state.isAuthenticated = true;
    // Always use default avatar
    els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
    els.meName.textContent = me.name;
    els.meAvatar2.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
    els.meName2.textContent = me.name;
    els.meId.textContent = `ID: ${me.id}`;
  } catch (err) {
    // User not authenticated
    state.me = null;
    state.isAuthenticated = false;
    els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
    els.meName.textContent = "登录/注册";
  }
}

async function loadModels() {
  const models = await api("/api/models");
  state.models = models;
  els.modelSelect.innerHTML = "";
  for (const m of models) {
    const opt = document.createElement("option");
    opt.value = m.model_id;  // Use model_id instead of id for the actual model identifier
    opt.textContent = m.name;
    els.modelSelect.appendChild(opt);
  }
  if (!state.currentModelId && models.length) {
    state.currentModelId = models[0].model_id;  // Use model_id instead of id
    els.modelSelect.value = state.currentModelId;
  }
  renderTopbar();
}

function renderTopbar() {
  // 仅保持下拉的选中状态与当前模型同步
  if (els.modelSelect && state.currentModelId) {
    els.modelSelect.value = state.currentModelId;
  }
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

function renderSessions() {
  els.sessionsList.innerHTML = "";
  if (!state.sessions || state.sessions.length === 0) {
    // Show empty state message
    const emptyDiv = document.createElement("div");
    emptyDiv.style.cssText = "text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;";
    emptyDiv.textContent = "暂无历史对话";
    els.sessionsList.appendChild(emptyDiv);
    return;
  }

  for (const s of state.sessions) {
    const div = document.createElement("div");
    div.className = "session-item" + (s.id === state.currentSessionId ? " active" : "");
    div.innerHTML = `
      <div class="session-title"></div>
      <div class="session-meta"></div>
    `;
    div.querySelector(".session-title").textContent = s.title;
    div.querySelector(".session-meta").textContent = fmtTime(s.updated_at);
    div.addEventListener("click", () => selectSession(s.id));
    els.sessionsList.appendChild(div);
  }
}

function renderAttachments() {
  els.attachments.innerHTML = "";
  for (const url of state.attachmentURLs) {
    const span = document.createElement("span");
    span.className = "att";
    span.textContent = url.split("/").slice(-1)[0];
    els.attachments.appendChild(span);
  }
}

// Add a message bubble to the UI
function addMessageBubble(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  wrap.appendChild(bubble);
  return wrap;
}

// Add a message without timestamp
function addMessage(role, content) {
  const container = document.createElement("div");
  container.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  container.appendChild(bubble);
  els.messages.appendChild(container);

  // Remove empty class and greeting when messages are added
  els.messages.parentElement.classList.remove("empty");
  const greeting = els.messages.querySelector(".greeting");
  if (greeting) {
    greeting.remove();
  }

  // Smooth scroll to bottom
  els.messages.scrollTo({
    top: els.messages.scrollHeight,
    behavior: 'smooth'
  });
  return container;
}


function clearMessages() {
  els.messages.innerHTML = "";
  els.messages.parentElement.classList.add("empty");

  // Add greeting message when empty
  const greeting = document.createElement("div");
  greeting.className = "greeting";
  greeting.textContent = "你好，我是鲁班";
  els.messages.appendChild(greeting);
}

async function loadSessions() {
  try {
    const sessions = await api("/api/sessions");
    state.sessions = sessions;
    renderSessions();
    renderTopbar();
  } catch (err) {
    console.error("Failed to load sessions:", err);
    // Don't show error for sessions - it's not critical
  }
}

async function loadMessages(sessionId) {
  if (!sessionId) return;

  try {
    const msgs = await api(`/api/sessions/${encodeURIComponent(sessionId)}/messages`);
    clearMessages();
    if (msgs.length === 0) {
      // Keep empty state with greeting
      els.messages.parentElement.classList.add("empty");
      const greeting = document.createElement("div");
      greeting.className = "greeting";
      greeting.textContent = "你好，我是鲁班";
      els.messages.appendChild(greeting);
    } else {
      for (const m of msgs) {
        addMessage(m.role, m.content);
      }
    }
  } catch (e) {
    console.error("Failed to load messages:", e);
    // Don't clear messages if loading fails
    // Show error toast
    setError("加载消息失败: " + (e.message || String(e)), ErrorType.SERVER, 5000);
  }
}

async function selectSession(sessionId) {
  state.currentSessionId = sessionId;
  renderSessions();
  renderTopbar();
  await loadMessages(sessionId);
}

async function newChat() {
  // Check if user is authenticated
  if (!state.isAuthenticated) {
    els.authDialog.show(); els.dialogOverlay.classList.remove('hidden');
    return;
  }

  state.currentSessionId = "";
  state.attachmentURLs = [];
  renderAttachments();
  renderSessions();
  renderTopbar();
  clearMessages();
  setError("");
}

async function send() {
  // Check if user is authenticated
  if (!state.isAuthenticated) {
    els.authDialog.show(); els.dialogOverlay.classList.remove('hidden');
    return;
  }

  if (state.isSending) return;
  setError("");
  const content = els.prompt.value.trim();
  if (!content) return;

  const modelId = els.modelSelect.value || state.currentModelId;
  state.currentModelId = modelId;

  state.isSending = true;
  els.sendBtn.disabled = true;

  // Disable form inputs during sending
  els.prompt.disabled = true;
  els.fileInput.disabled = true;

  try {
    // Add user message
    addMessage("user", content);
    els.prompt.value = "";

    // Create assistant message container
    const assistantContainer = document.createElement("div");
    assistantContainer.className = "msg assistant";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = "";

    assistantContainer.appendChild(bubble);
    els.messages.appendChild(assistantContainer);

    // Prepare request body
    const reqBody = JSON.stringify({
      session_id: state.currentSessionId,
      content,
      model_id: modelId,
      attachment_urls: state.attachmentURLs,
    });

    // Call streaming API directly - need to handle response manually for SSE
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE_URL + "/api/chat", {
      method: "POST",
      headers,
      body: reqBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);

          switch (event.type) {
            case "session":
              // Update session ID only if it's not already set
              if (!state.currentSessionId) {
                state.currentSessionId = event.session_id;
              }
              break;

            case "content":
              // Append content to assistant bubble
              bubble.textContent += event.data;
              // Smooth scroll to bottom
              requestAnimationFrame(() => {
                els.messages.scrollTo({
                  top: els.messages.scrollHeight,
                  behavior: 'smooth'
                });
              });
              break;

            case "done":
              // Update session list
              await loadSessions();
              break;

            case "error":
              throw new Error(event.error || "Unknown error");
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            // Skip invalid JSON
            continue;
          }
          throw e;
        }
      }
    }

    // Clear attachments after successful send
    state.attachmentURLs = [];
    renderAttachments();
  } catch (e) {
    setError(e.message || String(e));
    // Keep all messages even on error
  } finally {
    state.isSending = false;
    // Re-enable form inputs
    els.sendBtn.disabled = false;
    els.prompt.disabled = false;
    els.fileInput.disabled = false;
    els.prompt.focus();
    renderTopbar();
  }
}

async function uploadFile(file) {
  setError("");
  const fd = new FormData();
  fd.append("file", file);

  // 检查文件大小（限制为50MB）
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    showValidationError('文件', ErrorMessages.VALIDATION.fileTooLarge);
    return;
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    showValidationError('文件', ErrorMessages.VALIDATION.fileTypeInvalid);
    return;
  }

  // Get token for authenticated request
  const token = localStorage.getItem("token");
  const headers = {};

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(API_BASE_URL + "/api/upload", {
      method: "POST",
      headers,
      body: fd
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(body.message || body.error || `HTTP ${res.status}`);
      if (res.status === 413) {
        error.name = 'ValidationError';
        error.message = ErrorMessages.VALIDATION.fileTooLarge;
      } else if (res.status === 415) {
        error.name = 'ValidationError';
        error.message = ErrorMessages.VALIDATION.fileTypeInvalid;
      }
      throw error;
    }

    // APIResponse format - extract data
    const uploadData = body.data || body;
    state.attachmentURLs.push(uploadData.url);
    renderAttachments();
  } catch (err) {
    if (err.name === 'ValidationError') {
      showValidationError('文件', err.message);
    } else {
      showServerError(err);
    }
  }
}

function bindEvents() {
  els.newChatBtn.addEventListener("click", newChat);

  els.modelSelect.addEventListener("change", () => {
    state.currentModelId = els.modelSelect.value;
    renderTopbar();
  });

  els.themeToggle.addEventListener("click", () => {
    setTheme(state.theme === "dark" ? "light" : "dark");
  });

  // Auth events
  els.meBtn.addEventListener("click", () => {
    // Close any open dialog first
    els.authDialog.close();
    els.meDialog.close();
    if (state.isAuthenticated) {
      els.meDialog.show(); els.dialogOverlay.classList.remove('hidden');
    } else {
      els.authDialog.show(); els.dialogOverlay.classList.remove('hidden');
      setTimeout(() => {
        els.loginEmail.focus();
      }, 100);
    }
  });
  els.authClose.addEventListener("click", () => { els.authDialog.close(); els.dialogOverlay.classList.add('hidden'); });
  els.meClose.addEventListener("click", () => { els.meDialog.close(); els.dialogOverlay.classList.add('hidden'); });

  els.loginForm.addEventListener("submit", handleLogin);
  els.registerForm.addEventListener("submit", handleRegister);

  // Tab switching
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.tab));
  });

  // Password strength indicator
  els.registerPassword.addEventListener("input", (e) => {
    checkPasswordStrength(e.target.value);
  });

  // Form validation
  els.registerName.addEventListener("blur", () => {
    if (!els.registerName.value.trim()) {
      showValidationError('姓名', ErrorMessages.VALIDATION.required);
    }
  });

  els.registerEmail.addEventListener("blur", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!els.registerEmail.value.trim()) {
      showValidationError('邮箱', ErrorMessages.VALIDATION.required);
    } else if (!emailRegex.test(els.registerEmail.value)) {
      showValidationError('邮箱', ErrorMessages.VALIDATION.invalid);
    }
  });

  els.loginEmail.addEventListener("blur", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!els.loginEmail.value.trim()) {
      showValidationError('邮箱', ErrorMessages.VALIDATION.required);
    } else if (!emailRegex.test(els.loginEmail.value)) {
      showValidationError('邮箱', ErrorMessages.VALIDATION.invalid);
    }
  });

  els.registerPassword.addEventListener("blur", () => {
    if (!els.registerPassword.value) {
      showValidationError('密码', ErrorMessages.VALIDATION.required);
    } else if (els.registerPassword.value.length < 6) {
      showValidationError('密码', ErrorMessages.VALIDATION.tooShort);
    }
  });

  els.loginPassword.addEventListener("blur", () => {
    if (!els.loginPassword.value) {
      showValidationError('密码', ErrorMessages.VALIDATION.required);
    }
  });

  els.sendBtn.addEventListener("click", send);
  els.prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // Update send button state when prompt content changes
  els.prompt.addEventListener("input", () => {
    els.sendBtn.disabled = els.prompt.value.trim() === '' || state.isSending;
  });

  els.fileInput.addEventListener("change", async () => {
    const file = els.fileInput.files?.[0];
    if (!file) return;
    els.fileInput.value = "";
    try {
      await uploadFile(file);
    } catch (e) {
      setError(e.message || String(e));
    }
  });

  // Logout button
  els.logoutBtn.addEventListener("click", logout);
}

async function boot() {
  setTheme(state.theme);
  bindEvents();

  // Initialize empty state
  els.messages.parentElement.classList.add("empty");

  // Add greeting message on load
  const greeting = document.createElement("div");
  greeting.className = "greeting";
  greeting.textContent = "你好，我是鲁班";
  els.messages.appendChild(greeting);

  try {
    // Load models (no auth required)
    await loadModels();

    // Check authentication and load user data
    await checkAuth();

    // Load sessions if authenticated
    if (state.isAuthenticated) {
      await loadSessions();
    }

    renderAttachments();
  } catch (e) {
    setError(e.message || String(e));
  }
}

// Auth functions
function handleLogin(e) {
  e.preventDefault();

  const email = els.loginEmail.value;
  const password = els.loginPassword.value;

  api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
    .then(res => {
      // Login returns 200 with APIResponse containing data
      state.me = {
        id: res.user_id,
        name: res.name,
        email: res.email
      };
      state.isAuthenticated = true;
      localStorage.setItem("token", res.token);
      els.dialogOverlay.classList.add('hidden');
      // Update avatar to default
      els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
      updateUIAfterAuth();
    })
    .catch(err => {
      // 错误已经在api函数中处理并显示在页面上
      // 不要关闭对话框，让用户看到错误
      console.error("Login error:", err);
    });
}

function checkPasswordStrength(password) {
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');

  if (!password) {
    strengthBar.className = 'strength-bar';
    strengthText.className = 'strength-text';
    strengthText.textContent = '';
    return;
  }

  let strength = 0;
  const checks = [
    password.length >= 6,
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ];

  strength = checks.filter(Boolean).length;

  if (strength <= 2) {
    strengthBar.className = 'strength-bar weak';
    strengthText.className = 'strength-text weak';
    strengthText.textContent = '弱';
  } else if (strength <= 4) {
    strengthBar.className = 'strength-bar medium';
    strengthText.className = 'strength-text medium';
    strengthText.textContent = '中';
  } else {
    strengthBar.className = 'strength-bar strong';
    strengthText.className = 'strength-text strong';
    strengthText.textContent = '强';
  }
}

function handleRegister(e) {
  e.preventDefault();

  const name = els.registerName.value;
  const email = els.registerEmail.value;
  const password = els.registerPassword.value;

  api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
    .then(res => {
      // Registration returns 200 with APIResponse containing data
      state.me = {
        id: res.user_id,
        name: res.name,
        email: res.email
      };
      state.isAuthenticated = true;
      localStorage.setItem("token", res.token);
      els.dialogOverlay.classList.add('hidden');
      // Update avatar to default
      els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
      updateUIAfterAuth();
    })
    .catch(err => {
      // 错误已经在api函数中处理并显示在页面上
      console.error("Register error:", err);
    });
}

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });

  els.loginForm.classList.toggle("hidden", tab !== "login");
  els.registerForm.classList.toggle("hidden", tab !== "register");

  // 清除之前的错误提示
  setError("");

  // Auto-focus appropriate input
  setTimeout(() => {
    if (tab === "login") {
      els.loginEmail.focus();
    } else {
      els.registerName.focus();
    }
  }, 100);
}

async function updateUIAfterAuth() {
  // Update user info in UI
  els.meName.textContent = state.me.name;
  // Always use default avatar for now
  els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";

  // Update sidebar
  document.querySelector('.me-sub').textContent = '个人信息';

  // Load user data and sessions
  try {
    await Promise.all([
      fetchUserProfile(),
      loadSessions()
    ]);
  } catch (err) {
    console.error("Failed to load user data after auth:", err);
  }
}

function fetchUserProfile() {
  api("/api/user/me", {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then(res => {
      if (res.id) {
        state.me = res;
        els.meName.textContent = res.name;
        els.meAvatar.src = res.avatar_url || "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
        els.meName2.textContent = res.name;
        els.meAvatar2.src = res.avatar_url || "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
        els.meId.textContent = `ID: ${res.id}`;
      }
    })
    .catch(err => {
      console.error("Failed to fetch user profile:", err);
    });
}

async function checkAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Verify token is valid
      const res = await api("/api/user/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.id) {
        state.me = res;
        state.isAuthenticated = true;
        updateUIAfterAuth();
      } else {
        localStorage.removeItem("token");
        state.isAuthenticated = false;
        els.meName.textContent = "登录/注册";
        els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      state.isAuthenticated = false;
      els.meName.textContent = "登录/注册";
      els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
    }
  } else {
    // No token, not authenticated
    state.isAuthenticated = false;
    els.meName.textContent = "登录/注册";
    // Avatar already has default src from HTML
  }
}

function logout() {
  // Clear authentication data
  localStorage.removeItem("token");
  state.isAuthenticated = false;
  state.me = null;
  state.sessions = [];
  state.currentSessionId = "";

  // Reset UI
  els.dialogOverlay.classList.add('hidden');
  els.meName.textContent = "登录/注册";
  els.meAvatar.src = "https://img.alicdn.com/imgextra/i3/O1CN01QLt9r31b7x4MN6qUL_!!6000000003419-2-tps-116-116.png";
  els.sessionsList.innerHTML = "";

  // Clear messages and show greeting
  clearMessages();

  // Update sidebar
  document.querySelector('.me-sub').textContent = '个人中心';

  // Reset form
  els.prompt.value = "";
  els.prompt.disabled = false;
  els.sendBtn.disabled = true;
}

boot();
