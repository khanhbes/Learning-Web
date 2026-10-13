import {
  randomBytes,
  createHash,
  timingSafeEqual,
  scryptSync,
} from "node:crypto";
export function installAuth(app, store, config, now) {
  if (!config.cloud) return;
  const salt = randomBytes(16),
    passwordHash = scryptSync(config.password, salt, 32);
  let failed = 0,
    resetAt = 0;
  const cookieName = "__Host-bytepath";
  const digest = (token) => createHash("sha256").update(token).digest("hex");
  const passwordVersion = digest(config.password);
  const readSessions = () =>
    JSON.parse(
      store.db.prepare("SELECT value FROM meta WHERE key='sessions'").get()
        ?.value || "{}",
    );
  const saveSessions = (sessions) =>
    store.db
      .prepare(
        "INSERT INTO meta VALUES ('sessions',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(JSON.stringify(sessions));
  const cookie = (req) =>
    req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1) || "";
  const fail = (message, statusCode) =>
    Object.assign(new Error(message), { statusCode });
  app.addHook("onRequest", async (req) => {
    if (
      (!req.url.startsWith("/api/") && !req.url.startsWith("/sources/")) ||
      ["/api/auth/login", "/api/auth/status", "/api/health"].includes(
        req.url.split("?")[0],
      )
    )
      return;
    const token = cookie(req),
      sessions = readSessions(),
      session = token && sessions[digest(token)];
    if (
      !session ||
      session.expires <= now() ||
      session.passwordVersion !== passwordVersion
    )
      throw fail("Đăng nhập để mở hành trình của bạn.", 401);
  });
  app.get("/api/auth/status", async (req) => {
    const token = cookie(req),
      session = token && readSessions()[digest(token)];
    return {
      required: true,
      authenticated:
        !!session &&
        session.expires > now() &&
        session.passwordVersion === passwordVersion,
    };
  });
  app.post("/api/auth/login", { bodyLimit: 4096 }, async (req, reply) => {
    if (now() >= resetAt) {
      failed = 0;
      resetAt = now() + 15 * 60000;
    }
    if (failed >= 10)
      throw fail("Đã thử quá nhiều lần. Thử lại sau 15 phút.", 429);
    const value = req.body?.password;
    if (
      typeof value !== "string" ||
      value.length > 256 ||
      !timingSafeEqual(scryptSync(value, salt, 32), passwordHash)
    ) {
      failed++;
      throw fail("Mật khẩu chưa đúng.", 401);
    }
    failed = 0;
    const token = randomBytes(32).toString("hex"),
      expires = now() + 7 * 86400000;
    store.transaction(() => {
      const sessions = readSessions();
      for (const [k, s] of Object.entries(sessions))
        if (s.expires <= now()) delete sessions[k];
      sessions[digest(token)] = { expires, passwordVersion };
      saveSessions(sessions);
    });
    reply.header(
      "Set-Cookie",
      `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    );
    return { ok: true };
  });
  app.post("/api/auth/logout", async (req, reply) => {
    const token = cookie(req);
    store.transaction(() => {
      const sessions = readSessions();
      if (token) delete sessions[digest(token)];
      saveSessions(sessions);
    });
    reply.header(
      "Set-Cookie",
      `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    );
    return { ok: true };
  });
}
