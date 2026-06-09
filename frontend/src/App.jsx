import { useState, useEffect } from "react"
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"
import axios from "axios"

const API = "http://localhost:8000"
const CDN = "https://community.cloudflare.steamstatic.com/economy/image"

// CS2 rarity tier palette, keyed by skin category
const RARITY = {
  knife:     "#e4ae39",
  gloves:    "#e4ae39",
  rifle:     "#eb4b4b",
  pistol:    "#8847ff",
  smg:       "#4b69ff",
  heavy:     "#4b69ff",
  case:      "#5e98d9",
  container: "#5e98d9",
  sticker:   "#b0c3d9",
  agent:     "#d32ce6",
  patch:     "#b0c3d9",
  pin:       "#4b69ff",
  charm:     "#8847ff",
  graffiti:  "#b0c3d9",
  music_kit: "#5e98d9",
}
const rc = cat => RARITY[cat] ?? "#b0c3d9"

// Color tokens
const C = {
  bg:      "#0a0b0e",
  surface: "#111318",
  panel:   "#161920",
  border:  "#1d2133",
  text:    "#c4c9d4",
  muted:   "#48526a",
  gold:    "#e4ae39",
  buy:     "#3ddc84",
  sell:    "#ef4444",
}

export default function App() {
  // ── state (unchanged) ──
  const [skins, setSkins] = useState([])
  const [selectedSkin, setSelectedSkin] = useState(null)
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState("")
  const [signal, setSignal] = useState(null)
  const [view, setView] = useState("browse")
  const [allSignals, setAllSignals] = useState([])
  const [signalsLoading, setSignalsLoading] = useState(false)

  // ── effects (unchanged logic) ──
  useEffect(() => {
    axios.get(`${API}/skins`).then(res => setSkins(res.data))
  }, [])

  useEffect(() => {
    if (selectedSkin) {
      axios.get(`${API}/skins/${selectedSkin.id}/history`).then(res => {
        setHistory(res.data.map(h => ({
          ...h,
          date: new Date(h.recorded_at).toLocaleDateString(),
          price: h.price,
        })))
      }).catch(err => { console.error("History fetch failed:", err); setHistory([]) })

      axios.get(`${API}/skins/${selectedSkin.id}/signal`).then(res => {
        setSignal(res.data)
      }).catch(err => { console.error("Signal fetch failed:", err); setSignal(null) })
    }
  }, [selectedSkin])

  useEffect(() => {
    if (view === "signals") {
      setSignalsLoading(true)
      axios.get(`${API}/signals`).then(res => {
        setAllSignals(res.data)
        setSignalsLoading(false)
      }).catch(err => {
        console.error("Signals fetch failed:", err)
        setAllSignals([])
        setSignalsLoading(false)
      })
    }
  }, [view])

  const filtered = skins.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: C.bg,
      color: C.text,
      overflow: "hidden",
    }}>
      <div className="noise-overlay" aria-hidden="true" />

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: "280px",
        flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        background: C.surface,
        zIndex: 1,
      }}>

        {/* Logo strip */}
        <div style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: `linear-gradient(135deg, ${C.panel} 0%, ${C.surface} 100%)`,
        }}>
          <div style={{ width: "3px", height: "20px", background: C.gold, flexShrink: 0 }} />
          <span style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: C.gold,
            textTransform: "uppercase",
          }}>CS2 Market Analyzer</span>
        </div>

        {/* Browse / Signals toggle */}
        <div style={{
          display: "flex",
          padding: "10px",
          gap: "6px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          {["browse", "signals"].map(v => (
            <button
              key={v}
              className="toggle-btn"
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: "7px 0",
                border: `1px solid ${view === v ? C.gold : C.border}`,
                borderRadius: 0,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: view === v ? "rgba(228,174,57,0.1)" : "transparent",
                color: view === v ? C.gold : C.muted,
              }}
            >{v}</button>
          ))}
        </div>

        {view === "browse" && (
          <>
            <div style={{ padding: "10px" }}>
              <input
                placeholder="SEARCH SKINS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 0,
                  color: C.text,
                  boxSizing: "border-box",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                }}
              />
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.slice(0, 100).map(skin => {
                const sel = selectedSkin?.id === skin.id
                const color = rc(skin.category)
                return (
                  <div
                    key={skin.id}
                    className="skin-row"
                    onClick={() => setSelectedSkin(skin)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px 6px 0",
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${sel ? color : "transparent"}`,
                      background: sel ? `${color}14` : "transparent",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* One-shot glint when row becomes selected */}
                    {sel && <span key={`g${skin.id}`} className="glint-active" />}

                    {/* Thumbnail */}
                    <div style={{
                      width: "36px",
                      height: "36px",
                      flexShrink: 0,
                      marginLeft: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {skin.icon_url
                        ? <img
                            src={`${CDN}/${skin.icon_url}`}
                            alt=""
                            style={{ width: "36px", height: "36px", objectFit: "contain" }}
                          />
                        : <div style={{
                            width: "26px",
                            height: "26px",
                            background: `${color}18`,
                            border: `1px solid ${color}38`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <div style={{ width: "8px", height: "8px", background: color, opacity: 0.55 }} />
                          </div>
                      }
                    </div>

                    {/* Skin name */}
                    <span style={{
                      flex: 1,
                      fontSize: "12px",
                      fontWeight: sel ? 600 : 400,
                      color: sel ? C.text : "#7a8599",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {skin.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {view === "signals" && (
          <div style={{
            padding: "12px 16px",
            color: C.muted,
            fontSize: "11px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.6,
          }}>
            Skins flagged via<br />z-score anomaly detection
          </div>
        )}
      </aside>

      {/* ── MAIN PANEL ── */}
      <main
        key={view}
        className="panel-content"
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          zIndex: 1,
        }}
      >
        {view === "browse" ? (
          selectedSkin ? (
            <div key={selectedSkin.id} className="panel-content">

              {/* Skin header — chamfered top-right corner */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
                padding: "16px 20px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${rc(selectedSkin.category)}`,
                clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)",
              }}>
                {selectedSkin.icon_url
                  ? <img
                      src={`${CDN}/${selectedSkin.icon_url}`}
                      alt={selectedSkin.name}
                      style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
                    />
                  : <div style={{
                      width: "80px",
                      height: "80px",
                      flexShrink: 0,
                      background: `${rc(selectedSkin.category)}12`,
                      border: `1px solid ${rc(selectedSkin.category)}28`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <div style={{ width: "24px", height: "24px", background: rc(selectedSkin.category), opacity: 0.35 }} />
                    </div>
                }

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    margin: "0 0 5px",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "#eaecf2",
                    letterSpacing: "0.01em",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {selectedSkin.name}
                  </h2>
                  <div style={{
                    fontSize: "10px",
                    color: C.muted,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}>
                    {selectedSkin.category} · CS2 Market
                  </div>
                </div>

                {signal && signal.signal !== "insufficient_data" && (
                  <SignalBadge signal={signal} />
                )}
              </div>

              {/* Insufficient data note */}
              {signal && signal.signal === "insufficient_data" && (
                <div style={{
                  color: C.muted,
                  fontSize: "11px",
                  marginBottom: "16px",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}>
                  Insufficient data · {signal.data_points} points recorded
                </div>
              )}

              {history.length > 0 ? (
                <>
                  {/* Stat cards */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <StatCard label="Latest" value={`$${history[history.length - 1].price.toFixed(2)}`} />
                    <StatCard label="All-Time Low" value={`$${Math.min(...history.map(h => h.price)).toFixed(2)}`} />
                    <StatCard label="All-Time High" value={`$${Math.max(...history.map(h => h.price)).toFixed(2)}`} />
                    <StatCard label="Data Points" value={history.length} />
                    {signal && signal.signal !== "insufficient_data" && (
                      <StatCard
                        label="Z-Score"
                        value={signal.z_score}
                        accentColor={signal.signal === "buy" ? C.buy : signal.signal === "sell" ? C.sell : C.muted}
                      />
                    )}
                  </div>

                  {/* Price history chart */}
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderLeft: `2px solid ${rc(selectedSkin.category)}`,
                    padding: "18px 16px 12px",
                  }}>
                    <div style={{
                      fontSize: "10px",
                      color: C.muted,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: "14px",
                    }}>
                      Price History
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={rc(selectedSkin.category)} stopOpacity={0.22} />
                            <stop offset="92%" stopColor={rc(selectedSkin.category)} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 6" stroke={C.border} vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke={C.muted}
                          tick={{ fontFamily: "'JetBrains Mono', monospace", fill: C.muted, fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: C.border }}
                        />
                        <YAxis
                          stroke={C.muted}
                          tickFormatter={v => `$${v}`}
                          domain={["auto", "auto"]}
                          tick={{ fontFamily: "'JetBrains Mono', monospace", fill: C.muted, fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <Tooltip
                          contentStyle={{
                            background: C.panel,
                            border: `1px solid ${C.border}`,
                            borderRadius: 0,
                            fontSize: "11px",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: C.text,
                          }}
                          formatter={v => [`$${Number(v).toFixed(2)}`, "Price"]}
                          labelStyle={{ color: C.muted, marginBottom: "4px" }}
                        />
                        {signal && signal.signal !== "insufficient_data" && (
                          <ReferenceLine
                            y={parseFloat(signal.mean)}
                            stroke={C.muted}
                            strokeDasharray="4 4"
                            strokeWidth={1}
                            label={{
                              value: `avg $${signal.mean}`,
                              fill: C.muted,
                              fontSize: 9,
                              fontFamily: "'JetBrains Mono', monospace",
                              position: "insideTopRight",
                            }}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={rc(selectedSkin.category)}
                          strokeWidth={1.5}
                          fill="url(#priceGrad)"
                          dot={false}
                          activeDot={{ r: 3, fill: rc(selectedSkin.category), strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p style={{ color: C.muted, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  No price history available
                </p>
              )}
            </div>
          ) : (
            /* Empty state */
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
              userSelect: "none",
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                border: `1px solid ${C.border}`,
                background: `${C.gold}0c`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{ width: "12px", height: "12px", background: C.gold, opacity: 0.35 }} />
              </div>
              <p style={{ color: C.muted, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                Select a skin to view analysis
              </p>
            </div>
          )
        ) : (
          /* ── SIGNALS VIEW ── */
          <>
            <div style={{ marginBottom: "22px" }}>
              <h2 style={{
                margin: "0 0 4px",
                fontSize: "17px",
                fontWeight: 700,
                color: C.gold,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>Active Signals</h2>
              <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Z-score anomaly detection · {allSignals.length} flagged
              </div>
            </div>

            {signalsLoading ? (
              <p style={{ color: C.muted, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Scanning all skins...
              </p>
            ) : allSignals.length === 0 ? (
              <p style={{ color: C.muted, fontSize: "11px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                No signals detected — accumulating price history
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {allSignals.map(s => {
                  const color = rc(s.category)
                  const iconUrl = skins.find(x => x.id === s.skin_id)?.icon_url
                  return (
                    <div
                      key={s.skin_id}
                      className="signal-row"
                      onClick={() => {
                        const skin = skins.find(x => x.id === s.skin_id)
                        if (skin) { setSelectedSkin(skin); setView("browse") }
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: C.surface,
                        padding: "11px 14px",
                        cursor: "pointer",
                        border: `1px solid ${C.border}`,
                        borderLeft: `3px solid ${color}`,
                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {iconUrl
                          ? <img
                              src={`${CDN}/${iconUrl}`}
                              alt=""
                              style={{ width: "32px", height: "32px", objectFit: "contain", flexShrink: 0 }}
                            />
                          : <div style={{
                              width: "32px",
                              height: "32px",
                              background: `${color}15`,
                              border: `1px solid ${color}30`,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <div style={{ width: "8px", height: "8px", background: color, opacity: 0.5 }} />
                            </div>
                        }
                        <div>
                          <div style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            marginBottom: "3px",
                            color: C.text,
                          }}>{s.name}</div>
                          <div style={{
                            fontSize: "11px",
                            color: C.muted,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {s.category} · avg ${s.mean} · now ${s.current}
                          </div>
                        </div>
                      </div>

                      <SignalBadge signal={s} />
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, accentColor }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor ?? C.border}`,
      padding: "10px 14px",
      minWidth: "100px",
      flex: "1 1 auto",
    }}>
      <div style={{
        fontSize: "9px",
        color: C.muted,
        marginBottom: "6px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontSize: "19px",
        fontWeight: 600,
        color: accentColor ?? C.gold,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{value}</div>
    </div>
  )
}

function SignalBadge({ signal }) {
  const isBuy  = signal.signal === "buy"
  const isSell = signal.signal === "sell"
  const color  = isBuy ? C.buy : isSell ? C.sell : C.muted
  const bg     = isBuy ? "#0a2016" : isSell ? "#20080a" : C.panel
  const bdr    = isBuy ? "#3ddc8438" : isSell ? "#ef444438" : C.border
  return (
    <div style={{
      padding: "5px 10px",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      background: bg,
      color,
      border: `1px solid ${bdr}`,
      flexShrink: 0,
    }}>
      {signal.signal.toUpperCase()} · z {signal.z_score}
    </div>
  )
}
