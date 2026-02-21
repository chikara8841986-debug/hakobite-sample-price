import { useState } from "react";

const FARE_CONFIG = {
  baseFare: 750, welfareFee: 1000, careFee: 500,
  meterFare: 80, meterDistance: 0.250,
  nightSurcharge: 1.2, wheelchair: { normal: 500, reclining: 700 }
};

export default function TaxiFareCalculator() {
  const [tripKm, setTripKm] = useState("");
  const [isNight, setIsNight] = useState(false);
  const [needsCare, setNeedsCare] = useState(false);
  const [wheelchairType, setWheelchairType] = useState("none");
  const [nights, setNights] = useState("0");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const dist = parseFloat(tripKm) || 0;
    if (dist <= 0) return alert("走行距離を入力してください。");
    const units = Math.ceil(dist / FARE_CONFIG.meterDistance);
    let meter = FARE_CONFIG.baseFare + (units * FARE_CONFIG.meterFare);
    if (isNight) meter = Math.ceil(meter * FARE_CONFIG.nightSurcharge / 10) * 10;
    const body = needsCare ? FARE_CONFIG.careFee : 0;
    const n = parseInt(nights) || 0;
    let wc = 0;
    if (n >= 1) {
      if (wheelchairType === "normal") wc = FARE_CONFIG.wheelchair.normal * n;
      if (wheelchairType === "reclining") wc = FARE_CONFIG.wheelchair.reclining * n;
    }
    setResult({ meter, fukushi: FARE_CONFIG.welfareFee, body, wc, total: meter + FARE_CONFIG.welfareFee + body + wc, dist, n });
  };

  const C = {
    green: "#5b8c3e", greenLight: "#6fa34a", greenBg: "#eef5e6",
    orange: "#e88634", orangeBg: "#fef5eb", cream: "#faf7f2",
    cardBg: "#ffffff", border: "#e5ddd2", text: "#333333"
  };

  const base = { boxSizing: "border-box" };
  const inputStyle = { ...base, width: "100%", padding: "12px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "16px", fontWeight: "bold" };

  return (
    <div style={{ ...base, minHeight: "100vh", background: C.cream, fontFamily: "sans-serif", color: C.text, width: "100%", margin: 0, padding: 0 }}>
      {/* ViteのデフォルトCSSを無効化する強制リセット */}
      <style>{`
        body, html, #root { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 100% !important; 
          max-width: none !important;
          display: block !important;
        }
      `}</style>

      <div style={{ ...base, background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, padding: "24px 16px", textAlign: "center", color: "#fff", width: "100%" }}>
        <h1 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <span>🚕</span> ハコビテ 料金試算
        </h1>
      </div>

      {/* スマホで横幅いっぱいに、PCでは中央に寄せる設定 */}
      <div style={{ ...base, maxWidth: "600px", width: "100%", margin: "0 auto", padding: "16px" }}>
        <div style={{ ...base, background: C.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${C.border}`, marginBottom: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "8px" }}>📍 走行距離 (km)</label>
          <input type="number" step="0.1" value={tripKm} onChange={e => setTripKm(e.target.value)} style={inputStyle} placeholder="例: 4.5" />
        </div>

        <div style={{ ...base, background: C.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${C.border}`, marginBottom: "16px" }}>
          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "12px" }}>⚙ オプション</div>
          <div onClick={() => setNeedsCare(!needsCare)} style={{ ...itemStyle, background: needsCare ? C.orangeBg : C.cream, border: `1px solid ${needsCare ? C.orange : C.border}` }}>
            <span>🤝 身体介護 (+¥500)</span>
            <div style={{ ...toggle, background: needsCare ? C.orange : "#ccc" }} />
          </div>
          <div onClick={() => setIsNight(!isNight)} style={{ ...itemStyle, background: isNight ? "#f3eff8" : C.cream, border: `1px solid ${isNight ? "#7b5ea7" : C.border}` }}>
            <span>🌙 深夜割増 (22時〜5時)</span>
            <div style={{ ...toggle, background: isNight ? "#7b5ea7" : "#ccc" }} />
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>🦽 車椅子レンタル</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["none", "normal", "reclining"].map(t => (
                <button key={t} onClick={() => setWheelchairType(t)} style={{ ...btn, background: wheelchairType === t ? C.greenBg : "#fff", borderColor: wheelchairType === t ? C.green : C.border, color: wheelchairType === t ? C.green : C.text }}>
                  {t === "none" ? "なし" : t === "normal" ? "普通型" : "リクライニング"}
                </button>
              ))}
            </div>
            {wheelchairType !== "none" && (
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "11px", color: "#666", display: "block", marginBottom: "4px" }}>レンタル泊数</label>
                <input type="number" value={nights} onChange={e => setNights(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>
        </div>

        <button onClick={calculate} style={{ ...base, width: "100%", padding: "16px", background: C.green, color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(91,140,62,0.2)" }}>料金を計算する</button>

        {result && (
          <div style={{ ...base, marginTop: "20px", background: C.greenBg, borderRadius: "12px", padding: "20px", border: `1px solid ${C.green}30` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#666" }}>概算合計料金</div>
              <div style={{ fontSize: "36px", fontWeight: "bold", color: C.green, margin: "4px 0" }}>¥{result.total.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: "14px", marginTop: "12px", borderTop: "1px solid #ccc", paddingTop: "12px" }}>
              <div style={row}><span>メーター運賃 ({result.dist}km)</span> <span>¥{result.meter.toLocaleString()}</span></div>
              <div style={row}><span>福祉車両基本料</span> <span>¥{result.fukushi.toLocaleString()}</span></div>
              {result.body > 0 && <div style={row}><span>身体介護料</span> <span>¥{result.body.toLocaleString()}</span></div>}
              {result.wc > 0 && <div style={row}><span>車椅子レンタル ({result.n}泊)</span> <span>¥{result.wc.toLocaleString()}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const itemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderRadius: "8px", cursor: "pointer", marginBottom: "8px", fontSize: "14px", boxSizing: "border-box" };
const toggle = { width: "36px", height: "18px", borderRadius: "9px", transition: "0.3s" };
const btn = { flex: 1, padding: "10px 4px", border: "1px solid", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", boxSizing: "border-box" };
const row = { display: "flex", justifyContent: "space-between", marginBottom: "8px" };
