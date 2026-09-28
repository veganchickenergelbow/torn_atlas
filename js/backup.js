// Backup & restore — export/import save data as a restore link, a file, or a
// text code, so clearing Safari website data (or a full iCloud) doesn't erase
// progress. Progress lives only on this device; a backup link sent to
// yourself (email/chat/Notes) restores it anywhere without iCloud.
const BK_LASTKEY = "atlas-last-backup";
const BK_MAXLEN = 200 * 1024;
const GZIP_OK = typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

const Backup = (() => {
  let step = "main";
  let pendingClean = null, pendingRaw = null;

  function gather() {
    return {
      app: "torn-atlas", v: 1, exportedAt: new Date().toISOString(),
      data: {
        cats: loadCats(),
        found: [...loadFound()],
        prefs: {
          theme: localStorage.getItem("atlas-theme") || "",
          music: localStorage.getItem("atlas-music") || "",
          sfx: localStorage.getItem("atlas-sfx") || "",
        },
      },
    };
  }

  /* --- byte <-> base64url helpers --- */
  function bytesToB64url(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlToBytes(str) {
    let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function gzipCompress(bytes) {
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    const written = writer.write(bytes).then(() => writer.close());
    const [buf] = await Promise.all([new Response(cs.readable).arrayBuffer(), written]);
    return new Uint8Array(buf);
  }
  async function gzipDecompress(bytes) {
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(bytes).catch(() => {});
    writer.close().catch(() => {});
    const reader = ds.readable.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > BK_MAXLEN) { reader.cancel().catch(() => {}); throw new Error("That's too large to be a Torn Atlas backup."); }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  /* --- code encode/decode: TA1 = plain base64url JSON, TA2 = gzip'd --- */
  async function toCode(obj) {
    const json = JSON.stringify(obj);
    if (GZIP_OK) {
      try {
        const gz = await gzipCompress(new TextEncoder().encode(json));
        return "TA2:" + bytesToB64url(gz);
      } catch (e) { /* fall through to TA1 */ }
    }
    return "TA1:" + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function fromCode(str) {
    if (str.startsWith("TA2:")) {
      let json;
      try {
        const dec = await gzipDecompress(b64urlToBytes(str.slice(4)));
        json = new TextDecoder().decode(dec);
      } catch (e) { throw new Error("That doesn't look like a Torn Atlas backup."); }
      if (json.length > BK_MAXLEN) throw new Error("That's too large to be a Torn Atlas backup.");
      return JSON.parse(json);
    }
    let b64 = str.slice(4).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  }
  function extractCode(input) {
    input = (input || "").trim();
    if (!input) return "";
    const idx = input.indexOf("restore=");
    if (idx !== -1) {
      let rest = input.slice(idx + 8).split("&")[0].split("#")[0];
      try { rest = decodeURIComponent(rest); } catch (e) {}
      return rest.trim();
    }
    return input;
  }
  async function buildRestoreLink() {
    const code = await toCode(gather());
    return location.origin + location.pathname + "#restore=" + code;
  }

  function fileName() { return `torn-atlas-backup-${new Date().toISOString().slice(0, 10)}.json`; }
  function markBackedUp() {
    try { localStorage.setItem(BK_LASTKEY, JSON.stringify({ at: new Date().toISOString(), catCount: Cats.cats.length })); } catch (e) {}
  }
  function lastBackup() {
    try { return JSON.parse(localStorage.getItem(BK_LASTKEY) || "null"); } catch (e) { return null; }
  }
  function shouldNudge() {
    if (Cats.cats.length < 1) return false;
    const lb = lastBackup();
    if (!lb || !lb.at) return true;
    if ((Date.now() - new Date(lb.at).getTime()) / 864e5 > 7) return true;
    if (Cats.cats.length - (lb.catCount || 0) >= 3) return true;
    return false;
  }
  async function saveFile() {
    const obj = gather();
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const file = new File([blob], fileName(), { type: "application/json" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Torn Atlas backup" });
        markBackedUp();
        return true;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return false;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    markBackedUp();
    return true;
  }
  async function sendToMyself() {
    const link = await buildRestoreLink();
    const text = "Tap to restore your Torn Atlas progress (cats + atlas):";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Torn Atlas backup", text, url: link });
        markBackedUp();
        return { ok: true, mode: "share" };
      } catch (e) {
        if (e && e.name === "AbortError") return { ok: false, mode: "aborted" };
        // fall through to mailto on other share failures
      }
    }
    const body = text + "\n\n" + link;
    if (body.length <= 1800) {
      location.href = "mailto:?subject=" + encodeURIComponent("Torn Atlas backup") + "&body=" + encodeURIComponent(body);
      markBackedUp();
      return { ok: true, mode: "mailto" };
    }
    try {
      await navigator.clipboard.writeText(link);
      markBackedUp();
      return { ok: true, mode: "clipboard", link };
    } catch (e) {
      return { ok: false, mode: "manual", link };
    }
  }
  async function copyLink() {
    const link = await buildRestoreLink();
    try {
      await navigator.clipboard.writeText(link);
      markBackedUp();
      return { ok: true, link };
    } catch (e) {
      return { ok: false, link };
    }
  }

  /* --- validation of untrusted import data --- */
  function cleanStr(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }
  function cleanCats(arr) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const c of arr) {
      if (out.length >= 1000) break;
      if (!c || typeof c !== "object") continue;
      const cc = typeof c.cc === "string" ? c.cc.toUpperCase() : "";
      if (!WORLD[cc]) continue;
      out.push({
        id: cleanStr(c.id, 40) || cc + "-" + Date.now() + "-" + Math.floor(Math.random() * 1e4),
        cc,
        name: cleanStr(c.name, 40) || "Cat",
        breed: cleanStr(c.breed, 40) || "Alley Shorthair",
        rarity: ["common", "rare", "legendary"].includes(c.rarity) ? c.rarity : "common",
        level: Math.max(1, Math.min(3, Math.round(Number(c.level)) || 1)),
        foundAt: Number.isFinite(Number(c.foundAt)) ? Number(c.foundAt) : Date.now(),
      });
    }
    return out;
  }
  function cleanFound(arr) {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.filter((cc) => typeof cc === "string" && WORLD[cc.toUpperCase()]).map((cc) => cc.toUpperCase()))];
  }
  function cleanPrefs(p) {
    p = p || {};
    return {
      theme: ["light", "dark"].includes(p.theme) ? p.theme : "",
      music: ["on", "off"].includes(p.music) ? p.music : "",
      sfx: ["on", "off"].includes(p.sfx) ? p.sfx : "",
    };
  }
  async function validate(input) {
    let raw = input;
    if (typeof input === "string") {
      const s = input.trim();
      if (s.length > BK_MAXLEN) throw new Error("That's too large to be a Torn Atlas backup.");
      if (s.startsWith("TA1:") || s.startsWith("TA2:")) raw = await fromCode(s);
      else raw = JSON.parse(s);
    }
    if (!raw || raw.app !== "torn-atlas" || raw.v !== 1) throw new Error("That doesn't look like a Torn Atlas backup.");
    const d = raw.data || {};
    const catsBlock = d.cats || {};
    return {
      cats: cleanCats(catsBlock.cats),
      lifetimeCorrect: Math.max(0, Math.round(Number(catsBlock.lifetimeCorrect)) || 0),
      wondersSeen: Array.isArray(catsBlock.wondersSeen) ? catsBlock.wondersSeen.filter((k) => typeof k === "string").slice(0, 100) : [],
      found: cleanFound(d.found),
      prefs: cleanPrefs(d.prefs),
      exportedAt: cleanStr(raw.exportedAt, 40),
    };
  }
  function applyPrefs(p) {
    if (p.theme) { localStorage.setItem("atlas-theme", p.theme); document.documentElement.setAttribute("data-theme", p.theme); }
    if (p.music) localStorage.setItem("atlas-music", p.music);
    if (p.sfx) localStorage.setItem("atlas-sfx", p.sfx);
  }
  function afterRestore() {
    Cats.reload();
    MQ.found = loadFound();
    toast("Progress restored!");
    closeSheet();
    mqRender();
  }
  function merge(clean) {
    const state = loadCats();
    const byId = new Map(state.cats.map((c) => [c.id, c]));
    clean.cats.forEach((c) => {
      const ex = byId.get(c.id);
      if (ex) ex.level = Math.max(ex.level || 1, c.level || 1);
      else { state.cats.push(c); byId.set(c.id, c); }
    });
    state.lifetimeCorrect = Math.max(state.lifetimeCorrect, clean.lifetimeCorrect);
    state.wondersSeen = [...new Set([...state.wondersSeen, ...clean.wondersSeen])];
    saveCatsState(state);
    const found = loadFound();
    clean.found.forEach((cc) => found.add(cc));
    saveFound(found);
    applyPrefs(clean.prefs);
    afterRestore();
  }
  function replace(clean) {
    saveCatsState({ lifetimeCorrect: clean.lifetimeCorrect, cats: clean.cats, wondersSeen: clean.wondersSeen, milestonesReached: 0 });
    saveFound(new Set(clean.found));
    applyPrefs(clean.prefs);
    afterRestore();
  }

  function toast(msg) {
    const d = document.createElement("div");
    d.className = "ta-toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2400);
  }
  function closeSheet() {
    const $sheet = $("#sheet");
    $sheet.hidden = true;
    $sheet.innerHTML = "";
  }

  function open() {
    step = "main"; pendingClean = null; pendingRaw = null;
    render();
  }
  function openPreview(clean, raw) {
    pendingClean = clean; pendingRaw = raw;
    step = "preview"; render();
  }
  function openDamaged() {
    step = "damaged"; render();
  }

  function render() {
    const $sheet = $("#sheet");
    $sheet.hidden = false;
    if (step === "preview") return renderPreview($sheet);
    if (step === "damaged") return renderDamaged($sheet);
    const lb = lastBackup();
    const lbText = lb && lb.at ? new Date(lb.at).toLocaleDateString() : "Never";
    $sheet.innerHTML = `
      <div class="sheet backup-sheet">
        <div class="sheet-top"><button class="icon-btn" id="bk-close">✕</button></div>
        <h2>Backup &amp; restore</h2>
        <p class="muted">Progress lives only on this device. A backup link in your email or chats restores it on your phone or laptop — even if Safari data is cleared.</p>
        <p class="eyebrow">Last backed up</p>
        <p>${esc(lbText)}</p>
        <div class="btn-col">
          <button class="btn" id="bk-send-self">Send to myself (recommended)</button>
          <button class="btn ghost" id="bk-save-file">Save backup file</button>
          <p class="muted small">On iPhone choose Files → On My iPhone — no iCloud needed.</p>
          <button class="btn ghost" id="bk-copy-link">Copy restore link</button>
        </div>
        <textarea id="bk-code-out" class="bk-code-area" readonly hidden></textarea>
        <p class="eyebrow" style="margin-top:8px">Restore</p>
        <input type="file" id="bk-file-input" accept=".json,application/json">
        <p class="muted" style="margin:6px 0 0">or paste a restore link or save code</p>
        <textarea id="bk-code-in" class="bk-code-area" placeholder="https://...#restore=TA2:... or TA1:..."></textarea>
        <button class="btn ghost" id="bk-restore-go">Restore</button>
        <p id="bk-msg" class="muted"></p>
      </div>`;
    $("#bk-close").onclick = closeSheet;
    $("#bk-send-self").onclick = async () => {
      const r = await sendToMyself();
      if (r.mode === "clipboard") toast("Couldn't open sharing — link copied instead!");
      else if (r.mode === "manual" && r.link) {
        const ta = $("#bk-code-out");
        ta.value = r.link; ta.hidden = false; ta.select();
        $("#bk-msg").textContent = "Couldn't share or copy — select and copy the link above.";
      }
      render();
    };
    $("#bk-save-file").onclick = async () => { await saveFile(); render(); };
    $("#bk-copy-link").onclick = async () => {
      const r = await copyLink();
      if (r.ok) toast("Restore link copied!");
      else {
        const ta = $("#bk-code-out");
        ta.value = r.link; ta.hidden = false; ta.select();
        $("#bk-msg").textContent = "Couldn't copy automatically — select and copy the link above.";
      }
      render();
    };
    $("#bk-file-input").onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > BK_MAXLEN) { $("#bk-msg").textContent = "That file is too large to be a Torn Atlas backup."; return; }
      try {
        const text = await f.text();
        const clean = await validate(text);
        openPreview(clean, text);
      } catch (err) { $("#bk-msg").textContent = "Couldn't read that file: " + err.message; }
    };
    $("#bk-restore-go").onclick = async () => {
      const input = extractCode($("#bk-code-in").value);
      if (!input) { $("#bk-msg").textContent = "Paste a restore link or save code first."; return; }
      try {
        const clean = await validate(input);
        openPreview(clean, input);
      } catch (err) { $("#bk-msg").textContent = err.message; }
    };
  }
  function renderPreview($sheet) {
    const c = pendingClean;
    const dateTxt = c.exportedAt ? new Date(c.exportedAt).toLocaleDateString() : "an unknown date";
    $sheet.innerHTML = `
      <div class="sheet backup-sheet">
        <div class="sheet-top"><button class="icon-btn" id="bk-close">✕</button></div>
        <h2>Restore preview</h2>
        <p>${c.cats.length} cats · ${c.found.length} countries · backed up ${esc(dateTxt)}</p>
        <div class="btn-row">
          <button class="btn" id="bk-merge">Merge (recommended)</button>
          <button class="btn ghost" id="bk-replace">Replace</button>
          <button class="btn ghost" id="bk-cancel">Cancel</button>
        </div>
      </div>`;
    $("#bk-close").onclick = closeSheet;
    $("#bk-cancel").onclick = () => { step = "main"; render(); };
    $("#bk-merge").onclick = () => merge(c);
    $("#bk-replace").onclick = () => {
      if (confirm("Replace all current progress with this backup? This can't be undone.")) replace(c);
    };
  }
  function renderDamaged($sheet) {
    $sheet.innerHTML = `
      <div class="sheet backup-sheet">
        <div class="sheet-top"><button class="icon-btn" id="bk-close">✕</button></div>
        <h2>Restore link</h2>
        <p>This backup link is damaged or incomplete.</p>
        <div class="btn-row"><button class="btn ghost" id="bk-ok">OK</button></div>
      </div>`;
    $("#bk-close").onclick = closeSheet;
    $("#bk-ok").onclick = closeSheet;
  }

  /* --- restore-link on load: never auto-applies, always previews first --- */
  async function checkRestoreHash() {
    const hash = location.hash || "";
    if (!hash.includes("restore=")) return;
    const code = extractCode(hash);
    history.replaceState(null, "", location.pathname + location.search);
    if (!code) return;
    try {
      const clean = await validate(code);
      openPreview(clean, code);
    } catch (e) {
      openDamaged();
    }
  }
  checkRestoreHash();

  return { open, saveFile, shouldNudge, gather, toCode, validate };
})();
