---
title: Platform Architecture
---

# PrintPrice Platform Architecture

The PrintPrice platform is built as a modular system composed of multiple specialized engines.

Each engine performs a specific responsibility within the document production pipeline.

This architecture enables the platform to scale from simple price estimation to full manufacturing orchestration.

---

## Core Engines

The platform consists of several key subsystems.

### Book Pricing Engine (BPE)

Calculates production cost estimates based on book specifications.

Inputs include:

- trim size
- page count
- paper type
- binding
- print quantity

The engine produces deterministic cost estimates used in later routing decisions.

---

### Preflight Engine

Analyzes uploaded PDF files and extracts technical production data.

Examples include:

- page geometry
- bleed detection
- color space usage
- image resolution
- ink coverage

These facts form the foundation of production analysis.

---

### Production Intelligence

Interprets the document in the context of real manufacturing workflows.

Responsibilities include:

- publication intent detection
- binding feasibility analysis
- specification cross-checking

---

### Compatibility Engine

Evaluates whether a printer can produce a given job.

Compatibility scoring includes:

- physical constraints
- operational constraints
- production limitations

---

### Matchmaker Engine

Selects the best printer candidate from the network.

Decisions are based on:

- compatibility scores
- economic factors
- routing logic

---

## Pipeline Flow

The architecture follows a sequential pipeline.

Document Upload  
→ Preflight Analysis  
→ Production Intelligence  
→ Compatibility Evaluation  
→ Matchmaker Selection  
→ Production Routing

Each stage enriches the job with additional knowledge.

---

## Design Philosophy

The PrintPrice architecture is based on several principles:

- deterministic analysis
- modular engines
- explainable decisions
- structured data exchange

These principles enable reliable automated production workflows.

## Architecture Diagram

```mermaid
flowchart LR

USER[User]

BPE[Book Pricing Engine]
PRE[Preflight Engine]
INT[Production Intelligence]
COMP[Compatibility Engine]
MATCH[Matchmaker]

PRINTER[Printer Network]

USER --> BPE
BPE --> PRE
PRE --> INT
INT --> COMP
COMP --> MATCH
MATCH --> PRINTER
```


## Architecture Diagram

```mermaid
flowchart LR

USER[User / Client]
UI[Web Interface]

BPE[Book Pricing Engine]
PRE[Preflight Engine]
INT[Production Intelligence]
COMP[Compatibility Engine]
MATCH[Matchmaker Engine]
PNET[Printer Network]

USER --> UI
UI --> BPE
UI --> PRE
BPE --> INT
PRE --> INT
INT --> COMP
COMP --> MATCH
MATCH --> PNET

## Architecture Diagram

```mermaid
flowchart LR

USER[User / Client]
UI[Web Interface]

BPE[Book Pricing Engine]
PRE[Preflight Engine]
INT[Production Intelligence]
COMP[Compatibility Engine]
MATCH[Matchmaker Engine]
PNET[Printer Network]

USER --> UI
UI --> BPE
UI --> PRE
BPE --> INT
PRE --> INT
INT --> COMP
COMP --> MATCH
MATCH --> PNET

## Architecture Diagram

::: mermaid
flowchart LR

USER[User / Client]
UI[Web Interface]

BPE[Book Pricing Engine]
PRE[Preflight Engine]
INT[Production Intelligence]
COMP[Compatibility Engine]
MATCH[Matchmaker Engine]
PNET[Printer Network]

USER --> UI
UI --> BPE
UI --> PRE
BPE --> INT
PRE --> INT
INT --> COMP
COMP --> MATCH
MATCH --> PNET
:::

