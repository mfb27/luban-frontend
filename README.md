# Luban Chat Frontend

This is the frontend part of the Luban chat application, built with native HTML, CSS, and JavaScript.

## Directory Structure

```
frontend/
├── css/          # Stylesheets
│   └── style.css # Main application styles
├── js/           # JavaScript files
│   └── app.js    # Main application logic
├── images/       # Image assets (not used yet)
└── index.html    # Main HTML file
├── build.sh      # Build script for production
└── dev-server.sh # Development server script
```

## Development

### Running in Development Mode

1. Start the frontend development server:
   ```bash
   chmod +x dev-server.sh
   ./dev-server.sh
   ```

2. Or run with Python's built-in server:
   ```bash
   python3 -m http.server 3000 -d .
   ```

3. Access the application at http://localhost:3000

4. Start the backend server:
   ```bash
   go run ../cmd/server.go
   ```

### Frontend-Backend Separation

This frontend is designed to be deployed independently from the backend:
- Frontend: Static files served by Nginx
- Backend: Go application running on port 8080
- API requests are proxied through Nginx in production

### Building for Production

1. Run the build script to optimize the frontend:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

2. The build script will:
   - Minify CSS and JavaScript (if minify is installed)
   - Create a version.js file for cache busting

## Integration with Backend

The frontend automatically detects the environment and configures API endpoints accordingly:

- **Development**: Uses `http://localhost:8080` for API calls
- **Production**: Uses relative paths (`/api`) proxied by Nginx

```javascript
// The frontend automatically handles the correct API base URL
// In development: http://localhost:8080/api/chat
// In production: /api/chat (proxied by Nginx)
await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello',
    model: 'gpt-3.5-turbo'
  })
})
```

### Key API Endpoints

- `POST /api/chat` - Send chat messages
- `GET /api/models` - Get available models
- `POST /api/sessions` - Create new chat session
- `GET /api/sessions` - List chat sessions
- `POST /api/upload` - Upload files
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between light and dark modes
- **File Upload**: Support for images and videos
- **Session Management**: Create and manage chat sessions
- **Model Selection**: Choose different AI models
- **Real-time Chat**: Send and receive messages instantly

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support
- Fetch API support

## Deployment

1. Build the frontend using `./build.sh`
2. The backend server will automatically serve the frontend from the `frontend` directory
3. Configure the backend to serve production builds