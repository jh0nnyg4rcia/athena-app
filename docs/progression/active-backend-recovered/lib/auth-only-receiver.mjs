// work/athena-admin-gateway/ceo-approval-bridge/auth-only-receiver.ts
import { createHash } from "node:crypto";

// work/athena-admin-gateway/ceo-approval-bridge/signature.ts
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
var fail = (v, c) => {
  if (!v) throw Error(c);
};
function approvalVerifier(publicKey, kid) {
  const key = createPublicKey(publicKey);
  return (token) => {
    fail(typeof token === "string" && token.length < 15e5, "EVIDENCE_INVALID");
    const parts = token.split(".");
    fail(parts.length === 3, "EVIDENCE_INVALID");
    const h = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    fail(h.alg === "RS256" && h.kid === kid && h.typ === "athena-approval+jws", "EVIDENCE_INVALID");
    fail(verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, Buffer.from(parts[2], "base64url")), "EVIDENCE_SIGNATURE");
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  };
}

// work/athena-admin-gateway/ceo-approval-bridge/constants.ts
var CALLER = "mcp-admin@athena-mcp-hml-20261013.iam.gserviceaccount.com";
var BASELINE = "d57cac791bbe16941b1307c7c51a71e7df4f62214210767979d5745592ff6f54";

// work/athena-admin-gateway/ceo-approval-bridge/routes.ts
import { OAuth2Client } from "google-auth-library";
function googleServiceVerifier(audience) {
  if (audience !== "https://athenaapi-37efv4sd6a-rj.a.run.app") throw Error("SERVICE_AUDIENCE");
  const client = new OAuth2Client();
  return async (token) => {
    const ticket = await client.verifyIdToken({ idToken: token, audience }), p = ticket.getPayload();
    if (!p || !["accounts.google.com", "https://accounts.google.com"].includes(p.iss) || p.email !== CALLER || p.email_verified !== true) throw Error("SERVICE_IDENTITY");
    return { email: p.email, email_verified: true, issuer: "https://accounts.google.com" };
  };
}
function mountCeoPilotBridge(app, entry, { enabled = false, publishEnabled = false } = {}) {
  const paths = ["/api/internal/mcp-day4/publish", "/api/internal/mcp-day4/receipt", "/api/internal/mcp-day4/auth-check"];
  for (const path of paths) app.post(path, async (req, res) => {
    if (!enabled) return res.status(403).json({ error: "PILOT_DISABLED" });
    const token = String(req.headers.authorization ?? "").match(/^Bearer ([^\s]+)$/)?.[1];
    if (!token) return res.status(401).json({ error: "SERVICE_AUTH_REQUIRED" });
    try {
      const b = req.body;
      if (path.endsWith("/auth-check")) {
        if (!b || Object.keys(b).join(",") !== "evidence" || typeof b.evidence !== "string") throw Error("INPUT_SCOPE");
        return res.json(await entry.authCheck(b.evidence, token));
      }
      if (path.endsWith("/publish")) {
        if (!publishEnabled) return res.status(403).json({ error: "PUBLICATION_DISABLED" });
      }
      if (path.endsWith("/publish")) {
        if (!b || Object.keys(b).join(",") !== "evidence" || typeof b.evidence !== "string") throw Error("INPUT_SCOPE");
        return res.json(await entry.publish(b.evidence, token));
      }
      if (!b || Object.keys(b).sort().join(",") !== "operationId,planSha256") throw Error("INPUT_SCOPE");
      return res.json({ receipt: await entry.receipt(b.planSha256, b.operationId, token) });
    } catch {
      res.status(403).json({ error: "PILOT_REQUEST_REJECTED" });
    }
  });
}

// work/athena-admin-gateway/ceo-approval-bridge/auth-only-receiver.ts
var need = (v) => {
  if (!v) throw Error("AUTH_PROOF_INVALID");
};
var canonical = (x) => Array.isArray(x) ? "[" + x.map(canonical).join(",") + "]" : x && typeof x === "object" ? "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + canonical(x[k])).join(",") + "}" : JSON.stringify(x);
var referenceHash = (p) => createHash("sha256").update(canonical({ purpose: p.purpose, operationId: p.operationId, lessonId: p.lessonId, section: p.section, baselineVersion: p.baselineVersion, baselineSha256: p.baselineSha256, markdownSha256: p.markdownSha256 })).digest("hex");
function createAuthOnlyReceiver({ verifyServiceIdentity, verifyEvidence, now = Date.now }) {
  return { async authCheck(evidence, token) {
    const identity = await verifyServiceIdentity(token);
    need(identity?.email === CALLER && identity.email_verified === true && identity.issuer === "https://accounts.google.com");
    const e = verifyEvidence(evidence);
    need(e && Object.keys(e).sort().join(",") === ["issuer", "audience", "purpose", "nonce", "operationId", "issuedAt", "expiresAt", "lessonId", "section", "baselineVersion", "baselineSha256", "markdownSha256", "planSha256"].sort().join(","));
    need(e.issuer === "athena-mcp-hml-20261013" && e.audience === "athena-ceo-pilot-publication" && e.purpose === "athena-bridge-authentication-check");
    need(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(e.operationId) && e.nonce === e.operationId);
    need(e.lessonId === "day_4_part_0" && e.section === "[BLOCK_4]" && e.baselineVersion === 2 && e.baselineSha256 === BASELINE && e.markdownSha256 === "f02b20cead30d1ab45b335f753b5d43257530a6e04ea548c92e5dab5f49423ab" && e.planSha256 === referenceHash(e));
    need(Number.isSafeInteger(e.issuedAt) && Number.isSafeInteger(e.expiresAt) && e.issuedAt <= now() && now() < e.expiresAt && e.expiresAt - e.issuedAt <= 6e4);
    return { authenticated: true, signatureVerified: true, nonce: e.nonce, referenceMetadataValidated: true, editorialOperations: 0 };
  }, async receipt() {
    throw Error("AUTH_ONLY");
  }, async publish() {
    throw Error("AUTH_ONLY");
  } };
}
async function installAuthOnlyReceiver(app, { env = process.env, publicKey, verifyManagedIdentity }) {
  if (env.ATHENA_MCP_AUTH_ONLY !== "true") throw Error("AUTH_ONLY_REQUIRED");
  if (env.ATHENA_MCP_PUBLISH_ENABLED !== "false" || env.ATHENA_MCP_APPROVAL_ENABLED !== "false") throw Error("WRITE_FLAGS_MUST_BE_FALSE");
  if (env.K_SERVICE !== "athenaapi") throw Error("RECEIVER_SERVICE");
  const i = await verifyManagedIdentity();
  if (i.email !== "217533514119-compute@developer.gserviceaccount.com" || !i.managed) throw Error("RECEIVER_IDENTITY");
  const { createPublicKey: createPublicKey2 } = await import("node:crypto");
  if (createHash("sha256").update(createPublicKey2(publicKey).export({ type: "spki", format: "der" })).digest("hex") !== env.ATHENA_APPROVAL_PUBLIC_KEY_SHA256) throw Error("KEY_PIN");
  const entry = createAuthOnlyReceiver({ verifyServiceIdentity: googleServiceVerifier("https://athenaapi-37efv4sd6a-rj.a.run.app"), verifyEvidence: approvalVerifier(publicKey, "athena-day4-v1") });
  mountCeoPilotBridge(app, entry, { enabled: true, publishEnabled: false });
}
export {
  createAuthOnlyReceiver,
  installAuthOnlyReceiver,
  referenceHash
};
