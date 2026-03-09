---
title: Preflight Engine
---

# Preflight Engine

The **Preflight Engine** is the technical analysis layer of the PrintPrice platform.

Its responsibility is to analyze uploaded PDF files and determine whether they are technically safe and suitable for industrial print production.

The system performs deterministic analysis to extract structural and production-relevant properties from each document.

---

## Purpose

The Preflight Engine ensures that a document can be manufactured correctly before routing it to a production partner.

It detects potential issues such as:

- missing bleed
- incorrect color spaces
- excessive ink coverage
- low resolution images
- geometry inconsistencies
- missing fonts

These findings are structured and passed to downstream components of the platform.

---

## Analysis Pipeline

The Preflight analysis pipeline typically follows these steps:

1. File ingestion
2. PDF structure inspection
3. Geometry extraction
4. Image and color analysis
5. Production constraint evaluation
6. Structured findings generation

The output becomes part of the overall production intelligence report.

---

## Deterministic Analysis

Unlike heuristic systems, the PrintPrice Preflight Engine focuses on deterministic extraction of PDF facts.

Examples include:

- exact page count
- trim box dimensions
- bleed box values
- image DPI
- color space usage
- font embedding status
- total ink coverage (TAC)

These facts form the foundation of later decisions.

---

## Integration with Production Intelligence

The Preflight Engine feeds several downstream components.

### Intent Detection

Document characteristics help determine the publication type:

- novel
- photo book
- catalog
- booklet

### Binding Intelligence

Geometry and page counts are used to calculate theoretical spine values and binding feasibility.

### Compatibility Engine

Technical findings are compared against printer capabilities and production constraints.

---

## Structured Findings

The Preflight Engine produces structured findings that describe detected issues.

Each finding typically includes:

- severity
- scope
- message
- evidence

Example:

```json
{
  "severity": "warning",
  "scope": "preflight",
  "message": "Image resolution below recommended minimum",
  "details": {
    "detected_dpi": 210,
    "recommended_dpi": 300
  }
}
