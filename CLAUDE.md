# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luban Chat Frontend is a native HTML/CSS/JavaScript single-page application (SPA) for an AI chat interface. Built without frameworks, it uses vanilla JavaScript with ES6+ features and follows a component-based architecture.

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: CSS variables, Grid, Flexbox, Glassmorphism design system
- **JavaScript (ES6+)**: Vanilla JS with no dependencies
- **No Build Tools**: Direct browser execution

## Directory Structure

```
frontend/
├── index.html          # Main SPA layout
├── css/
│   └── style.css      # Glassmorphism design system (1400 lines)
├── js/
│   └── app.js         # Application logic (1099 lines)
├── images/            # Static assets (currently unused)
├── nginx.conf         # Production nginx configuration
├── docker-compose.dev.yml  # Local development environment
├── Dockerfile         # Docker container for production
└── DEPLOYMENT.md      # Deployment documentation
```

## Development Commands

### Running Locally

```bash
# Using development server script (if available)
./dev-server.sh

# Or with Python's built-in server
python3 -m http.server 3000 -d .

# Access at http://localhost:3000
```

### Docker Development

```bash
# Start full environment (frontend + backend + mysql + redis + minio)
docker-compose -f docker-compose.dev.yml up -d
```

## Architecture

### Component Structure

The app uses a modular function-based architecture in `js/app.js`:

**State Management** (line 32-42):
- `me`: User profile data
- `models`: Available AI models
- `sessions`: Chat session history
- `currentSessionId`: Active session
- `currentModelId`: Selected model
- `attachmentURLs`: Uploaded file references
- `theme`: Dark/light mode preference
- `isSending`: Request state flag
- `isAuthenticated`: Authentication status

**Key Modules**:

1. **Error Handling** (lines 44-84): Centralized error system with typed errors (NETWORK, AUTH, VALIDATION, SERVER)

2. **API Layer** (lines 195-240): Automatic environment detection
   - Development (`localhost`): Uses `http://localhost:8080`
   - Production: Uses relative paths `/api` (proxied by nginx)
   - Includes timeout control (10s) and token injection

3. **UI Components**:
   - `renderSessions()`: Sidebar session management
   - `renderTopbar()`: Model selector and theme toggle
   - `renderAttachments()`: File attachment display
   - `addMessageBubble()`: Message rendering with syntax highlighting support
   - `addMessage()`: Main message addition logic

4. **User Management**:
   - `handleLogin()` / `handleRegister()`: Authentication forms
   - `fetchUserProfile()`: User data retrieval
   - `logout()`: Session cleanup

5. **Chat Operations**:
   - `sendChatMessage()`: Main chat sending logic
   - `loadChatSession()`: Session restoration
   - `createNewSession()`: New chat initialization

### API Endpoints

- `GET /api/models` - Load available models (no auth required)
- `POST /api/chat` - Send chat messages (requires auth)
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List user sessions
- `POST /api/upload` - Upload files
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

**Token Storage**: JWT tokens are stored in `localStorage` with prefix `luban_token_`

### Design System

`css/style.css` implements a comprehensive glassmorphism design:

**CSS Variables** (lines 1-50):
- Color palettes: Light/dark theme support
- Glass effects: Blur, transparency, shadows
- Transitions: Consistent animation timing
- Spacing and sizing system

**Key Classes**:
- `.glass-panel`: Base glassmorphism panel style
- `.chat-bubble`: Message containers with gradient backgrounds
- `.sidebar`, `.main`: Layout containers
- `.btn-primary`, `.btn-secondary`: Primary action buttons

### Environment Configuration

The frontend auto-detects the environment via `getApiBaseUrl()` (lines 195-213):

```javascript
function getApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  return '/';  // Relative path for production nginx proxy
}
```

**Development**:
- Uses `http://localhost:8080` for all API calls
- CORS must be handled by backend or dev server

**Production** (nginx):
- Serves static files from `/usr/share/nginx/html`
- Proxies `/api/*` to backend service
- SPA routing via `try_files $uri $uri/ /index.html`

## Key Patterns

### State Initialization
All state is initialized at app load and persisted via localStorage:
- `theme`: Stored under key `"theme"`
- User tokens: Stored under key `"luban_token_<userId>"`

### Message Rendering
Messages support markdown-like formatting with role-based styling:
- User messages: Purple gradient (`--bubble-user`)
- Assistant messages: Glassmorphism (`--bubble-assistant`)
- Syntax highlighting: Triggers when content contains code blocks

### Session Management
- Sessions are rendered as time-sorted list in sidebar
- Active session highlighted in sidebar
- Clicking a session loads its messages via `loadChatSession()`

## Production Deployment

1. **Build Process**:
   - Current Dockerfile copies files directly (no build step)
   - Consider adding `build.sh` for minification if needed

2. **Nginx Configuration** (`nginx.conf`):
   - Gzip compression enabled
   - Security headers: CSP, X-Frame-Options, XSS protection
   - Static asset caching (1 year)
   - API proxy with timeout settings
   - SPA fallback routing

3. **Docker Compose**:
   - Frontend exposed on port 3000 (80 in container)
   - Backend on port 8080
   - Services: mysql, redis, minio for backend dependencies

## Common Development Tasks

### Adding a New Feature

1. Add state variables to `state` object
2. Create handler function in `js/app.js`
3. Add event binding in `bindEvents()`
4. Create UI element in `index.html` if needed
5. Add styles in `css/style.css`

### Modifying API Calls

All API calls use `callApi()` helper function. Add to this function if new authentication or headers are needed.

### Changing Theme Colors

Edit CSS variables in `--bg-primary`, `--primary`, `--bubble-user` in `css/style.css`.

### Debugging API Issues

1. Check browser console for CORS errors
2. Verify `API_BASE_URL` is correct in browser console
3. Test API endpoints with curl/Postman from backend

## Browser Compatibility

Modern browsers with ES6+ support, CSS Grid, and Fetch API. No polyfills included.
