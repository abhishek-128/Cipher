'use client';

import React, { useState, useEffect } from 'react';

const defaultMockSignals = [
  {
    signal_id: "SIG-X930-24B", asset: "SPY (S&P 500 ETF)", direction: "Buy", confidence: 78.0, ticker: 'SPY',
    feature_weights: [
      { feature: "Short-term Momentum (3Day-VWAP)", weight: 0.45, volatility: 0.12 },
      { feature: "Options Flow (Call Gamma)", weight: 0.25, volatility: 0.15 },
      { feature: "Macro VIX Implied", weight: 0.05, volatility: 0.03 }
    ]
  },
  {
    signal_id: "SIG-E441-12A", asset: "EURUSD (Forex)", direction: "Sell", confidence: 64.0, ticker: 'EURUSD',
    feature_weights: [
      { feature: "Rate Differentials (ECB/FED)", weight: 0.55, volatility: 0.18 },
      { feature: "Dollar Strength Index", weight: 0.35, volatility: 0.10 }
    ]
  },
  {
    signal_id: "SIG-G882-99D", asset: "GLD (Gold Trust)", direction: "Buy", confidence: 91.0, ticker: 'GLD',
    feature_weights: [
      { feature: "Mean Reversion Deviation", weight: 0.21, volatility: 0.05 },
      { feature: "10Yr Real Rates Correlation", weight: 0.18, volatility: 0.03 }
    ]
  },
  {
    signal_id: "SIG-N112-44C", asset: "NVDA (Semiconductors)", direction: "Hold", confidence: 52.0, ticker: 'NVDA',
    feature_weights: [
      { feature: "Options Flow Imbalance", weight: 0.41, volatility: 0.22 },
      { feature: "Retail Sentiment Index", weight: 0.31, volatility: 0.18 }
    ]
  },
  {
    signal_id: "SIG-B550-88X", asset: "BTCUSD (Crypto)", direction: "Buy", confidence: 88.0, ticker: 'BTC',
    feature_weights: [
      { feature: "On-Chain Accumulation", weight: 0.52, volatility: 0.25 },
      { feature: "ETF Inflow Velocity", weight: 0.28, volatility: 0.15 }
    ]
  }
];

export default function DashboardClient({ initialPayload }: { initialPayload: any }) {
  const [signals, setSignals] = useState<any[]>(defaultMockSignals);
  const [activePayload, setActivePayload] = useState<any>(defaultMockSignals[0]);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [softLoading, setSoftLoading] = useState<boolean>(false);
  
  const [time, setTime] = useState<string>('');
  
  // States for new interactive UI features
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [hedged, setHedged] = useState<boolean>(false);
  const [stressThreshold, setStressThreshold] = useState<number>(30); // Interactive pillar III threshold
  
  const [advLoading, setAdvLoading] = useState<boolean>(false);
  const [adversarialMsg, setAdversarialMsg] = useState<string | null>(null);

  // Background Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const pad = (v: number) => String(v).padStart(2, '0');
      setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())} EST`);
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, []);

  // Main Audit Fetch Hook
  const fetchAudit = (softUpdate = false) => {
    if (!activePayload) return;
    
    if (!softUpdate) {
      setLoading(true);
      setAcknowledged(false);
      setHedged(false);
      setAdversarialMsg(null); // Reset adversarial state on new signal/re-calc
    } else {
      setSoftLoading(true);
      setAcknowledged(false); // Reset ack so they must re-approve the new math
      setHedged(false);
    }

    fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...activePayload, stress_shift_pct: stressThreshold})
    })
      .then(res => res.json())
      .then(data => {
        setAudit(data);
        if (!softUpdate) setLoading(false);
        else setSoftLoading(false);
      })
      .catch(err => {
        console.error("Failed to process", err);
        if (!softUpdate) setLoading(false);
        else setSoftLoading(false);
      });
  };

  useEffect(() => {
    fetchAudit(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePayload]); // Specifically intentionally not firing on stressThreshold until user clicks Calculate.

  // Action 1: Force Sync Telemetry
  const forceSync = () => {
     const randomized = signals.map(sig => ({
         ...sig,
         confidence: Math.max(30, Math.min(99, sig.confidence + (Math.random() * 4 - 2))) // Jitter +-2%
     }));
     setSignals(randomized);
     // Update active payload to its jittered version to trigger re-run
     const activeIdx = signals.findIndex(s => s.signal_id === activePayload.signal_id);
     if(activeIdx >= 0) setActivePayload(randomized[activeIdx]);
  };

  // Action 2: Archive Signal
  const archiveSignal = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation(); // Don't trigger activePayload switch
    const nextSignals = signals.filter(s => s.signal_id !== idToRemove);
    setSignals(nextSignals);
    // If we removed the active one, fallback to the first available
    if (activePayload.signal_id === idToRemove && nextSignals.length > 0) {
       setActivePayload(nextSignals[0]);
    }
  };

  // Action 4: Adversarial Opinion Toggle
  const requestAdversarial = () => {
     if (adversarialMsg) {
         setAdversarialMsg(null);
         return;
     }

     setAdvLoading(true);
     fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...activePayload, action: 'adversarial'})
      })
      .then(res => res.json())
      .then(data => {
         setAdversarialMsg(data.adversarial);
         setAdvLoading(false);
      })
      .catch((e) => {
         console.error(e);
         setAdvLoading(false);
      });
  };

  // Action 5: Export JSON
  const exportArtifact = () => {
      const artifactBundle = {
          timestamp: new Date().toISOString(),
          base_signal: activePayload,
          cipher_audit: audit,
          executed_hedge: hedged
      };
      
      const blob = new Blob([JSON.stringify(artifactBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cipher-audit-${activePayload.ticker}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="brand">CI<em style={{fontStyle:'italic', color:'var(--gold)'}}>PH</em>ER</div>
          <div className="brand-sep"></div>
          <div className="brand-sub">Signal Intelligence Layer</div>
        </div>
        <div className="topbar-right">
          <div className="live-pill"><div className="live-dot"></div>Live</div>
          <div className="clock">{time}</div>
          <div className="ab-tag">AB Labs</div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="layout">

        {/* LEFT — SIGNAL QUEUE */}
        <div className="col">
          <div className="col-head">
            <div>
              <span className="col-title" style={{marginRight:'12px'}}>Signal Queue</span>
              <span className="chip chip-gold">{signals.length} Active</span>
            </div>
            <button onClick={forceSync} title="Force Sync Telemetry" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.6}}>
               {/* Reload Icon */}
               <svg fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
          <div className="col-body">

            {signals.map((signal) => {
              const isActive = signal.signal_id === activePayload?.signal_id;
              
              let dirClass = 'dir-hold';
              let dirColor = 'var(--gold)';
              if (signal.direction === 'Buy') { dirClass = 'dir-buy'; dirColor = 'var(--green)'; }
              else if (signal.direction === 'Sell') { dirClass = 'dir-sell'; dirColor = 'var(--red)'; }

              let displayConf = signal.confidence;
              let displayCipher = signal.confidence * 0.6; 
              let fragText = "Analyzing Fragility...";
              if (isActive && audit && !loading) {
                 displayCipher = audit.human_conviction;
                 fragText = (audit.inversion_threshold.fragility_delta > 30 ? 'High Fragility' : 'Medium Fragility') + ` · Score ${audit.inversion_threshold.fragility_delta.toFixed(0)}`;
              } else if (!isActive) {
                 fragText = signal.confidence > 70 ? 'Moderate Fragility' : 'Elevated Fragility';
              }

              return (
                <div 
                  key={signal.signal_id} 
                  className={`sig-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActivePayload(signal)}
                  style={{position: 'relative'}}
                >
                  <button 
                    className="archive-btn"
                    onClick={(e) => archiveSignal(e, signal.signal_id)}
                    style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', color: 'var(--ink-dim)', background: 'var(--border)', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', zIndex: 10}}
                  >
                    ×
                  </button>
                  <div className="sig-top">
                    <div className="sig-ticker">{signal.ticker}</div>
                    <div className={`sig-dir ${dirClass}`}>{signal.direction}</div>
                  </div>
                  <div className="sig-bar-row">
                    <div className="sig-bar-label">Raw</div>
                    <div className="bar-track"><div className="bar-fill" style={{width: `${displayConf}%`, background: dirColor}}></div></div>
                    <div className="sig-conf" style={{color: dirColor}}>{displayConf.toFixed(0)}%</div>
                  </div>
                  <div className="sig-bar-row">
                    <div className="sig-bar-label">Cipher</div>
                    <div className="bar-track"><div className="bar-fill" style={{width: `${displayCipher}%`, background: 'var(--gold)'}}></div></div>
                    <div className="sig-conf" style={{color: 'var(--gold)'}}>{displayCipher.toFixed(0)}%</div>
                  </div>
                  <div className="sig-frag">
                    <div className="frag-dot" style={{background: 'var(--gold)'}}></div>
                    {fragText}
                  </div>
                </div>
              );
            })}

            {signals.length === 0 && <div style={{color:'var(--ink-dim)', textAlign:'center', marginTop:'40px'}}>QUEUE EMPTY</div>}

          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="center-col">
          {(loading || !audit) && activePayload ? (
            <div style={{ color: 'var(--gold)', padding: '2rem', textAlign: 'center', marginTop: '4rem', fontSize: '18px', letterSpacing: '0.1em' }}>
              [ INTERCEPTING {activePayload.ticker} ALGORITHM... ]
            </div>
          ) : activePayload && audit ? (
            <>
              <div className="sig-hero">
                <div className="hero-row1">
                  <div className="hero-ticker-wrap">
                    <div className="hero-ticker">{activePayload.ticker}</div>
                    <div className="hero-market">{activePayload.asset} · {activePayload.direction} Signal</div>
                  </div>
                  <div className={`hero-dir-badge ${activePayload.direction === 'Buy' ? 'dir-buy' : (activePayload.direction === 'Sell' ? 'dir-sell' : 'dir-hold')}`} 
                       style={{fontSize:'20px', padding:'10px 24px', borderColor: activePayload.direction === 'Buy' ? 'rgba(77,187,138,0.3)' : 'rgba(201,169,110,0.3)'}}>
                    {activePayload.direction.toUpperCase()}
                  </div>
                </div>
                <div className="hero-metrics">
                  <div className="metric">
                    <div className="metric-label">Signal ID</div>
                    <div className="metric-val" style={{color:'var(--ink)', fontSize:'18px', marginTop:'8px'}}>{activePayload.signal_id}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Primary Feature</div>
                    <div className="metric-val" style={{color:'var(--gold)', fontSize:'18px', marginTop:'8px'}}>{audit.inversion_threshold.load_bearing_feature.split(' ')[0]}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Stress Shift</div>
                    <div className="metric-val">{audit.inversion_threshold.breaking_point_shift.toFixed(1)}%</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Raw Confidence</div>
                    <div className="metric-val" style={{color: activePayload.direction === 'Buy' ? 'var(--green)' : 'var(--gold)'}}>{activePayload.confidence.toFixed(0)}%</div>
                    <div className="metric-sub">Cipher: {audit.human_conviction.toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              <div className="pillars-wrap">
                {/* P1 */}
                <div className="pillar">
                  <div className="pillar-head">
                    <div className="pillar-n">I</div>
                    <div className="pillar-head-text">
                      <div className="pillar-title">What The Signal Is Betting On</div>
                      <div className="pillar-subtitle">Core assumption decoded by Cipher</div>
                    </div>
                    {/* Action 4: Adversarial Toggle */}
                    <button className="chip chip-gold" onClick={requestAdversarial} style={{cursor:'crosshair', border:'1px dotted var(--gold)'}}>
                       {advLoading ? 'Fetching...' : (adversarialMsg ? '(×) Close' : '(?) Challenge')}
                    </button>
                  </div>
                  
                  {adversarialMsg && (
                      <div className="inc fail" style={{display: 'block', margin:'0 20px', padding:'12px', borderLeftColor: 'var(--red)'}}>
                          <div className="inc-text" style={{fontSize: '14px', color:'var(--red)'}}>
                             <strong>Opposing Logic:</strong> {adversarialMsg}
                          </div>
                      </div>
                  )}

                  <div className="pillar-body">
                    <div className="pillar-statement">
                      "{audit.assumption}"
                    </div>
                    <div className="wbar-row">
                      <span>Assumption Weight Factor</span>
                      <span style={{color:'var(--gold)'}}>Drop Threshold {audit.inversion_threshold.fragility_delta.toFixed(1)}</span>
                    </div>
                    <div className="wbar-track">
                      <div className="wbar-fill" style={{width:`${Math.min(100, audit.inversion_threshold.fragility_delta * 2)}%`, background:'linear-gradient(90deg,var(--gold),var(--red))'}}></div>
                    </div>
                  </div>
                </div>

                {/* P2 */}
                <div className="pillar">
                  <div className="pillar-head">
                    <div className="pillar-n">II</div>
                    <div className="pillar-head-text">
                      <div className="pillar-title">How Often This Bet Has Been Wrong</div>
                      <div className="pillar-subtitle">Historical fragility trace across analogous periods</div>
                    </div>
                    <span className={`chip ${audit.regime_audit.failure_rate > 30 ? 'chip-red' : 'chip-gold'}`}>{audit.regime_audit.failure_rate}% Failed</span>
                  </div>
                  <div className="pillar-body">
                     <div className="inc-list">
                      {audit.regime_audit.comparables.map((comp: string, i: number) => (
                        <div key={i} className={`inc ${i===0 ? 'fail' : (i===1 ? 'pass' : 'warn')}`}>
                          <div className="inc-date">H-Analog</div>
                          <div className="inc-text">{comp}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* P3 */}
                <div className="pillar">
                  <div className="pillar-head">
                    <div className="pillar-n">III</div>
                    <div className="pillar-head-text">
                      <div className="pillar-title">Where The Signal Breaks</div>
                      <div className="pillar-subtitle">Dynamic Inversion Calibration Engine</div>
                    </div>
                  </div>
                  <div className="pillar-body">
                    
                    {/* Action 3: STRESS TEST SLIDER */}
                    <div style={{marginBottom:'24px', background:'var(--surface2)', padding:'16px', border:'1px solid var(--gold-border)'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.1em'}}>
                            <span style={{color:'var(--ink-dim)'}}>Simulate Core Assumption Drop By:</span>
                            <span style={{color:'var(--gold)'}}>{stressThreshold}% Shift</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" 
                            max="75" 
                            value={stressThreshold}
                            onChange={(e) => setStressThreshold(Number(e.target.value))}
                            style={{width:'100%', marginBottom:'16px', accentColor:'var(--gold)'}}
                        />
                        <button 
                            className="act-btn btn-ghost" 
                            onClick={() => fetchAudit(true)} 
                            style={{borderColor:'var(--gold)', color:'var(--gold)'}}
                        >
                            [ Calculate Matrix Shift ]
                        </button>
                    </div>

                    <div className="pillar-statement">
                      If the core assumption deviates by <em>{audit.inversion_threshold.breaking_point_shift.toFixed(1)}% or more, the signal mathematically inverts.</em>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* RIGHT — AUDIT */}
        <div className="col" style={{borderRight:'none', borderLeft:'1px solid var(--ice-dim)'}}>
          <div className="col-head">
            <span className="col-title">Cipher Audit</span>
            <span className={`chip ${loading || softLoading ? 'chip-gold' : (audit?.inversion_threshold.fragility_delta > 30.0 ? 'chip-red' : 'chip-gold')}`}>
              {loading || softLoading ? 'Processing' : (audit?.inversion_threshold.fragility_delta > 30.0 ? 'Critical Warning' : 'Observation')}
            </span>
          </div>
          
          {(softLoading && !loading) ? (
            <div style={{ color: 'var(--gold)', padding: '2rem', textAlign: 'center', marginTop: '4rem', fontSize: '15px', letterSpacing: '0.1em' }}>
               [ RECONFIGURING MATRIX ]
            </div>
          ) : (
            <>
              <div className="col-body" style={{padding:0}}>
                {!loading && audit && (
                  <>
                    <div className="audit-section">
                      <div className="audit-label">Adjusted Confidence</div>
                      <div className="adj-row">
                        <div className="adj-num">{audit.human_conviction.toFixed(0)}%</div>
                        <div className="adj-meta">
                          <div className="adj-meta-label">Calibrated</div>
                          <div className="adj-strike">{activePayload.confidence.toFixed(0)}% raw</div>
                          <div className="adj-delta">{audit.inversion_threshold.fragility_delta.toFixed(1)}pp margin</div>
                        </div>
                      </div>
                      <div className="adj-note">Raw algorithmic confidence manually overwritten by -{audit.inversion_threshold.fragility_delta.toFixed(1)} pts due to identified operational fragility constraints.</div>
                    </div>

                    <div className="audit-section" onMouseEnter={() => setAcknowledged(true)} style={{ cursor: 'crosshair' }}>
                      <div className="audit-label">Fragility Score <span style={{marginLeft: 'auto', display:'inline-block', float: 'right', color: 'var(--gold)', letterSpacing: 0}}>{acknowledged ? 'ACKNOWLEDGED' : 'Hover to acknowledge'}</span></div>
                      <div className="frag-row">
                        <div className="ring-wrap">
                          <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#c9a96e" strokeWidth="5"
                              strokeDasharray={201.06} 
                              strokeDashoffset={Math.max(0, 201.06 - (audit.inversion_threshold.fragility_delta / 100) * 201.06)} 
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="ring-inner">
                            <div className="ring-num">{audit.inversion_threshold.fragility_delta.toFixed(0)}</div>
                            <div className="ring-sub">/100</div>
                          </div>
                        </div>
                        <div className="frag-text">Primary assumption carries disproportionate weight. Systemic failure risk calibrated.</div>
                      </div>
                    </div>

                    <div className="audit-section">
                      <div className="audit-label">Cipher Verdict</div>
                      <div className={`verdict-box ${audit.inversion_threshold.fragility_delta > 30.0 ? 'warning' : ''}`}>
                        <div className="verdict-title">{audit.inversion_threshold.fragility_delta > 30.0 ? 'Halt Execution' : 'Proceed With Parameters'}</div>
                        <div className="verdict-text">
                          {hedged 
                            ? "ACTION SECURED: Algorithmic exposure successfully partitioned. Protective hedge parameters routed." 
                            : (audit.inversion_threshold.fragility_delta > 30.0 
                               ? "WARNING: Algorithmic confidence is highly levered to a single variable. Direct execution strongly unadvised."
                               : "Signal holds structural continuity. Recommend dynamic fractionated size scaling.")}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="action-bar" style={{borderBottom:'1px solid var(--ice-dim)'}}>
                {!hedged ? (
                    <>
                        <button className="act-btn btn-primary" disabled={!acknowledged}>
                          {acknowledged ? "Approve Algorithmic Size" : "Locked (Acknowledge Risk)"}
                        </button>
                        {/* Action 6: Deploy Automated Hedge */}
                    <button className="act-btn" onClick={() => setHedged(true)} disabled={!acknowledged} style={{borderColor:'var(--green)', color:'var(--green)', background:'var(--green-dim)'}}>
                      Deploy Protective Hedge
                    </button>
                    <button className="act-btn btn-ghost" disabled={!acknowledged} style={{borderColor:'var(--red)', color:'var(--red)'}}>Reject Hypothesis</button>
                </>
            ) : (
                <div style={{color:'var(--green)', fontSize:'14px', textAlign:'center', padding:'12px', letterSpacing:'0.1em', fontFamily:'var(--font-cormorant)', fontWeight:400}}>
                    [ EXECUTION PROTECTED ]
                </div>
            )}
            
          </div>
          <div style={{padding:'12px 20px'}}>
              {/* Action 5: Export JSON */}
              <button onClick={exportArtifact} className="act-btn btn-ghost" style={{borderColor:'transparent', opacity:1, color:'var(--ink-dim)'}}>↓ Export Forensic Artifact (.json)</button>
          </div>
         </>
        )}
        </div>

      </div>

      {/* COMMAND LINE TICKER */}
      <div className="ticker-wrap">
          <div className="ticker-track">
             {">>> INIT CIPHER CORE_LINK [OK] ... PIPELINE ESTABLISHED ... PARSING FEATURE WEIGHTS ... VOLATILITY BAND [±0.03] ... STRESS METRIC [30.0%] ... NOISE FILTRATION [ACTIVE] ... SENTINEL-LOGIC(v4.2.1) INTERCEPTING SIGNAL ... RECONSTRUCTING HUMAN CONVICTION ...  ".repeat(20)}
          </div>
      </div>
    </div>
  );
}
