const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const DEFAULT_FRONTEND = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const ENV_ALLOWED = process.env.ALLOWED_ORIGINS || "";
const profilePath = path.join(__dirname, "data", "profile.json");

// Build allowed origins list. Include any origins from ALLOWED_ORIGINS, the FRONTEND_URL, and common localhost dev origins.
const allowedFromEnv = ENV_ALLOWED.split(',').map(s => s.trim()).filter(Boolean);
const allowed = new Set(allowedFromEnv);
if (DEFAULT_FRONTEND) allowed.add(DEFAULT_FRONTEND);
allowed.add('http://localhost:3000');
allowed.add('http://127.0.0.1:3000');

const sendJson = (response, statusCode, payload, requestOrigin = '') => {
  const origin = (requestOrigin || '').replace(/\/$/, "");
  // If the request origin is in the allowed list, echo it back. Otherwise fall back to DEFAULT_FRONTEND (if set) or allow nothing.
  let acao = '';
  if (origin && allowed.has(origin)) {
    acao = origin;
  } else if (DEFAULT_FRONTEND) {
    acao = DEFAULT_FRONTEND;
  } else {
    // No configured frontend: for non-browser clients we still want to respond; set Access-Control-Allow-Origin to "*" so tools can fetch.
    acao = '*';
  }

  const headers = {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  response.writeHead(statusCode, headers);
  // For 204/empty responses, send an empty body
  if (statusCode === 204) {
    response.end();
  } else {
    response.end(JSON.stringify(payload, null, 2));
  }
};

const readProfile = () => {
  const rawProfile = fs.readFileSync(profilePath, "utf8");
  return JSON.parse(rawProfile);
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  const originHeader = request.headers.origin || '';

  if (request.method === "OPTIONS") {
    // CORS preflight
    sendJson(response, 204, {}, originHeader);
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" }, originHeader);
    return;
  }

  if (requestUrl.pathname === "/") {
    sendJson(response, 200, {
      message: "Portfolio backend API is running.",
      endpoints: ["/api/profile", "/api/health"]
    }, originHeader);
    return;
  }

  if (requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "portfolio-backend-api",
      timestamp: new Date().toISOString()
    }, originHeader);
    return;
  }

  if (requestUrl.pathname === "/api/profile") {
    try {
      sendJson(response, 200, readProfile(), originHeader);
    } catch (error) {
      sendJson(response, 500, { error: "Could not load profile data" }, originHeader);
    }
    return;
  }

  sendJson(response, 404, { error: "Route not found" }, originHeader);
});

server.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
