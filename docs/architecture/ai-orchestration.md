
# AI Orchestration Layer

```mermaid
flowchart LR

USER[User Request]

CHAT[AI Assistant]
SPEC[Specification Extraction]

BPE[Book Pricing Engine]
PRE[Preflight Engine]

INTEL[Production Intelligence]

MATCH[Printer Matchmaker]

USER --> CHAT
CHAT --> SPEC

SPEC --> BPE
SPEC --> PRE

BPE --> INTEL
PRE --> INTEL

INTEL --> MATCH

MATCH --> RESULT[Production Recommendation]

```

