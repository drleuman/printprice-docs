---
name: printprice-api-diagrams
description: Generates and audits professional, responsive technical architecture and sequence diagrams (Mermaid and D2 SVG) for PrintPrice OS documentation (docs.printprice.pro) adhering strictly to verified API contracts, WCAG AA accessibility, Light/Dark theme compatibility, and the industrial red (#E53935) visual identity.
---

# PrintPrice OS API & Architecture Diagrams Skill

Esta skill define el estándar corporativo para la creación, estilización y mantenimiento de diagramas técnicos en **PrintPrice OS** y su plataforma de documentación (`docs.printprice.pro`).

---

## 1. Principios Fundamentales

1. **Verdad de Código y Arquitectura**:
   - Todo diagrama debe representar **únicamente contratos, microservicios, bases de datos y flujos verificados** en los repositorios (`ppos-control-plane`, `ppos-preflight-service`, gateway, etc.).
   - Prohibido inventar rutas, SDKs inexistentes, endpoints administrativos bajo apariencia pública o funcionalidades en estado `PLANNED` sin etiquetado explícito.
2. **Identidad Visual Industrial (Rojo / Negro / Neutro)**:
   - **Rojo de Imprenta (Acento Principal)**: `#E53935` (hover/glow: `#FF5252`, deep: `#B71C1C`).
   - **Canvas Oscuro (Dark Theme)**: `#0B0D12` (superficie de nodos: `#151820`, bordes: `#262B36`).
   - **Canvas Claro (Light Theme)**: `#FFFFFF` (superficie de nodos: `#F8FAFC`, bordes: `#E2E8F0`).
   - **Tipografía**: `Inter, system-ui, -apple-system, sans-serif` para etiquetas y `Fira Code, SFMono-Regular, monospace` para rutas HTTP y métodos.
   - **Prohibición Absoluta**: **Cero acentos azules o cian**. Los enlaces, cajas y flechas deben seguir la paleta roja y gris pizarra neutra (`#64748B` / `#94A3B8`).
3. **Responsive y Accesibilidad**:
   - Todo diagrama debe renderizarse con `max-width: 100%`, escalado SVG nativo y contenedor con scroll horizontal suave (`overflow-x: auto`) para pantallas móviles de 320px, 360px y 390px.
   - Textos con contraste WCAG AA mínimo (4.5:1) en modo claro y oscuro.
4. **Tecnología Primaria vs Secundaria**:
   - **Mermaid (`markdown: { mermaid: true }`)**: Tecnología principal embebida en Markdown de Docusaurus. Cero dependencias externas en tiempo de compilación.
   - **D2**: Tecnología opcional para mapas arquitectónicos de alta densidad, exportada a SVG estático optimizado con `<svg role="img">` y metadata de accesibilidad.

---

## 2. Paleta Cromática y Tokens Mermaid

Los diagramas Mermaid en Docusaurus deben utilizar clases semánticas mediante directivas `classDef`:

```mermaid
%% Declaración de clases corporativas PrintPrice OS
classDef primaryNode fill:#151820,stroke:#E53935,stroke-width:2px,color:#FFFFFF;
classDef accentNode fill:#E53935,stroke:#B71C1C,stroke-width:2px,color:#FFFFFF;
classDef serviceNode fill:#1A1E29,stroke:#3B4252,stroke-width:1.5px,color:#E2E8F0;
classDef storageNode fill:#11141C,stroke:#E53935,stroke-dasharray: 4 2,color:#F8FAFC;
classDef externalNode fill:#0F1218,stroke:#64748B,stroke-dasharray: 5 5,color:#94A3B8;
classDef routerNode fill:#1F2430,stroke:#FF5252,stroke-width:2px,color:#FFFFFF;
```

---

## 3. Catálogo de Plantillas Disponibles

Las plantillas listas para usar se encuentran en la carpeta `templates/`:

1. [`templates/architecture.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/architecture.mermaid):
   - Mapeo perimetral: Cliente → Gateway `api.printprice.pro` → Control Plane `:8080` / Preflight Service `:8001` / BPE `:8004` / MySQL & Redis / Webhook Outbox Worker.
2. [`templates/pricing-bpe.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/pricing-bpe.mermaid):
   - Flujo de cotización algorítmica: JSON Payload → Validación Fastify (`x-trace-id`) → BPE (pliegos, imposición, perfiles de máquina, mermas) → Desacoplamiento de costes directos vs márgenes comerciales → Ofertas con `evidenceId` y `selectedVariantId`.
3. [`templates/preflight-lifecycle.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/preflight-lifecycle.mermaid):
   - Ciclo de inspección y corrección PDF: Capabilities → Carga multipart (hasta 2GB) → Inspección asíncrona (BleedBox, TrimBox, TAC, Fuentes) → Reporte JSON + Token visual (`HUMAN_REPORT_VIEW`) → Acción de corrección asistida (`POST /actions/fix`).
4. [`templates/sequence-http.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/sequence-http.mermaid):
   - Flujo síncrono estándar de petición y respuesta con encabezados de seguridad y códigos de estado.
5. [`templates/auth-tokens.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/auth-tokens.mermaid):
   - Gobernanza de credenciales M2M: API Key (`ppos_live_*`), Marketplace Token (`X-Marketplace-Token`), JWT efímero y scopes (`preflight:write`, `jobs:read`).
6. [`templates/webhooks-outbox.mermaid`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/.agents/skills/printprice-api-diagrams/templates/webhooks-outbox.mermaid):
   - Patrón Transactional Outbox, persistencia de eventos, worker de envío asíncrono con backoff exponencial y firma criptográfica HMAC-SHA256 (`X-PPOS-Signature`).

---

## 4. Guía de Inclusión en Docusaurus

Para renderizar un diagrama en cualquier página de documentación:

1. Abrir o crear el archivo Markdown (`docs/**/*.md`).
2. Declarar el bloque de código con el identificador ````mermaid`.
3. Incluir las directivas de tema y clases corporativas.
4. Ejecutar `yarn build` para validar que el analizador de Mermaid compile sin advertencias de sintaxis.

---

## 5. Validación y Criterios de Aceptación

- [ ] **Sin errores de compilación**: `yarn build` finaliza con código 0.
- [ ] **Contraste y Color**: Nodo activo y resaltados en `#E53935` / `#FF5252`. Cero azul `#0000FF` o `#00BFFF`.
- [ ] **Modo Claro / Oscuro**: El diagrama es perfectamente legible en ambos modos de color.
- [ ] **Responsive**: En viewport móvil (390px y 360px), el diagrama no rompe la página horizontalmente y permite desplazamiento fluido del SVG.
