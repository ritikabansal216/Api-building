import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:4000/api";

const ENDPOINTS = [
  { method: "GET",    path: "/health",        auth: false, label: "Health Check",       role: "public"  },
  { method: "POST",   path: "/auth/register", auth: false, label: "Register User",       role: "public",  body: { username: "john", email: "john@test.com", password: "pass123" } },
  { method: "POST",   path: "/auth/login",    auth: false, label: "Login",               role: "public",  body: { email: "admin@example.com", password: "admin123" } },
  { method: "GET",    path: "/auth/me",       auth: true,  label: "My Profile",          role: "any"    },
  { method: "GET",    path: "/products",      auth: true,  label: "List Products",       role: "any"    },
  { method: "POST",   path: "/products",      auth: true,  label: "Create Product",      role: "admin",   body: { name: "New Gadget", price: 99.99, stock: 30 } },
  { method: "GET",    path: "/users",         auth: true,  label: "List All Users",      role: "admin"  },
];

const roleColor = { public: "#6ee7b7", any: "#93c5fd", admin: "#f9a8d4" };
const methodColor = { GET: "#34d399", POST: "#60a5fa", PUT: "#fbbf24", DELETE: "#f87171" };

function Badge({ text, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700,
      fontFamily: "monospace", letterSpacing: "0.04em"
    }}>{text}</span>
  );
}

function JsonBox({ data, label }) {
  if (!data) return null;
  const isError = data?.error || (data?.status && data.status >= 400);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "monospace" }}>{label}</div>
      <pre style={{
        background: isError ? "#1e0a0a" : "#0a1628",
        border: `1px solid ${isError ? "#7f1d1d" : "#1e3a5f"}`,
        borderRadius: 8, padding: "12px 14px", margin: 0,
        fontSize: 12, fontFamily: "'Fira Code', 'Cascadia Code', monospace",
        color: isError ? "#fca5a5" : "#a5f3fc",
        overflowX: "auto", maxHeight: 200, overflowY: "auto",
        lineHeight: 1.6
      }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function EndpointRow({ ep, token, onTokenCapture }) {
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState(ep.body ? JSON.stringify(ep.body, null, 2) : "");

  const fire = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const opts = {
        method: ep.method,
        headers: { "Content-Type": "application/json", ...(ep.auth && token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(["POST", "PUT"].includes(ep.method) && body ? { body } : {}),
      };
      const res = await fetch(`${API}${ep.path}`, opts);
      const json = await res.json();
      setStatus(res.status);
      setResponse(json);
      if (json.token) onTokenCapture(json.token);
    } catch (e) {
      setStatus(0);
      setResponse({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const statusOk = status >= 200 && status < 300;

  return (
    <div style={{
      background: "#0f172a", border: "1px solid #1e293b",
      borderRadius: 12, padding: "16px 18px", marginBottom: 12,
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Badge text={ep.method} color={methodColor[ep.method]} />
        <code style={{ color: "#e2e8f0", fontSize: 13, flex: 1, fontFamily: "monospace" }}>{ep.path}</code>
        <Badge text={ep.role} color={roleColor[ep.role] || "#a78bfa"} />
        {ep.auth && <Badge text="🔐 auth" color="#fbbf24" />}
        <button onClick={fire} disabled={loading} style={{
          background: loading ? "#1e293b" : "#3b82f6",
          color: "white", border: "none", borderRadius: 6,
          padding: "5px 16px", fontSize: 12, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "monospace", transition: "background 0.2s"
        }}>
          {loading ? "⏳" : "▶ Run"}
        </button>
        {status && (
          <span style={{
            fontFamily: "monospace", fontSize: 12, fontWeight: 700,
            color: statusOk ? "#34d399" : "#f87171"
          }}>{status}</span>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{ep.label}</div>

      {body !== "" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "monospace" }}>Request Body (editable)</div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={Math.min(6, body.split("\n").length + 1)} style={{
            width: "100%", background: "#020617", border: "1px solid #1e3a5f",
            borderRadius: 8, color: "#93c5fd", fontFamily: "monospace",
            fontSize: 12, padding: "10px 12px", boxSizing: "border-box",
            resize: "vertical", outline: "none", lineHeight: 1.6
          }} />
        </div>
      )}

      <JsonBox data={response} label="Response" />
    </div>
  );
}

function CustomRequest({ token }) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/products");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fire = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(["POST", "PUT"].includes(method) && body ? { body } : {}),
      };
      const res = await fetch(`${API}${path}`, opts);
      const json = await res.json();
      setStatus(res.status);
      setResponse(json);
    } catch (e) {
      setStatus(0);
      setResponse({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0f172a", border: "1px solid #7c3aed44", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 12, fontFamily: "monospace" }}>⚡ Custom Request</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={method} onChange={e => setMethod(e.target.value)} style={{
          background: "#1e293b", border: "1px solid #334155", color: methodColor[method] || "#e2e8f0",
          borderRadius: 6, padding: "6px 10px", fontFamily: "monospace", fontSize: 13, fontWeight: 700
        }}>
          {["GET", "POST", "PUT", "DELETE"].map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={path} onChange={e => setPath(e.target.value)} style={{
          flex: 1, minWidth: 200, background: "#020617", border: "1px solid #1e3a5f",
          borderRadius: 6, color: "#e2e8f0", fontFamily: "monospace", fontSize: 13,
          padding: "6px 12px", outline: "none"
        }} placeholder="/path" />
        <button onClick={fire} disabled={loading} style={{
          background: "#7c3aed", color: "white", border: "none", borderRadius: 6,
          padding: "6px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "monospace"
        }}>
          {loading ? "⏳" : "▶ Send"}
        </button>
        {status && <span style={{ fontFamily: "monospace", fontSize: 12, color: status < 300 ? "#34d399" : "#f87171" }}>{status}</span>}
      </div>
      {["POST", "PUT"].includes(method) && (
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} style={{
          marginTop: 10, width: "100%", background: "#020617", border: "1px solid #1e3a5f",
          borderRadius: 8, color: "#93c5fd", fontFamily: "monospace", fontSize: 12,
          padding: "10px 12px", boxSizing: "border-box", resize: "vertical", outline: "none"
        }} placeholder='{"key": "value"}' />
      )}
      <JsonBox data={response} label="Response" />
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState(null);

  const decodeToken = useCallback((t) => {
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      setDecoded(payload);
    } catch { setDecoded(null); }
  }, []);

  const handleToken = useCallback((t) => {
    setToken(t);
    decodeToken(t);
  }, [decodeToken]);

  useEffect(() => {
    if (token) decodeToken(token);
  }, [token, decodeToken]);

  return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#e2e8f0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        borderBottom: "1px solid #1e293b", padding: "20px 24px"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18
            }}>🔌</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#f1f5f9" }}>
                REST API Tester
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                localhost:4000 · JWT Auth · RBAC
              </div>
            </div>
          </div>

          {/* Token Bar */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>🔑 Token:</div>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste JWT token here, or Login below to auto-fill…"
              style={{
                flex: 1, background: "#0f172a", border: `1px solid ${token ? "#3b82f6" : "#1e293b"}`,
                borderRadius: 6, color: "#93c5fd", fontFamily: "monospace", fontSize: 11,
                padding: "6px 12px", outline: "none",
                transition: "border-color 0.2s"
              }}
            />
            {token && (
              <button onClick={() => { setToken(""); setDecoded(null); }} style={{
                background: "#1e293b", border: "none", color: "#94a3b8",
                borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12
              }}>✕ Clear</button>
            )}
          </div>

          {decoded && (
            <div style={{
              marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center"
            }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Logged in as:</span>
              <Badge text={decoded.username} color="#60a5fa" />
              <Badge text={decoded.role} color={decoded.role === "admin" ? "#f9a8d4" : "#6ee7b7"} />
              <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                exp: {new Date(decoded.exp * 1000).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(roleColor).map(([r, c]) => <Badge key={r} text={r} color={c} />)}
          <span style={{ fontSize: 11, color: "#475569" }}>— required role</span>
          {Object.entries(methodColor).map(([m, c]) => <Badge key={m} text={m} color={c} />)}
        </div>

        {/* Info Box */}
        <div style={{
          background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10,
          padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#64748b",
          fontFamily: "monospace", lineHeight: 1.8
        }}>
          <span style={{ color: "#f9a8d4" }}>Admin</span>: admin@example.com / admin123 &nbsp;·&nbsp;
          <span style={{ color: "#6ee7b7" }}>Register</span> any user to get a <span style={{ color: "#93c5fd" }}>user</span> role &nbsp;·&nbsp;
          Login auto-fills the token above &nbsp;·&nbsp;
          Body fields are <span style={{ color: "#fbbf24" }}>editable</span>
        </div>

        {/* Endpoint list */}
        <div style={{ marginBottom: 24 }}>
          {ENDPOINTS.map(ep => (
            <EndpointRow key={ep.method + ep.path} ep={ep} token={token} onTokenCapture={handleToken} />
          ))}
        </div>

        {/* Custom request */}
        <CustomRequest token={token} />

        {/* API Reference */}
        <div style={{
          marginTop: 24, background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 12, padding: "16px 18px"
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12, fontFamily: "monospace" }}>
            📋 Full API Reference
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
            <thead>
              <tr style={{ color: "#475569" }}>
                {["Method", "Endpoint", "Auth", "Role", "Description"].map(h => (
                  <th key={h} style={{ textAlign: "left", paddingBottom: 8, borderBottom: "1px solid #1e293b", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["GET",    "/api/health",         "No",  "—",     "Health check"],
                ["POST",   "/api/auth/register",  "No",  "—",     "Register new user"],
                ["POST",   "/api/auth/login",     "No",  "—",     "Login → get JWT"],
                ["GET",    "/api/auth/me",        "Yes", "any",   "Get own profile"],
                ["GET",    "/api/products",       "Yes", "any",   "List products"],
                ["POST",   "/api/products",       "Yes", "admin", "Create product"],
                ["PUT",    "/api/products/:id",   "Yes", "admin", "Update product"],
                ["DELETE", "/api/products/:id",   "Yes", "admin", "Delete product"],
                ["GET",    "/api/users",          "Yes", "admin", "List all users"],
                ["DELETE", "/api/users/:id",      "Yes", "admin", "Delete user"],
              ].map(([m, p, a, r, d]) => (
                <tr key={m + p} style={{ borderBottom: "1px solid #0f172a" }}>
                  <td style={{ padding: "6px 0", paddingRight: 12 }}><Badge text={m} color={methodColor[m]} /></td>
                  <td style={{ color: "#e2e8f0", paddingRight: 12 }}>{p}</td>
                  <td style={{ color: a === "Yes" ? "#fbbf24" : "#475569" }}>{a}</td>
                  <td style={{ paddingRight: 12 }}>{r !== "—" ? <Badge text={r} color={roleColor[r] || "#a78bfa"} /> : <span style={{ color: "#475569" }}>—</span>}</td>
                  <td style={{ color: "#64748b" }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#334155", fontFamily: "monospace" }}>
          Backend: Node.js + Express + JWT + bcrypt · In-memory store · CORS enabled
        </div>
      </div>
    </div>
  );
}
