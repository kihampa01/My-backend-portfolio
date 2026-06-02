const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://frontend-repo-alpha.vercel.app/";
const profilePath = path.join(__dirname, "data", "profile.json");

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
};

const readProfile = () => {
  const rawProfile = fs.readFileSync(profilePath, "utf8");
  return JSON.parse(rawProfile);
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, {
      error: "Method not allowed"
    });
    return;
  }

  if (requestUrl.pathname === "/") {
    sendJson(response, 200, {
      message: "Portfolio backend API is running.",
      endpoints: ["/api/profile", "/api/health"]
    });
    return;
  }

  if (requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "portfolio-backend-api",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (requestUrl.pathname === "/api/profile") {
    try {
      sendJson(response, 200, readProfile());
    } catch (error) {
      sendJson(response, 500, {
        error: "Could not load profile data"
      });
    }
    return;
  }

  sendJson(response, 404, {
    error: "Route not found"
  });
});

server.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
