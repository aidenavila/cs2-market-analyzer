import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import axios from "axios"

const API = "http://localhost:8000"

export default function App() {
  const [skins, setSkins] = useState([])
  const [selectedSkin, setSelectedSkin] = useState(null)
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState("")
  const [signal, setSignal] = useState(null)

  useEffect(() => {
    axios.get(`${API}/skins`).then(res => setSkins(res.data))
  }, [])

  useEffect(() => {
    if (selectedSkin) {
      axios.get(`${API}/skins/${selectedSkin.id}/history`).then(res => {
        setHistory(res.data.map(h => ({
          ...h,
          date: new Date(h.recorded_at).toLocaleDateString(),
          price: h.price
        })))
      }).catch(err => {
        console.error("History fetch failed:", err)
        setHistory([])
      })

      axios.get(`${API}/skins/${selectedSkin.id}/signal`).then(res => {
        setSignal(res.data)
      }).catch(err => {
        console.error("Signal fetch failed:", err)
        setSignal(null)
      })
    }
  }, [selectedSkin])

  const filtered = skins.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", background: "#0f1115", color: "#e0e0e0" }}>

      {/* Sidebar */}
      <div style={{ width: "300px", borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #2a2a2a" }}>
          <h1 style={{ margin: 0, fontSize: "18px", color: "#e4b84d" }}>CS2 Market Analyzer</h1>
        </div>
        <div style={{ padding: "12px" }}>
          <input
            placeholder="Search skins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px", background: "#1e2025", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#e0e0e0", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.slice(0, 100).map(skin => (
            <div
              key={skin.id}
              onClick={() => setSelectedSkin(skin)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                borderBottom: "1px solid #1a1a1a",
                background: selectedSkin?.id === skin.id ? "#1e2a1e" : "transparent",
                borderLeft: selectedSkin?.id === skin.id ? "3px solid #4caf50" : "3px solid transparent",
                fontSize: "13px"
              }}
            >
              {skin.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {selectedSkin ? (
          <>
            <h2 style={{ marginTop: 0, color: "#e4b84d" }}>{selectedSkin.name}</h2>
            {signal && signal.signal !== "insufficient_data" && (
              <div style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "16px",
                background: signal.signal === "buy" ? "#1b3a2b" : signal.signal === "sell" ? "#3a1b1b" : "#2a2a2a",
                color: signal.signal === "buy" ? "#4caf50" : signal.signal === "sell" ? "#f44336" : "#888",
                border: `1px solid ${signal.signal === "buy" ? "#4caf50" : signal.signal === "sell" ? "#f44336" : "#444"}`
              }}>
                {signal.signal.toUpperCase()} · z-score {signal.z_score} · avg ${signal.mean}
              </div>
            )}
            {signal && signal.signal === "insufficient_data" && (
              <div style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>
                Not enough price history yet for a signal ({signal.data_points} data points)
              </div>
            )}
            {history.length > 0 ? (
              <>
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <StatCard label="Latest Price" value={`$${history[history.length - 1].price.toFixed(2)}`} />
                  <StatCard label="All Time Low" value={`$${Math.min(...history.map(h => h.price)).toFixed(2)}`} />
                  <StatCard label="All Time High" value={`$${Math.max(...history.map(h => h.price)).toFixed(2)}`} />
                  <StatCard label="Data Points" value={history.length} />
                </div>
                <div style={{ background: "#1e2025", borderRadius: "8px", padding: "16px" }}>
                  <h3 style={{ marginTop: 0, fontSize: "14px", color: "#888" }}>PRICE HISTORY</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#555" fontSize={12} />
                      <YAxis stroke="#555" fontSize={12} tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: "#1e2025", border: "1px solid #2a2a2a" }}
                        formatter={v => [`$${v}`, "Price"]}
                      />
                      <Line type="monotone" dataKey="price" stroke="#4caf50" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p style={{ color: "#555" }}>No price history yet for this skin.</p>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555" }}>
            <p>Select a skin from the sidebar to view price history</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "#1e2025", borderRadius: "8px", padding: "16px", minWidth: "140px" }}>
      <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "bold", color: "#e4b84d" }}>{value}</div>
    </div>
  )
}
