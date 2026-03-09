---
title: Book Pricing Engine
---

# Book Pricing Engine

The **Book Pricing Engine (BPE)** is the economic core of the PrintPrice platform.

Its role is to transform a structured print specification into a deterministic production cost estimate based on real manufacturing parameters.

The BPE is not a generic calculator.  
It is a production-aware pricing system designed specifically for book and print manufacturing workflows.

---

## Purpose

The BPE calculates the estimated cost of producing a print job using a combination of:

- paper properties
- page count
- trim size
- binding type
- color configuration
- print run
- printer-specific production profiles

It provides the financial foundation for:

- quote generation
- print-house comparison
- routing optimization
- production planning

---

## Core Inputs

The BPE consumes a normalized production specification.

Typical fields include:

- trim width and height
- interior page count
- cover page count
- binding method
- interior paper type
- interior paper grammage
- cover paper type
- cover paper grammage
- endpapers
- print run
- country / destination

These values may originate from:

- the user interface
- the AI assistant
- imported payloads
- BPE smoke-test tools

---

## Core Calculations

The BPE calculates multiple components of production cost.

### Paper Cost
Determines paper consumption based on:

- trim format
- page count
- paper selection
- waste factors
- printer configuration

### Printing Cost
Calculates print cost based on:

- black and white vs color
- interior printing method
- cover printing method
- machine profile
- setup costs

### Binding Cost
Calculates the finishing and binding cost for:

- perfect binding
- saddle stitching
- hardcover case binding
- sewn binding

### Additional Components
Supports optional cost elements such as:

- endpapers
- varnish
- special finishing
- extra setup
- fixed or variable surcharges

---

## Canonical Data Model

The internal normalized output of the BPE should align with the platform-wide production specification model.

Example:

```json
{
  "bindingType": "perfect",
  "trimWidthMm": 148,
  "trimHeightMm": 210,
  "pageCount": 320,
  "paperType": "uncoated",
  "paperGsm": 90,
  "hasEndpapers": false,
  "printRun": 2000
}


