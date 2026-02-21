import { useState } from "react";

// 福祉タクシー運賃設定
const FARE_CONFIG = {
  baseFare: 750,          // 初乗り運賃（固定）
  meterFare: 80,          // 加算運賃
  meterDistance: 0.250,   // 加算距離単位（250m）
  welfareFee: 1000,       // 福祉車両基本料
  careFee: 500,           // 身体介護料
  nightSurcharge: 1.2,    // 深夜割増
  wheelchair: { normal: 500, reclining: 700 }
};

function calculateFare(distanceKm, options = {}) {
  if (distanceKm <= 0) return null;
  const { isNight = false, needsCare = false, wheelchairType = "none", nights = 0 } = options;
  
  // メーター運賃計算（1.5kmの差し引きをせず、0kmから加算運賃を計算）
  const units = Math.ceil(distanceKm / FARE_CONFIG.meterDistance);
  let meterFare = FARE_CONFIG.baseFare + (units * FARE_CONFIG.meterFare);
  
  if (isNight) {
    meterFare = Math.ceil(meterFare * FARE_CONFIG.nightSurcharge / 10) * 10;
  }
  
  const welfareFee = FARE_CONFIG.welfareFee;
  const careFee = needsCare ? FARE_CONFIG.careFee : 0;
  
  let wheelchairFee = 0;
  const stayNights = parseInt(nights) || 0;
  if (stayNights >= 1) {
    if (wheelchairType === "normal") wheelchairFee = FARE_CONFIG.wheelchair.normal * stayNights;
    if (wheelchairType === "reclining") wheelchairFee = FARE_CONFIG.wheelchair.reclining * stayNights;
  }
  
  const total = meterFare + welfareFee + careFee + wheelchairFee;
  return { meterFare, welfareFee, careFee, wheelchairFee, total, stayNights };
}

export default function TaxiFareCalculator() {
  const [tripKm, setTripKm] = useState("");
  const [isNight, setIsNight] = useState(false);
  const [needsCare, setNeedsCare] = useState(false);
  const [wheelchairType, setWheelchairType] = useState("none");
  const [nights, setNights] = useState("0");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const totalDist = parseFloat(tripKm) || 0;
    if (totalDist <= 0) {
      alert("走行距離を入力してください。");
      return;
    }
    const res = calculateFare(totalDist, { isNight, needsCare, wheelchairType, nights });
    setResult({ ...res, distance: totalDist });
  };

  const C = {
    green: "#5b8c3e", greenLight: "#6fa34a", greenBg: "#eef5e6",
    orange: "#e88634", orangeLight: "#f5a623", orangeBg: "#fef5eb",
    cream: "#faf7f2", cardBg: "#ffffff", border: "#e5ddd2",
    text: "#3d3529", textMid: "#6b5e4f", textLight: "#8a7d6e",
    purple: "#7b5ea7", purpleBg: "#f3eff8"
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${C.cream} 0%, #f5f0e8 100%)`, fontFamily: "sans-serif", color: C.text, padding: 0 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, padding: "24px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#fff", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "26px" }}>🚕</span> ハコビテ 料金試算
        </h1>
      </div>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px 20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.green, marginBottom: "16px" }}>📍 走行距離の入力 (km)</div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", color: C.textMid, display: "block", marginBottom: "4px" }}>迎車先 〜 送り先</label>
            <input type="number" step="0.1" value={tripKm} onChange={e => setTripKm(e.target.value)} style={inputStyle(C)} placeholder="0.0" />
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px 20px", marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.green, marginBottom: "16px" }}>⚙ オプション選択</div>
          <div onClick={() => setNeedsCare(!needsCare)} style={toggleStyle(needsCare, C.orange, C.orangeBg, C)}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>🤝 身体介護あり (+¥500)</div>
            <div style={switchStyle(needsCare, C.orange)}></div>
          </div>
          <div onClick={() => setIsNight(!isNight)} style={toggleStyle(isNight, C.purple, C.purpleBg, C)}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>🌙 深夜割増 (22時〜5時)</div>
            <div style={switchStyle(isNight, C.purple)}></div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.textMid, marginBottom: "8px" }}>🦽 車椅子レンタル</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["none", "normal", "reclining"].map(type => (
                <button key={type} onClick={() => setWheelchairType(type)} style={btnOptStyle(wheelchairType === type, C)}>
                  {type === "none" ? "なし" : type === "normal" ? "普通型" : "リクライニング"}
                </button>
              ))}
            </div>
            {wheelchairType !== "none" && (
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "11px", color: C.textLight, display: "block", marginBottom: "4px" }}>レンタル泊数</label>
                <input type="number" value={nights} onChange={e => setNights(e.target.value)} style={inputStyle(C)} placeholder="泊数" />
              </div>
            )}
          </div>
        </div>

        <button onClick={handleCalculate} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, border: "none", borderRadius: "10px", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px rgba(91,140,62,0.3)` }}>
          🚕 料金を計算する
        </button>

        {result && (
          <div style={{ marginTop: "20px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "24px", background: C.greenBg, textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: C.textLight }}>概算合計料金</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: C.green }}>¥{result.total.toLocaleString()}</div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={rowStyle}><span>メーター運賃 ({result.distance.toFixed(1)}km)</span> <span>¥{result.meterFare.toLocaleString()}</span></div>
              <div style={rowStyle}><span>福祉車両基本料</span> <span>¥{result.welfareFee.toLocaleString()}</span></div>
              {result.careFee > 0 && <div style={rowStyle}><span>身体介護料</span> <span>¥{result.careFee.toLocaleString()}</span></div>}
              {result.wheelchairFee > 0 && <div style={rowStyle}><span>車椅子 ({result.stayNights}泊)</span> <span>¥{result.wheelchairFee.toLocaleString()}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = (C) => ({ width: "100%", padding: "12px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: "8px", boxSizing: "border-box", color: C.text, fontSize: "16px" });
const toggleStyle = (active, color, bg, C) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", marginBottom: "8px", background: active ? bg : C.cream, border: `1px solid ${active ? color : C.border}`, borderRadius: "8px", cursor: "pointer" });
const switchStyle = (active, color) => ({ width: "40px", height: "20px", background: active ? color : "#ccc", borderRadius: "10px", position: "relative" });
const btnOptStyle = (active, C) => ({ flex: 1, padding: "10px", background: active ? C.greenBg : C.cream, border: `2px solid ${active ? C.green : C.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: active ? C.green : C.textMid });
const rowStyle = { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" };
