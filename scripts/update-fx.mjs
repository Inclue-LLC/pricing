// Fetch today's TTM (公表仲値) for USD and CNY from MUFG Bank's published rate table
// and store it in Firestore at settings/fx, which the calculator reads as the latest rate.
// TTM = (TTS + TTB) / 2. Run by .github/workflows/fx-rate.yml on weekdays after publication.
import { readFileSync } from "node:fs";

const SOURCE = "https://www.murc-kawasesouba.jp/fx/index.php";
const LIMITS = { USD: [80, 250], CNY: [10, 40] };

function firebaseConfig() {
  const js = readFileSync(new URL("../public/firebase-config.js", import.meta.url), "utf8");
  const get = k => (js.match(new RegExp(`${k}:\\s*"([^"]+)"`)) || [])[1];
  const cfg = { apiKey: get("apiKey"), projectId: get("projectId") };
  if (!cfg.apiKey || !cfg.projectId) throw new Error("public/firebase-config.js に apiKey / projectId がありません");
  return cfg;
}

async function fetchPage() {
  const res = await fetch(SOURCE, { headers: { "User-Agent": "Mozilla/5.0 (rate fetcher)" } });
  if (!res.ok) throw new Error(`為替相場ページの取得に失敗しました: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
  const charset = ((res.headers.get("content-type") || "").match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1] || "utf-8";
  return new TextDecoder(/shift|sjis/i.test(charset) ? "shift_jis" : charset).decode(buf);
}

const cellText = html => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function parseRates(html) {
  const rows = html.split(/<\/tr>/i).map(r => (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(cellText));
  const out = {};
  for (const code of Object.keys(LIMITS)) {
    const row = rows.find(cells => cells.some(c => c === code));
    if (!row) throw new Error(`${code} の行が見つかりません`);
    const nums = row.slice(row.indexOf(code) + 1).map(c => parseFloat(c.replace(/,/g, ""))).filter(Number.isFinite);
    if (nums.length < 2) throw new Error(`${code} の TTS/TTB が読み取れません: ${row.join(" | ")}`);
    const [tts, ttb] = nums;
    const ttm = Math.round(((tts + ttb) / 2) * 100) / 100;
    const [lo, hi] = LIMITS[code];
    if (!(ttm > lo && ttm < hi)) throw new Error(`${code} の値が想定外です: TTS ${tts} / TTB ${ttb}`);
    out[code] = ttm;
  }
  const d = cellText(html).match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  out.date = d ? `${d[1]}-${d[2].padStart(2, "0")}-${d[3].padStart(2, "0")}` : new Date().toISOString().slice(0, 10);
  return out;
}

async function save({ apiKey, projectId }, r) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/fx?key=${apiKey}`;
  const body = {
    fields: {
      CNY: { doubleValue: r.CNY },
      USD: { doubleValue: r.USD },
      updatedAt: { stringValue: r.date },
      note: { stringValue: "TTM（三菱UFJ銀行）" },
      fetchedAt: { stringValue: new Date().toISOString() }
    }
  };
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Firestore への保存に失敗しました: HTTP ${res.status} ${await res.text()}`);
}

const rates = parseRates(await fetchPage());
await save(firebaseConfig(), rates);
console.log(`saved TTM ${rates.date}: USD ${rates.USD} / CNY ${rates.CNY}`);
