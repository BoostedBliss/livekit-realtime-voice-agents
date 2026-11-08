## 2025-03-05 - [Information Leakage in Error Handling]
**Vulnerability:** The error message object caught in the `/api/agent/chat` endpoint exposed the `err.message` directly to the client.
**Learning:** Developers often pass error objects or their messages directly to the client response during development for easier debugging, but forget to replace them with generic messages in production.
**Prevention:** Always implement a centralized error handler or consistently use generic error messages (e.g., 'An internal error occurred') for client responses to prevent internal server details from leaking.
