# Cipher Mediation Layer Specifications

## 1. Signal_Artifact (JSON Schema)
The input payload intercepting AI confidence scores and feature weights.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "signal_id": { "type": "string" },
    "asset": { "type": "string", "description": "Target asset (e.g., AAPL)" },
    "direction": { "type": "string", "enum": ["Buy", "Sell", "Hold"] },
    "confidence": { "type": "number", "description": "0-100 score" },
    "feature_weights": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "feature": { "type": "string" },
          "weight": { "type": "number" },
          "volatility": { "type": "number" }
        },
        "required": ["feature", "weight"]
      }
    }
  },
  "required": ["signal_id", "asset", "direction", "confidence", "feature_weights"]
}
```

## 2. Audit_Artifact (JSON Schema)
The output payload after processing through the Three Pillars.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "signal_id": { "type": "string" },
    "assumption": { 
      "type": "string", 
      "description": "One-sentence Load-Bearing Assumption" 
    },
    "regime_audit": {
      "type": "object",
      "properties": {
        "failure_rate": { "type": "number", "description": "Percentage (0-100)" },
        "comparables": { "type": "array", "items": { "type": "string" } }
      }
    },
    "inversion_threshold": {
      "type": "object",
      "properties": {
        "fragility_delta": { "type": "number" },
        "breaking_point_shift": { "type": "number" },
        "load_bearing_feature": { "type": "string" }
      }
    },
    "human_conviction": { "type": "number", "description": "Confidence - Fragility" }
  },
  "required": ["signal_id", "assumption", "regime_audit", "inversion_threshold", "human_conviction"]
}
```
