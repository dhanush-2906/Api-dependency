# API Dependency Visualizer & Change Impact Analyzer

**UPS Hackathon 2026 - Use Case ID: 2026 GH-CTI-01**

A full-stack web application for enterprise microservice ecosystem visualization, dependency topology exploration, outage blast radius simulation, change impact analysis, and natural-language AI Architecture Copilot.

---

## Architecture Overview

`
                      +-----------------------------+
                      |   YAML Dataset (9 Files)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    YAML Parser & Loader     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Normalizer & Deduplicator  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Canonical Graph Model      |
                      |  (Provider -> Consumer)     |
                      +-------+--------------+------+
                              |              |
                +-------------+--+        +--+-------------+
                |                |        |                |
                v                v        v                v
          Upstream BFS    Downstream BFS  PathFinder   Metrics Engine
                |                |        |                |
                +-------------+--+--------+----------------+
                              |
                              +--------------------+
                              |                    |
                              v                    v
                      +---------------+   +-----------------------------+
                      |  REST API     |   | AI Architecture Copilot     |
                      |  (:5000)      |   | (Hugging Face / Llama 3.3)  |
                      +-------+-------+   +--------------+--------------+
                              |                          |
                              +------------+-------------+
                                           | JSON / HTTP
                                           v
                            +-----------------------------+
                            | React + React Flow (:5173)  |
                            | - Dagre Layout & Topology   |
                            | - Outage Blast Radius View  |
                            | - Change Impact Paths       |
                            | - Ecosystem CRUD Management |
                            | - AI Architecture Copilot   |
                            +-----------------------------+
`

---

## Core Principles & Semantics

1. **Canonical Edge Direction**: Provider -> Consumer (Forward = Downstream, Reverse = Upstream).
2. **Dataset Ingestion**:
   - dependencies entries are reversed into Provider -> Consumer.
   - consumers entries are directly mapped as Provider -> Consumer.
   - Edges declared across multiple files are deduplicated into single canonical edges.
3. **Direction-Aware Impact Propagation**:
   - Outage / Change Impact propagates downstream from the affected node toward dependent consumers.
   - Upstream components are contextual dependencies and are not assumed to fail symmetrically.
   - Direct impact: graph distance = 1; Indirect impact: graph distance > 1.
4. **Dynamic Computation**:
   - Zero hardcoded metrics or results. All connectivity counts, blast radius scores, and critical candidates are computed dynamically at runtime using in-memory graph traversals.

---

## AI Architecture Copilot

The **AI Architecture Copilot** extends the platform with an interactive, architecture-aware natural language assistant powered by **Hugging Face** (meta-llama/Llama-3.3-70B-Instruct).

### Key Capabilities
- **Architecture Q&A**: Answers topological questions grounded directly in the active in-memory graph.
- **Outage Blast Analysis**: Evaluates single and multi-component failure cascades with exact affected systems counts.
- **Explainability & Path Tracing**: Explains why systems are affected using calculated step-by-step breadcrumb paths (e.g. Auth Service -> Customer Service -> Customer Portal).
- **Risk & Single Point of Failure (SPOF) Analysis**: Highlights high-fanout services, central bottlenecks, and systemic risks.
- **Natural Language Ecosystem Modifications**: Interprets requests to create, update, or delete components or relationships, previews proposed changes with risk indicators, requires explicit user confirmation, and automatically triggers live graph hot-reloads.
- **FACT / INFERENCE / RECOMMENDATION Structuring**: Clearly demarcates measured topological data from architectural deductions and engineering advice.

### Hugging Face Configuration
Configure the token in ackend/.env:
`env
PORT=5000
HF_TOKEN=your_hugging_face_token_here
HF_MODEL=meta-llama/Llama-3.3-70B-Instruct
`

### Security & Grounding Model
- HF_TOKEN is strictly maintained server-side and never leaked to the browser or frontend.
- Deterministic graph calculations remain the authoritative source of truth. The AI does not invent nodes, edges, or impact metrics.
- Destructive operations (component deletion, relationship changes) require explicit confirmation before execution.

---

## Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Run Automated Test Suite
`ash
cd backend
npm test
`
Runs all 42 unit and integration test cases verifying parser, normalization, BFS traversals, cycle safety, metrics computation, ecosystem CRUD persistence, entity resolution, and AI Copilot intent extraction/execution.

### 2. Start Backend Server
`ash
cd backend
npm start
`
Backend runs on http://localhost:5000.

### 3. Start Frontend Development Server
In a new terminal:
`ash
cd frontend
npm run dev
`
Frontend runs on http://localhost:5173.

---

## REST API Documentation

| Endpoint | Method | Description |
|---|---|---|
| /api/health | GET | Health status and timestamp |
| /api/components | GET | List all identified ecosystem components (supports ?type= filter) |
| /api/components | POST | Create a new user-defined component |
| /api/components/:id | GET | Get component metadata, direct/indirect upstream & downstream reach |
| /api/components/:id | PUT | Update an existing component's type, dependencies, or consumers |
| /api/components/:id | DELETE | Remove a component from the ecosystem |
| /api/components/reset | POST | Reset ecosystem to original seed YAML dataset |
| /api/graph | GET | Returns normalized nodes and canonical edges for visualization |
| /api/impact/failure/:id | GET | Simulates service outage and computes downstream blast radius |
| /api/impact/change/:id | GET | Analyzes downstream change impact and affected applications |
| /api/metrics | GET | Dynamically calculated ecosystem metrics and candidate scores |
| /api/validation | GET | Dataset validation report and schema integrity status |
| /api/ai/chat | POST | Interact with the AI Architecture Copilot via natural language |
| /api/ai/execute | POST | Execute confirmed architecture mutations proposed by the AI |
| /api/ai/suggestions | GET | Contextual prompt suggestions based on active graph state |

---

## Demo Walkthrough

1. **Dashboard & Metrics**: Open http://localhost:5173. Notice dynamic counts for Microservices, Applications, Databases, External Gateways, Most Connected Service, and Candidate Critical Service.
2. **AI Architecture Copilot**: Click the **AI Copilot** button in the header (or floating launcher in bottom-right, or press Ctrl+J).
   - Try prompt: *"Summarize my architecture"*
   - Try prompt: *"What happens if Auth Service fails?"*
   - Try prompt: *"Why is Customer Portal affected by Auth Service?"*
   - Try prompt: *"What are the biggest architectural risks?"*
   - Try prompt: *"Create Notification Service as an API depending on Auth Service and consumed by Customer Portal"*
   - Review the **Change Preview Card** and click **Confirm & Apply**. Notice the graph, metric cards, and sidebar immediately update without reloading the page!
3. **Interactive Graph**: Pan, zoom, click nodes, or toggle between Horizontal (Left-to-Right) and Vertical (Top-to-Bottom) Dagre layouts.
4. **Outage Simulation**:
   - Select Auth Service and click **Simulate Outage**.
   - Observe the pulsating Crimson Red root node, Direct impacted nodes (1 hop), Indirect impacted nodes (2+ hops), and affected end-user applications highlighted with glowing animated edges.
5. **Change Impact Analysis**:
   - Select Inventory Service and click **Analyze Change Impact**.
   - Review explainable dependency paths (e.g. Inventory Service -> Order Service -> Invoice Service).