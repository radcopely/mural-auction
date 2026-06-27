import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  ink:         '#1a1410',
  canvas:      '#f7f3ee',
  warm:        '#f0e8dc',
  spray:       '#e85d26',
  sprayLight:  '#f4845f',
  chalk:       '#5b8fa8',
  chalkLight:  '#8ab4c9',
  muted:       '#8a7f76',
  border:      '#d9d0c5',
  white:       '#ffffff',
  success:     '#3a7d44',
  gold:        '#c9992a',
  error:       '#c0392b',
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'mural2024'

const STATUS_CONFIG = {
  'not-started': { label: 'Not Started',       color: C.muted   },
  'in-progress':  { label: 'In Progress 🎨',   color: C.gold    },
  'complete':     { label: 'Complete ✓',        color: C.success },
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: `1px solid ${C.border}`, borderRadius: 4,
  fontSize: 14, background: C.white, color: C.ink,
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: C.muted, textTransform: 'uppercase',
  letterSpacing: '0.8px', marginBottom: 4,
}

function btn(bg, extra = {}) {
  return {
    background: bg, border: 'none', color: C.white,
    padding: '10px 18px', borderRadius: 4, cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    ...extra,
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function timeLeft(isoEnd) {
  const diff = new Date(isoEnd) - Date.now()
  if (diff <= 0) return 'Auction ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US')
}

// ── Photo carousel ────────────────────────────────────────────────────────────
function PhotoCarousel({ photos, title }) {
  const [idx, setIdx] = useState(0)

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        background: C.warm, height: 220, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: C.muted, fontSize: 14, borderRadius: '4px 4px 0 0',
      }}>
        No photos yet
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <img
        src={photos[idx]}
        alt={`${title} progress ${idx + 1}`}
        style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: '4px 4px 0 0', display: 'block' }}
        onError={e => { e.target.src = 'https://placehold.co/600x220/f0e8dc/8a7f76?text=Photo+unavailable' }}
      />
      {photos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{ background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: 3, padding: '3px 9px', cursor: 'pointer', fontSize: 14 }}>‹</button>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 3, padding: '3px 9px', fontSize: 12, lineHeight: '1.6' }}>
            {idx + 1}/{photos.length}
          </span>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{ background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: 3, padding: '3px 9px', cursor: 'pointer', fontSize: 14 }}>›</button>
        </div>
      )}
    </div>
  )
}

// ── Bid modal ────────────────────────────────────────────────────────────────
function BidModal({ mural, onClose, onBid }) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [amount, setAmount] = useState(mural.current_bid + 25)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!name.trim()) return setError('Please enter your name.')
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.')
    if (Number(amount) <= mural.current_bid) return setError(`Bid must exceed current bid of ${fmt(mural.current_bid)}.`)
    setLoading(true)
    setError('')
    const err = await onBid(mural.id, { bidder_name: name.trim(), bidder_email: email.trim(), amount: Number(amount) })
    setLoading(false)
    if (err) setError(err)
    else setSuccess(true)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.white, borderRadius: 8, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎨</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.success, marginBottom: 8 }}>Bid Placed!</div>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              You bid <strong>{fmt(amount)}</strong> on <strong>{mural.title}</strong>.<br/>
              You're currently the highest bidder.
            </div>
            <button onClick={onClose} style={btn(C.ink)}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.ink, marginBottom: 3 }}>Place a Bid</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{mural.title} · by {mural.artist}</div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Jane Smith" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="jane@email.com" type="email" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Your Bid (USD) · Current: {fmt(mural.current_bid)}</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ padding: '9px 10px', background: C.warm, border: `1px solid ${C.border}`, borderRight: 'none', borderRadius: '4px 0 0 4px', color: C.muted }}>$</span>
                <input
                  value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ ...inputStyle, borderRadius: '0 4px 4px 0' }}
                  type="number" min={mural.current_bid + 1}
                />
              </div>
            </div>

            {error && <div style={{ color: C.error, fontSize: 13, marginBottom: 12, padding: '8px 10px', background: '#fdf0ef', borderRadius: 4 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ ...btn(C.border), color: C.ink, flex: 1 }}>Cancel</button>
              <button onClick={submit} disabled={loading} style={{ ...btn(C.spray), flex: 2, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting…' : `Confirm Bid · ${fmt(amount)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Mural card ────────────────────────────────────────────────────────────────
function MuralCard({ mural, onBid }) {
  const [expanded, setExpanded] = useState(false)
  const ended = new Date(mural.auction_end) <= Date.now()
  const statusCfg = STATUS_CONFIG[mural.status] || STATUS_CONFIG['not-started']

  return (
    <div style={{ background: C.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,20,16,0.08)', display: 'flex', flexDirection: 'column' }}>
      <PhotoCarousel photos={mural.photos} title={mural.title} />

      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: statusCfg.color, textTransform: 'uppercase' }}>
            {statusCfg.label}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>{mural.photos?.length || 0} photo{mural.photos?.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: C.ink, marginBottom: 2, lineHeight: 1.25 }}>{mural.title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>by {mural.artist}</div>
        {mural.description && (
          <div style={{ fontSize: 13, color: C.ink, marginBottom: 10, lineHeight: 1.55, opacity: 0.8 }}>{mural.description}</div>
        )}

        {/* Bid info */}
        <div style={{ background: C.warm, borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {mural.bid_count ? 'Current Bid' : 'Starting Bid'}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.spray, lineHeight: 1.1 }}>
                {fmt(mural.current_bid)}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{mural.bid_count || 0} bid{mural.bid_count !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: ended ? C.error : C.chalk, fontWeight: 600 }}>
                {timeLeft(mural.auction_end)}
              </div>
            </div>
          </div>
        </div>

        {/* Bid history */}
        {mural.bid_count > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', color: C.chalk, fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '0 0 8px', textDecoration: 'underline' }}>
            {expanded ? 'Hide' : 'Show'} bid history ({mural.bid_count})
          </button>
        )}
        {expanded && mural.bids && (
          <div style={{ marginBottom: 10, maxHeight: 130, overflowY: 'auto', fontSize: 12 }}>
            {[...mural.bids].reverse().map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.border}`, color: C.ink }}>
                <span>{b.bidder_name}</span>
                <span style={{ fontWeight: 700, color: C.spray }}>{fmt(b.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => !ended && onBid(mural)}
          disabled={ended}
          style={{
            ...btn(ended ? C.border : C.spray),
            color: ended ? C.muted : C.white,
            marginTop: 'auto',
            cursor: ended ? 'default' : 'pointer',
          }}>
          {ended ? 'Auction Ended' : 'Place Bid'}
        </button>
      </div>
    </div>
  )
}

// ── Admin panel ───────────────────────────────────────────────────────────────
function AdminPanel({ murals, onClose, onRefresh }) {
  const [activeId, setActiveId] = useState(murals[0]?.id || null)
  const [fields, setFields]     = useState({})
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newTitle, setNewTitle]   = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')

  const active = murals.find(m => m.id === activeId)

  useEffect(() => {
    if (active) setFields({ ...active })
  }, [activeId])

  function patch(key, val) {
    setFields(f => ({ ...f, [key]: val }))
  }

async function saveMural() {
    if (!activeId || activeId === 'null') {
      setSaveMsg('Please select a mural from the sidebar first.')
      setTimeout(() => setSaveMsg(''), 2500)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('murals')
      .update({
        title:        fields.title,
        artist:       fields.artist,
        description:  fields.description,
        status:       fields.status,
        starting_bid: Number(fields.starting_bid),
        auction_end:  fields.auction_end,
        photos:       fields.photos,
      })
      .eq('id', activeId)

    setSaving(false)
    if (error) {
      setSaveMsg('Error saving: ' + error.message)
    } else {
      setSaveMsg('Saved ✓')
      onRefresh()
      setTimeout(() => setSaveMsg(''), 2500)
    }
  }
async function addMural() {
    if (!newTitle.trim() || !newArtist.trim()) return
    const auctionEnd = new Date(Date.now() + 7 * 86400000).toISOString()
    const { data, error } = await supabase.from('murals').insert({
      title:        newTitle.trim(),
      artist:       newArtist.trim(),
      description:  '',
      status:       'not-started',
      starting_bid: 100,
      current_bid:  100,
      auction_end:  auctionEnd,
      photos:       [],
    }).select().single()

    if (error) {
      console.log('Add mural error:', error.message)
      alert('Error adding mural: ' + error.message)
      return
    }
    setNewTitle('')
    setNewArtist('')
    onRefresh()
    setActiveId(data.id)
  }

  function addPhoto() {
    if (!newPhotoUrl.trim()) return
    patch('photos', [...(fields.photos || []), newPhotoUrl.trim()])
    setNewPhotoUrl('')
  }

  function removePhoto(idx) {
    patch('photos', (fields.photos || []).filter((_, i) => i !== idx))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.ink, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Georgia, serif', color: C.white, fontSize: 18 }}>Admin Panel</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saveMsg && <span style={{ color: saveMsg.startsWith('Error') ? '#f1948a' : '#82e0aa', fontSize: 13 }}>{saveMsg}</span>}
          <button onClick={saveMural} disabled={saving} style={{ ...btn(C.spray), fontSize: 13, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{ ...btn(C.muted), fontSize: 13 }}>Close</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: C.warm, borderRight: `1px solid ${C.border}`, overflowY: 'auto', flexShrink: 0, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Murals</div>
          {murals.map(m => (
            <button key={m.id} onClick={() => setActiveId(m.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 4, border: 'none', marginBottom: 2,
              background: activeId === m.id ? C.spray : 'transparent',
              color: activeId === m.id ? C.white : C.ink,
              fontSize: 13, cursor: 'pointer',
            }}>
              {m.title || 'Untitled'}
              <span style={{ display: 'block', fontSize: 11, opacity: 0.7 }}>{m.artist}</span>
            </button>
          ))}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>Add Mural</div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" style={{ ...inputStyle, fontSize: 12, marginBottom: 4 }} />
            <input value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artist name" style={{ ...inputStyle, fontSize: 12, marginBottom: 6 }} />
            <button onClick={addMural} style={{ ...btn(C.chalk), fontSize: 12, width: '100%', padding: '8px' }}>+ Add</button>
          </div>
        </div>

        {/* Detail pane */}
        {active && fields.title !== undefined && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: C.canvas }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input value={fields.title || ''} onChange={e => patch('title', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Artist</label>
                <input value={fields.artist || ''} onChange={e => patch('artist', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={fields.status || 'not-started'} onChange={e => patch('status', e.target.value)} style={inputStyle}>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Starting Bid ($)</label>
                <input value={fields.starting_bid || ''} onChange={e => patch('starting_bid', e.target.value)} type="number" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Auction End (your local time)</label>
                <input
                  value={fields.auction_end ? new Date(fields.auction_end).toISOString().slice(0, 16) : ''}
                  onChange={e => patch('auction_end', new Date(e.target.value).toISOString())}
                  type="datetime-local" style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={fields.description || ''} onChange={e => patch('description', e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
              </div>
            </div>

            {/* Photos */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>Progress Photos</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="Paste image URL…" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addPhoto} style={{ ...btn(C.chalk), whiteSpace: 'nowrap' }}>Add Photo</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(fields.photos || []).map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 4 }} />
                    <button onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', borderRadius: 3, width: 18, height: 18, cursor: 'pointer', fontSize: 11, lineHeight: 1 }}>✕</button>
                    <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 2 }}>#{i + 1}</div>
                  </div>
                ))}
                {!fields.photos?.length && <div style={{ color: C.muted, fontSize: 13 }}>No photos yet.</div>}
              </div>
            </div>

            {/* Bids */}
            {active.bid_count > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>Bid History ({active.bid_count})</div>
                <div style={{ maxHeight: 180, overflowY: 'auto', fontSize: 12 }}>
                  {active.bids && [...active.bids].reverse().map((b, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}`, color: C.ink }}>
                      <span>{b.bidder_name}</span>
                      <span style={{ color: C.muted, fontSize: 11 }}>{b.bidder_email}</span>
                      <span style={{ fontWeight: 700, color: C.spray }}>{fmt(b.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Admin login modal ─────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onClose }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')

  function attempt() {
    if (pw === ADMIN_PASSWORD) { onSuccess() }
    else setError('Incorrect password.')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, padding: 28, borderRadius: 8, width: 320 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 16 }}>Admin Access</div>
        <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="Password"
          style={inputStyle} onKeyDown={e => e.key === 'Enter' && attempt()} />
        {error && <div style={{ color: C.error, fontSize: 13, marginTop: 6 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={{ ...btn(C.border), color: C.ink, flex: 1 }}>Cancel</button>
          <button onClick={attempt} style={{ ...btn(C.spray), flex: 2 }}>Enter</button>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [murals, setMurals]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [bidTarget, setBidTarget]   = useState(null)
  const [adminLogin, setAdminLogin] = useState(false)
  const [adminOpen, setAdminOpen]   = useState(false)
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')

  const fetchMurals = useCallback(async () => {
    const { data: muralData, error: muralErr } = await supabase
      .from('murals')
      .select('*')
      .order('created_at', { ascending: true })

    if (muralErr) { setError(muralErr.message); setLoading(false); return }

    // Fetch bids for each mural
    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: true })

    const bidsMap = {}
    ;(bidData || []).forEach(b => {
      if (!bidsMap[b.mural_id]) bidsMap[b.mural_id] = []
      bidsMap[b.mural_id].push(b)
    })

    const enriched = (muralData || []).map(m => ({
      ...m,
      bids:      bidsMap[m.id] || [],
      bid_count: (bidsMap[m.id] || []).length,
    }))

    setMurals(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { fetchMurals() }, [fetchMurals])

  // Real-time subscription for new bids
  useEffect(() => {
    const channel = supabase
      .channel('bids-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, () => {
        fetchMurals()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchMurals])

  async function handleBid(muralId, bidData) {
    // Insert bid row
    const { error: bidErr } = await supabase.from('bids').insert({
      mural_id:     muralId,
      bidder_name:  bidData.bidder_name,
      bidder_email: bidData.bidder_email,
      amount:       bidData.amount,
    })
    if (bidErr) return bidErr.message

    // Update mural's current_bid
    const { error: muralErr } = await supabase
      .from('murals')
      .update({ current_bid: bidData.amount })
      .eq('id', muralId)
    if (muralErr) return muralErr.message

    await fetchMurals()
    return null
  }

  const filtered = murals.filter(m => {
    const matchStatus = filter === 'all' || m.status === filter
    const matchSearch = !search
      || m.title.toLowerCase().includes(search.toLowerCase())
      || m.artist.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32 }}>🎨</div>
      <div style={{ fontFamily: 'Georgia, serif', color: C.muted, fontSize: 18 }}>Loading auction…</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: C.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontFamily: 'Georgia, serif', color: C.error, fontSize: 18 }}>Connection error</div>
      <div style={{ color: C.muted, fontSize: 14, maxWidth: 400, textAlign: 'center' }}>{error}<br/>Check your Supabase environment variables.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.canvas }}>

      {/* Hero */}
      <div style={{ background: C.ink, padding: '40px 24px 34px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '18px 18px' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, letterSpacing: '3px', color: C.spray, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Live Art Auction</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 6vw, 54px)', color: C.white, margin: '0 0 12px', fontWeight: 400, lineHeight: 1.15 }}>
            Mural Festival
          </h1>
          <p style={{ color: C.border, fontSize: 15, maxWidth: 500, margin: '0 auto 22px', lineHeight: 1.65 }}>
            Bid on original 8×8 murals painted live. Follow each artist's progress and place your bid before the auction closes.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: C.chalkLight }}>
            <span>🎨 {murals.length} murals</span>
            <span>⚡ Live bidding</span>
            <span>📸 Progress photos</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: C.warm, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search murals or artists…"
          style={{ ...inputStyle, maxWidth: 240, fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['not-started', 'Not Started'], ['in-progress', 'In Progress'], ['complete', 'Complete']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              border: `1px solid ${filter === val ? C.spray : C.border}`,
              background: filter === val ? C.spray : C.white,
              color: filter === val ? C.white : C.ink,
              fontWeight: filter === val ? 700 : 400,
            }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setAdminLogin(true)}
          style={{ ...btn(C.ink), marginLeft: 'auto', fontSize: 12, padding: '7px 14px' }}>
          Admin ⚙
        </button>
      </div>

      {/* Mural grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '70px 0', fontSize: 16 }}>
            {murals.length === 0 ? 'No murals yet — check back soon!' : 'No murals match your filter.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {filtered.map(m => <MuralCard key={m.id} mural={m} onBid={setBidTarget} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 16px', color: C.muted, fontSize: 12, borderTop: `1px solid ${C.border}`, marginTop: 20 }}>
        Mural Festival Live Auction · All bids are binding · Questions? Contact the organizer.
      </div>

      {/* Modals */}
      {bidTarget && (
        <BidModal
          mural={bidTarget}
          onClose={() => setBidTarget(null)}
          onBid={async (id, bid) => {
            const err = await handleBid(id, bid)
            if (!err) setBidTarget(null)
            return err
          }}
        />
      )}
      {adminLogin && (
        <AdminLogin
          onSuccess={() => { setAdminLogin(false); setAdminOpen(true) }}
          onClose={() => setAdminLogin(false)}
        />
      )}
      {adminOpen && (
        <AdminPanel
          murals={murals}
          onClose={() => setAdminOpen(false)}
          onRefresh={fetchMurals}
        />
      )}
    </div>
  )
}
