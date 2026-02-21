import { useState } from "react";

// ========== ハコビテ 料金設定 ==========
const FARE_CONFIG = {
  baseFare: 750,           // 初乗り運賃
  baseDistanceKm: 1.5,     // 初乗り距離
  addFare: 80,             // 加算運賃
  addUnitKm: 0.25,         // 加算距離単位
  fukushiVehicle: 1000,    // 福祉車両基本料
  bodyCare: 500,           // 身体介護料
  wheelchairNormal: 500,   // 普通型レンタル（1泊あたり）
  wheelchairReclining: 700,// リクライニングレンタル（1泊あたり）
};

function calcMeterFare(km) {
  if (km <= FARE_CONFIG.baseDistanceKm) return FARE_CONFIG.baseFare;
  const excessDistance = km - FARE_CONFIG.baseDistanceKm;
  const additionalUnits = Math.ceil(excessDistance / FARE_CONFIG.addUnitKm);
  return FARE_CONFIG.baseFare + additionalUnits * FARE_CONFIG.addFare;
}

function calculateTotalBill({ totalKm, includeBodyCare, wheelchairType, nights }) {
  const meter = calcMeterFare(totalKm);
  const bodyCareFee = includeBodyCare ? FARE_CONFIG.bodyCare : 0;
  const stayNights = parseInt(nights) || 0;
  let wheelchairFee = 0;
  if (stayNights >= 1) {
    if (wheelchairType === "normal") wheelchairFee = FARE_CONFIG.wheelchairNormal * stayNights;
    else if (wheelchairType === "reclining") wheelchairFee = FARE_CONFIG.wheelchairReclining * stayNights;
  }
  return {
    meter,
    fukushi: FARE_CONFIG.fukushiVehicle,
    body: bodyCareFee,
    wheelchair: wheelchairFee,
    total: meter + FARE_CONFIG.fukushiVehicle + bodyCareFee + wheelchairFee,
    nights: stayNights
  };
}

export default function HakobiteApp() {
  const [form, setForm] = useState({ origin: "", destination: "", approachKm: "", tripKm: "", includeBodyCare: false, wheelchairType: "none", nights: "0" });
  const [result, setResult] = useState(null);
  const currentTotalKm = (parseFloat(form.approachKm) || 0) + (parseFloat(form.tripKm) || 0);

  const handleCalculate = () => {
    if (currentTotalKm <= 0) return alert("走行距離を入力してください。");
    setResult(calculateTotalBill({ totalKm: currentTotalKm, includeBodyCare: form.includeBodyCare, wheelchairType: form.wheelchairType, nights: form.nights }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto" }}>
      <h1 style={{ color: "#0a5c84", textAlign: "center" }}>🚐 ハコビテ 料金計算</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <input placeholder="出発地" style={{ padding: "8px" }} value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} />
        <input placeholder="目的地" style={{ padding: "8px" }} value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
        <label>車庫〜迎車先 (km): <input type="number" value={form.approachKm} onChange={e => setForm({ ...form, approachKm: e.target.value })} /></label>
        <label>迎車先〜送り先 (km): <input type="number" value={form.tripKm} onChange={e => setForm({ ...form, tripKm: e.target.value })} /></label>
        <button onClick={handleCalculate} style={{ padding: "10px", background: "#1aaa6e", color: "white", border: "none", cursor: "pointer" }}>計算する</button>
      </div>
      {result && (
        <div style={{ border: "2px solid #1aaa6e", padding: "15px", borderRadius: "10px" }}>
          <h3>見積合計: ¥{result.total.toLocaleString()}</h3>
          <p>（運賃: ¥{result.meter.toLocaleString()} / 車両料: ¥1,000）</p>
        </div>
      )}
    </div>
  );
}