# Claude Code Configuration

## Technology Preferences

### Backend Development
- **Language**: Python 3.8+
- **Web Framework**: Flask or FastAPI for REST APIs
- **Database**: SQLite with file-based persistence
  - Use built-in `sqlite3` module
  - Store database files in `database/` directory
  - Always create proper schemas with foreign keys
- **API Design**: RESTful endpoints with proper HTTP methods
- **CORS**: Always enable CORS for frontend communication using `flask-cors`

### Frontend Development
- **Framework**: React 18+
- **Styling**: CSS3 (no preprocessors unless requested)
  - Use component-scoped CSS files
  - Prefer modern CSS features (flexbox, grid, animations)
- **HTTP Client**: Axios for API calls
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router (when needed)
- **Build Tool**: Create React App (default setup)

### Code Style & Standards
- **Python**:
  - Follow PEP 8 guidelines
  - Use type hints when appropriate
  - Docstrings for all functions
  - Clear separation of concerns (database, business logic, API)

- **JavaScript/React**:
  - Functional components with hooks
  - Clear component hierarchy
  - Props validation when appropriate
  - Meaningful component and variable names

### Project Structure
```
project/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── database.py         # Database connection and queries
│   ├── requirements.txt    # Python dependencies
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js          # Main app component
│   │   └── App.css         # Main styles
│   ├── public/
│   └── package.json
├── database/               # SQLite database files
├── .gitignore
├── README.md
└── start.sh               # Startup script
```

### Development Environment
- **Platform**: WSL2 (Linux)
- **Networking**: Bind servers to `0.0.0.0` for Windows host access
- **Backend Port**: 5000
- **Frontend Port**: 3000

### Best Practices

#### Always Include:
1. **Documentation**:
   - README.md with setup instructions
   - API endpoint documentation
   - Database schema documentation

2. **Gitignore**:
   - Database files (*.db)
   - Node modules
   - Python cache files
   - Environment files
   - PID files

3. **Error Handling**:
   - Try-catch blocks for API calls
   - User-friendly error messages
   - Proper HTTP status codes

4. **Security**:
   - Input validation on both frontend and backend
   - SQL injection prevention (use parameterized queries)
   - CORS configuration

5. **User Experience**:
   - Loading states
   - Success/error notifications
   - Responsive design (mobile-friendly)
   - Accessibility considerations

#### Database Design:
- Use proper primary and foreign keys
- Include timestamps for tracking (created_at, updated_at)
- Normalize data appropriately
- Use transactions for multi-step operations
- Always provide rollback handling

#### API Design:
- RESTful conventions
- Proper HTTP methods (GET, POST, PUT, DELETE)
- JSON responses
- Consistent error response format
- Meaningful status codes

#### Frontend Patterns:
- Component composition over inheritance
- Keep components small and focused
- Separate presentation from logic
- Use meaningful state variable names
- Handle loading and error states
- Clean up effects (useEffect cleanup)

### File Naming Conventions
- **Python**: snake_case (e.g., `database_helper.py`)
- **JavaScript/React**: PascalCase for components (e.g., `BookingForm.js`)
- **CSS**: Match component names (e.g., `BookingForm.css`)
- **Scripts**: lowercase with dashes (e.g., `start.sh`)

### Dependencies Management
- Keep dependencies minimal
- Document all required packages
- Pin major versions in requirements.txt
- Regular security updates

### Testing & Debugging
- Include scripts for easy startup/shutdown
- Provide database inspection tools
- Clear logging for debugging
- Test all API endpoints before frontend integration

### Deployment Considerations
- Environment variables for configuration
- Separate dev/prod settings
- Database backup strategy
- Clear deployment documentation

## Enforcement Rules

1. **Never** use technologies outside this stack without explicit permission
2. **Always** follow the project structure defined above
3. **Always** include proper error handling and validation
4. **Always** create documentation for new features
5. **Always** test both backend and frontend integration
6. **Always** consider responsive design
7. **Always** use environment variables for configuration
8. **Always** include .gitignore files
9. **Always** write clean, readable, maintainable code
10. **Always** provide user feedback (loading, success, errors)

## Additional Notes

- Prioritize simplicity and maintainability
- Code should be self-documenting with clear names
- Performance optimization only when necessary
- Mobile-first responsive design approach
- Accessibility is important (semantic HTML, ARIA labels)
