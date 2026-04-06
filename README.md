# Cipher Mediation Layer

**Cipher** is a highly specialized "Dark Luxury" quantitative forensic dashboard and interactive mediation layer. It acts as a strict human-in-the-loop (HITL) gatekeeper, intercepting opaque statistical algorithmic trading signals and semantically mapping their load-bearing vulnerabilities before execution. 

Unlike traditional math-only quantitative risk systems that exclusively rely on Value at Risk (VaR) or hard volatility thresholds, Cipher incorporates a dynamic C++ fragility engine bridged natively to a Generative AI interception pipeline. The result is a mathematically rigorous, yet entirely human-readable "cross-examination" of trading logic.

## 🏗️ Architectural Overview
The architecture strictly enforces separation of concerns across a hybrid stack, relying on high-performance native math compiled via MSYS2 alongside a dynamic, rich React/Next.js interface.

### The Stack
-   **Frontend / UI:** Next.js (App Router), TypeScript, Vanilla CSS (Bespoke "Dark Luxury" CSS variables handling glassmorphism, z-index isolation, and cubic-bezier kinematrix micro-animations).
-   **Mediation API:** Node.js API Route (`/api/process/route.ts`) executing synchronous temporary file stream I/O for native process parsing.
-   **Quantitative Math Engine:** Native C++ Executable (`sentinel_logic.exe`) processing recursive structural `Fragility_Delta` derivations.
-   **Generative AI Pipeline:** Google `@google/genai` (Gemini 2.5 Pro) intercepting algorithm logs to provide adversarial semantic counter-arguments.

---

## ⚙️ Core System Loop

### 1. The Payload Aggregator
Signals are structured as strict JSON payloads containing `signal_id`, `direction`, `confidence`, and an array of `feature_weights` (containing statistical weights and local trailing volatility mappings). 

### 2. Node.js `execPromise` Native Invocation
When a telemetry card is loaded from the signal queue or forcefully run via the dynamic `stress_shift_pct` slider in Pillar III, the React Client pushes the payload to the Next.js API. 
1.  The API intercepts the JSON and executes a physical file stream write (`fs.writeFileSync`) to write a localized `temp_input.json`.
2.  Node then initiates an `execPromise` call to boot the native C++ executable: `sentinel_logic.exe temp_input.json`.

### 3. The C++ Sentinel Engine
The C++ core parses the active trailing variables, locating the highest-weight predictive feature to isolate the "Assumption". It runs a fundamental inversion formula:
`fragility_delta = (weight_shift * 100) * (1.0 + primary_volatility)`
`breaking_point_shift = (distance_to_inversion / fragility_delta) * stress_shift_pct`
It writes this strict output math directly to stdout, where the Node server captures and parses the JSON response string.

### 4. Generative AI Interception (Devil's Advocate Protocol)
The system leverages an LLM inference request passing strictly the `load_bearing_feature`. The system isolates the AI conceptually, forcing an adversarial prompt pattern: *“Act as a hostile auditor. Provide a 2-sentence negative macro contradiction regarding [X feature] offering sustained structural edge.”* This allows quantitative traders to instantly read statistical edge cases natively without digging through backtest logs.

---

## 🖥️ UI & Interface Mechanics

The interface is mapped to three central forensic pillars:
1.  **Pillar I (Semantics):** Maps the primary structural assumption. Equipped with a custom interactive state hook to deploy the opposing LLM challenge data on command.
2.  **Pillar II (Regime Analog):** Provides failure rates mapped to distinct fundamental analogues across market history (e.g., "2021 Liquidation Cascade", "2022 FTX Contagion") structurally mapped dynamically via algorithm target classification.
3.  **Pillar III (Matrix Simulation):** Features a dynamic slider connected to a `softLoad` state array. Rather than completely unmounting the DOM to run `fetchAudit()`, dragging the slider and calculating the matrix forces a silent API post request. The API reruns the C++ execution with a newly weighted `stress_shift_pct` and maps purely the right-column Verdict box logic (D.R.Y rendering optimization).

### Operational Guardrails
- **Automated Protective Hedging:** Approving algorithmic execution is hard-locked (`disabled={!acknowledged}`) until the user visually acknowledges the `Fragility_Delta` stroke-dash offset metrics mapping the SVGs in the right-hand audit frame. 
- **Forensic Artefact Exportation:** Allows traders to dump the localized operational DOM string mappings and C++ outputs into a highly structured `.json` Blob, enabling instantaneous post-execution auditing trails dynamically pushed to the user's local disk via `URL.createObjectURL(blob)`.

---

## 🛠️ Local Development & Compilation

To run the Cipher mediation layer locally, you must successfully compile the native math engine and supply valid API credentials for the LLM translation model.

**1. Install Dependencies**
```bash
cd cipher-ui
npm install
```

**2. Compile the C++ Engine**
You must install a valid C++ compiler (like GCC via MSYS2 for Windows).
```bash
cd sentinel_logic
g++ main.cpp -o sentinel_logic.exe
```

**3. Configure Environment Variables**
Include global credentials for the Google GenAI SDK to enable semantic decoding. Ensure `.env` is securely wrapped by your `.gitignore`.
```env
VITE_GEMINI_API_KEY=your_key_here
```

**4. Spin up the Next.js Client**
```bash
cd cipher-ui
npm run dev
```

*Architected by AB Labs.*
