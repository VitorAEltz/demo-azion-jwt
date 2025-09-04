import { decode, sign, verify } from "azion/jwt";
import {
  generateResponse,
  notFoundRoute,
  methodNotAllowed,
  unauthorized
} from "../utils";
import { CustomEvent } from "../types/event";

const SECRET = 'MY_SECRET';
const USER = 'user1@test.com';
const PASSWORD = 'My_Pass*';

async function generateToken() {
  const inPayload = {
    sub: USER,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
  };
  const token = await sign(inPayload, SECRET);

  return token;
}

async function decodeJwt(token: string) {
  await verify(token, SECRET);

  const { header, payload } = decode(token);

  return { header, payload };
}

async function loginRoute(request: Request): Promise<Response> {
  const body = await request.json();
  const { user, password } = body;

  if (user === USER && password === PASSWORD) {
    const token = await generateToken();
    return generateResponse({ token });
  } else {
    return unauthorized();
  }
}

async function protectedRoute(request: Request): Promise<Response> {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.split("Bearer ")[1];

  try {
    const jwt = await decodeJwt(token);

    const data = {
      jwt,
      message: "Protected route.",
    };

    return generateResponse(data);
  } catch (error: any) {
    return generateResponse({ message: `${error}` }, 500);
  }
}

function publicRoute(): Response {
  return generateResponse({ message: "Public route." });
}

async function serveStaticFile(path: string): Promise<Response> {
  // For demo purposes, serve a simple HTML page
  // In production, you'd want to serve actual static files
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JWT Authentication Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 600px; width: 90%; text-align: center; }
        h1 { color: #1f2937; margin-bottom: 1rem; }
        p { color: #6b7280; margin-bottom: 2rem; }
        .demo-info { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1rem; margin: 2rem 0; }
        .demo-info h3 { color: #0369a1; margin-bottom: 0.5rem; }
        .demo-info p { color: #0369a1; font-size: 0.9rem; margin: 0; }
        .endpoints { text-align: left; margin: 2rem 0; }
        .endpoint { background: #f8fafc; padding: 1rem; margin: 0.5rem 0; border-radius: 8px; border-left: 4px solid #4f46e5; }
        .endpoint code { font-family: monospace; color: #4f46e5; font-weight: bold; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 0.75rem 2rem; border: none; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0.5rem; cursor: pointer; transition: background 0.3s ease; }
        .btn:hover { background: #3730a3; }
        .btn-outline { background: transparent; color: #4f46e5; border: 2px solid #4f46e5; }
        .btn-outline:hover { background: #4f46e5; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 JWT Authentication Demo</h1>
        <p>Welcome to the JWT authentication demonstration built with TypeScript and Azion Edge Functions.</p>
        
        <div class="demo-info">
            <h3>Demo Credentials</h3>
            <p><strong>Email:</strong> user1@test.com<br><strong>Password:</strong> My_Pass*</p>
        </div>
        
        <div class="endpoints">
            <h3>Available Endpoints:</h3>
            <div class="endpoint">
                <code>GET /public</code> - Public route (no authentication required)
            </div>
            <div class="endpoint">
                <code>POST /login</code> - Authentication endpoint
            </div>
            <div class="endpoint">
                <code>GET /protected</code> - Protected route (requires Bearer token)
            </div>
        </div>
        
        <div>
            <button class="btn" onclick="testPublic()">Test Public Route</button>
            <button class="btn btn-outline" onclick="testLogin()">Test Login</button>
        </div>
        
        <div id="result" style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; font-family: monospace; font-size: 0.9rem; text-align: left; display: none; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;"></div>
    </div>
    
    <script>
        let currentToken = null;
        
        async function testPublic() {
            try {
                const response = await fetch('/public');
                const data = await response.json();
                showResult('Public Route Test', data, response.ok);
            } catch (error) {
                showResult('Public Route Test', { error: error.message }, false);
            }
        }
        
        async function testLogin() {
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: 'user1@test.com', password: 'My_Pass*' })
                });
                const data = await response.json();
                
                if (response.ok && data.token) {
                    currentToken = data.token;
                    showResult('Login Test', data, true);
                    
                    // Add protected route test button
                    setTimeout(() => {
                        const container = document.querySelector('.container');
                        if (!document.getElementById('protected-btn')) {
                            const btn = document.createElement('button');
                            btn.id = 'protected-btn';
                            btn.className = 'btn';
                            btn.textContent = 'Test Protected Route';
                            btn.onclick = testProtected;
                            container.appendChild(btn);
                        }
                    }, 1000);
                } else {
                    showResult('Login Test', data, false);
                }
            } catch (error) {
                showResult('Login Test', { error: error.message }, false);
            }
        }
        
        async function testProtected() {
            if (!currentToken) {
                showResult('Protected Route Test', { error: 'No token available. Please login first.' }, false);
                return;
            }
            
            try {
                const response = await fetch('/protected', {
                    headers: { 'Authorization': 'Bearer ' + currentToken }
                });
                const data = await response.json();
                showResult('Protected Route Test', data, response.ok);
            } catch (error) {
                showResult('Protected Route Test', { error: error.message }, false);
            }
        }
        
        function showResult(title, data, success) {
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.style.borderLeft = '4px solid ' + (success ? '#10b981' : '#ef4444');
            resultDiv.innerHTML = '<strong>' + title + ':</strong><br>' + JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>`;

  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html",
    },
    status: 200,
  });
}

async function handleRequest({ request, args }: CustomEvent): Promise<Response> {
  const { method, url } = request;
  const path = (new URL(url)).pathname;

  switch (path) {
    case '/':
      return (method === 'GET') ?
        serveStaticFile(path) :
        methodNotAllowed();
    case '/login':
      return (method === 'POST') ?
        loginRoute(request) :
        methodNotAllowed();
    case '/protected':
      return (method === 'GET') ?
        protectedRoute(request) :
        methodNotAllowed();
    case '/public':
      return (method === 'GET') ?
        publicRoute() :
        methodNotAllowed();
    default:
      return notFoundRoute();
  }
}

export { handleRequest };
