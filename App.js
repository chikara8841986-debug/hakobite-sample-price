import { useState, useRef } from "react";

// 福祉タクシー運賃設定
const FARE_CONFIG = {
  baseFare: 750,
  meterFare: 80,
  meterDistance: 0.250,
  welfareFee: 1000,
  careFee: 500,
  nightSurcharge: 1.2,
  wheelchair: { normal: 500, reclining: 700 }
};

function calculateFare(distanceKm, options = {}) {
  if (distanceKm <= 0) return null;
  const { isNight = false, needsCare = false, wheelchairType = "none" } = options;
  let meterFare = FARE_CONFIG.baseFare;
  const units = Math.ceil(distanceKm / FARE_CONFIG.meterDistance);
  meterFare += units * FARE_CONFIG.meterFare;
  if (isNight) {
    meterFare = Math.ceil(meterFare * FARE_CONFIG.nightSurcharge / 10) * 10;
  }
  const welfareFee = FARE_CONFIG.welfareFee;
  const careFee = needsCare ? FARE_CONFIG.careFee : 0;
  let wheelchairFee = 0;
  if (wheelchairType === "normal") wheelchairFee = FARE_CONFIG.wheelchair.normal;
  if (wheelchairType === "reclining") wheelchairFee = FARE_CONFIG.wheelchair.reclining;
  const total = meterFare + welfareFee + careFee + wheelchairFee;
  return { meterFare, welfareFee, careFee, wheelchairFee, total };
}

export default function TaxiFareCalculator() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [isNight, setIsNight] = useState(false);
  const [needsCare, setNeedsCare] = useState(false);
  const [wheelchairType, setWheelchairType] = useState("none");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const handleCalculate = async () => {
    if (!pickup.trim() || !destination.trim()) {
      setError("迎車先と目的地の両方を入力してください。");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `あなたは香川県の地理に詳しい距離推定エキスパートです。
以下の2地点間の自動車での走行距離（片道）をkm単位で推定してください。

迎車先（出発地）: ${pickup.trim()}
目的地: ${destination.trim()}

【重要なルール】
1. 両地点とも香川県内である必要があります。どちらかが香川県外の場合は、JSONの"error"フィールドに「香川県外の地点が含まれています。香川県内の地点を指定してください。」と返してください。
2. 地点名が曖昧・不明な場合は、香川県内で最も妥当と思われる場所を推測してください。それでも特定できない場合は"error"フィールドにその旨を返してください。
3. 距離は自動車の一般的なルート（高速道路を使わない一般道）で推定してください。

以下のJSON形式のみで回答してください（他のテキストは不要）:
{
  "distance_km": 数値（小数点1桁）,
  "pickup_resolved": "推定した出発地の正式名称",
  "destination_resolved": "推定した目的地の正式名称",
  "route_note": "ルートに関する簡単な補足（任意）",
  "error": null
}`
          }]
        }),
        signal: controller.signal
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.error) {
        setError(parsed.error);
      } else {
        const dist = parseFloat(parsed.distance_km);
        const opts = { isNight, needsCare, wheelchairType };
        const fare = calculateFare(dist, opts);
        const fareLow = calculateFare(Math.max(0.1, dist * 0.85), opts);
        const fareHigh = calculateFare(dist * 1.15, opts);
        setResult({
          distance: dist, fare, fareLow, fareHigh,
          pickupResolved: parsed.pickup_resolved,
          destinationResolved: parsed.destination_resolved,
          routeNote: parsed.route_note
        });
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError("距離の推定中にエラーが発生しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  const C = {
    green: "#5b8c3e",
    greenLight: "#6fa34a",
    greenBg: "#eef5e6",
    orange: "#e88634",
    orangeLight: "#f5a623",
    orangeBg: "#fef5eb",
    cream: "#faf7f2",
    warmWhite: "#fffdf9",
    cardBg: "#ffffff",
    border: "#e5ddd2",
    borderLight: "#f0ebe3",
    text: "#3d3529",
    textMid: "#6b5e4f",
    textLight: "#8a7d6e",
    red: "#c0392b",
    redBg: "#fdecea",
    purple: "#7b5ea7",
    purpleBg: "#f3eff8"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.cream} 0%, #f5f0e8 100%)`,
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
      color: C.text, padding: 0
    }}>
      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
        padding: "24px 20px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          opacity: 0.5
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "13px", color: "rgba(255,255,255,0.85)",
            marginBottom: "6px", letterSpacing: "0.15em"
          }}>♿ 福祉タクシー</div>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, margin: 0,
            color: "#fff", letterSpacing: "0.08em",
            textShadow: "0 1px 3px rgba(0,0,0,0.15)"
          }}>ハコビテ　料金試算フォーム</h1>
        </div>
      </div>

      {/* Notice bar */}
      <div style={{
        background: C.orangeBg,
        borderBottom: `1px solid ${C.border}`,
        padding: "10px 20px",
        textAlign: "center",
        fontSize: "12px",
        color: C.orange,
        fontWeight: 600
      }}>
        ⚠ 本フォームの料金はAIによる距離推定に基づく概算です。実際の料金とは異なる場合があります。
      </div>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* Input Card */}
        <div style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "24px 20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(107,94,79,0.06)"
        }}>
          <div style={{
            fontSize: "14px", fontWeight: 700, color: C.green,
            marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{
              width: "24px", height: "24px", borderRadius: "6px",
              background: C.greenBg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "13px"
            }}>📍</span>
            乗降地点の入力
          </div>

          {/* Pickup */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 600, color: C.textMid,
              marginBottom: "6px"
            }}>
              <span style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: C.green, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 800
              }}>A</span>
              迎車先（乗車地点）
            </label>
            <input
              type="text" value={pickup} onChange={e => setPickup(e.target.value)}
              placeholder="例：高松駅、丸亀市役所、琴平町の金刀比羅宮"
              style={{
                width: "100%", padding: "12px 14px",
                background: C.cream, border: `1px solid ${C.border}`,
                borderRadius: "8px", color: C.text,
                fontSize: "15px", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = `0 0 0 3px ${C.greenBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Connector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 0 0 9px", margin: "2px 0" }}>
            <div style={{
              width: "2px", height: "20px",
              background: `linear-gradient(to bottom, ${C.green}, ${C.orange})`,
              borderRadius: "1px"
            }} />
            <span style={{ fontSize: "11px", color: C.textLight }}>▼</span>
          </div>

          {/* Destination */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 600, color: C.textMid,
              marginBottom: "6px"
            }}>
              <span style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: C.orange, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 800
              }}>B</span>
              目的地
            </label>
            <input
              type="text" value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="例：栗林公園、坂出IC付近、屋島"
              style={{
                width: "100%", padding: "12px 14px",
                background: C.cream, border: `1px solid ${C.border}`,
                borderRadius: "8px", color: C.text,
                fontSize: "15px", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = C.orange; e.target.style.boxShadow = `0 0 0 3px ${C.orangeBg}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Options Card */}
        <div style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "24px 20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(107,94,79,0.06)"
        }}>
          <div style={{
            fontSize: "14px", fontWeight: 700, color: C.green,
            marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{
              width: "24px", height: "24px", borderRadius: "6px",
              background: C.greenBg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "13px"
            }}>⚙</span>
            オプション選択
          </div>

          {/* Care toggle */}
          <div
            onClick={() => setNeedsCare(!needsCare)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", marginBottom: "8px",
              background: needsCare ? C.orangeBg : C.cream,
              border: `1px solid ${needsCare ? C.orange + "60" : C.borderLight}`,
              borderRadius: "8px", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🤝</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>身体介護あり</div>
                <div style={{ fontSize: "11px", color: C.textLight, marginTop: "1px" }}>介助が必要な方（＋500円）</div>
              </div>
            </div>
            <div style={{
              width: "42px", height: "24px", borderRadius: "12px",
              background: needsCare ? C.orange : "#d1cbc2",
              position: "relative", transition: "background 0.3s", flexShrink: 0
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
                position: "absolute", top: "2px", left: needsCare ? "20px" : "2px",
                transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>

          {/* Night toggle */}
          <div
            onClick={() => setIsNight(!isNight)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", marginBottom: "16px",
              background: isNight ? C.purpleBg : C.cream,
              border: `1px solid ${isNight ? C.purple + "40" : C.borderLight}`,
              borderRadius: "8px", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🌙</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>深夜割増</div>
                <div style={{ fontSize: "11px", color: C.textLight, marginTop: "1px" }}>22:00〜5:00（メーター2割増）</div>
              </div>
            </div>
            <div style={{
              width: "42px", height: "24px", borderRadius: "12px",
              background: isNight ? C.purple : "#d1cbc2",
              position: "relative", transition: "background 0.3s", flexShrink: 0
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
                position: "absolute", top: "2px", left: isNight ? "20px" : "2px",
                transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>

          {/* Wheelchair */}
          <div style={{
            fontSize: "13px", fontWeight: 600, color: C.textMid,
            marginBottom: "10px"
          }}>
            🦽 車椅子レンタル（日をまたぐ場合）
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: "none", label: "なし", sub: "" },
              { value: "normal", label: "普通型", sub: "＋500円" },
              { value: "reclining", label: "リクライニング", sub: "＋700円" }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setWheelchairType(opt.value)}
                style={{
                  flex: 1, padding: "12px 6px",
                  background: wheelchairType === opt.value ? C.greenBg : C.cream,
                  border: `2px solid ${wheelchairType === opt.value ? C.green : C.borderLight}`,
                  borderRadius: "8px", cursor: "pointer",
                  transition: "all 0.2s", textAlign: "center"
                }}
              >
                <div style={{
                  fontSize: "13px", fontWeight: 600,
                  color: wheelchairType === opt.value ? C.green : C.textMid
                }}>{opt.label}</div>
                {opt.sub && <div style={{
                  fontSize: "10px", color: C.textLight, marginTop: "2px"
                }}>{opt.sub}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate} disabled={loading}
          style={{
            width: "100%", padding: "16px", marginBottom: "16px",
            background: loading ? "#c8c0b4" : `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            border: "none", borderRadius: "10px",
            color: "#fff", fontSize: "16px", fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            letterSpacing: "0.06em", transition: "all 0.3s",
            boxShadow: loading ? "none" : `0 4px 16px rgba(91,140,62,0.3)`
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{
                width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite", display: "inline-block"
              }} />
              距離を推定中...
            </span>
          ) : "🚕 料金を計算する"}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            padding: "14px 16px", marginBottom: "16px",
            background: C.redBg,
            border: `1px solid ${C.red}30`,
            borderRadius: "8px", fontSize: "13px", color: C.red,
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: "12px", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(107,94,79,0.1)",
            animation: "fadeIn 0.4s ease-out"
          }}>
            {/* Total Header */}
            <div style={{
              padding: "24px 20px 18px",
              background: `linear-gradient(135deg, ${C.greenBg}, #f0f7e8)`,
              borderBottom: `1px solid ${C.border}`,
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "12px", color: C.textLight,
                letterSpacing: "0.1em", marginBottom: "6px", fontWeight: 600
              }}>推定合計料金（片道）</div>
              <div style={{
                fontSize: "44px", fontWeight: 800,
                color: C.green, lineHeight: 1.1
              }}>
                ¥{result.fare.total.toLocaleString()}
              </div>
              <div style={{
                fontSize: "12px", color: C.textLight, marginTop: "6px",
                background: C.cream, display: "inline-block",
                padding: "3px 12px", borderRadius: "10px"
              }}>
                目安: ¥{result.fareLow.total.toLocaleString()} 〜 ¥{result.fareHigh.total.toLocaleString()}
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ padding: "18px 20px" }}>
              <div style={{
                fontSize: "12px", fontWeight: 700, color: C.textLight,
                letterSpacing: "0.06em", marginBottom: "10px"
              }}>📋 料金内訳</div>

              {[
                { label: `メーター運賃（${result.distance.toFixed(1)}km）`, value: result.fare.meterFare, color: C.green, bg: C.greenBg, note: isNight ? "深夜割増込" : null },
                { label: "福祉車両代", value: result.fare.welfareFee, color: C.orange, bg: C.orangeBg, note: null },
                ...(result.fare.careFee > 0 ? [{ label: "身体介護料", value: result.fare.careFee, color: "#c0392b", bg: "#fdecea", note: null }] : []),
                ...(result.fare.wheelchairFee > 0 ? [{ label: `車椅子レンタル（${wheelchairType === "reclining" ? "リクライニング" : "普通型"}）`, value: result.fare.wheelchairFee, color: C.purple, bg: C.purpleBg, note: "日またぎ" }] : [])
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", marginBottom: "6px",
                  background: item.bg, borderRadius: "8px",
                  borderLeft: `3px solid ${item.color}`
                }}>
                  <div>
                    <span style={{ fontSize: "13px", color: C.text }}>{item.label}</span>
                    {item.note && <span style={{ fontSize: "10px", color: C.textLight, marginLeft: "6px" }}>({item.note})</span>}
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: item.color }}>
                    ¥{item.value.toLocaleString()}
                  </span>
                </div>
              ))}

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 12px", marginTop: "8px",
                borderTop: `2px solid ${C.border}`
              }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>合計</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: C.green }}>
                  ¥{result.fare.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Route info */}
            <div style={{ padding: "0 20px 18px" }}>
              <div style={{
                padding: "12px 14px",
                background: C.cream, borderRadius: "8px",
                border: `1px solid ${C.borderLight}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "6px" }}>
                  <span style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: C.green, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "9px", color: "#fff", fontWeight: 800, flexShrink: 0
                  }}>A</span>
                  <span style={{ color: C.text }}>{result.pickupResolved}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <span style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: C.orange, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "9px", color: "#fff", fontWeight: 800, flexShrink: 0
                  }}>B</span>
                  <span style={{ color: C.text }}>{result.destinationResolved}</span>
                </div>
              </div>
              {result.routeNote && (
                <div style={{ fontSize: "12px", color: C.textMid, padding: "8px 4px 0", lineHeight: 1.6 }}>
                  💡 {result.routeNote}
                </div>
              )}
            </div>

            {/* Fare note footer */}
            <div style={{
              padding: "14px 20px",
              borderTop: `1px solid ${C.border}`,
              background: C.cream,
              fontSize: "11px", color: C.textMid, lineHeight: 1.8
            }}>
              <div>初乗り: {FARE_CONFIG.baseFare}円 ｜ 加算: {FARE_CONFIG.meterFare}円 / {FARE_CONFIG.meterDistance * 1000}m（全距離に適用）</div>
              <div>福祉車両代 {FARE_CONFIG.welfareFee.toLocaleString()}円 は基本料金に含まれます</div>
              {isNight && <div>深夜割増: メーター運賃に2割増（22:00〜5:00）</div>}
              <div style={{ marginTop: "4px", color: C.textLight }}>
                ※ 実際の料金は交通状況・ルートにより変動します。信号待ち等の時間加算は含みません。
              </div>
            </div>
          </div>
        )}

        {/* Page Footer */}
        <div style={{
          marginTop: "28px", textAlign: "center",
          fontSize: "12px", color: C.textMid, lineHeight: 2.0
        }}>
          <div>香川県内限定サービス ・ 迎車料金は含まれません</div>
          <div style={{ fontSize: "11px", color: C.textLight }}>ハコビテ — 移動と暮らしを、支える</div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #b5a99a; }
      `}</style>
    </div>
  );
}
