# API Dependency Visualizer & Change Impact Analyzer

**UPS Hackathon 2026 — Use Case ID: 2026 GH-CTI-01**

A full-stack web application for enterprise microservice ecosystem visualization, dependency topology exploration, outage blast radius simulation, and change impact analysis.

---

## Architecture Overview

```
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
                              v
                      +-----------------------------+
                      | Express REST API (:5000)    |
                      +--------------+--------------+
                                     | JSON / HTTP
                                     v
                      +-----------------------------+
                      | React + React Flow (:5173)  |
                      | - Dagre Layout              |
                      | - Outage Blast Radius View  |
                      | - Change Impact Paths       |
                      | - Real-Time Search & Stats  |
                      +-----------------------------+
```

---

## Core Principles & Semantics

1. **Canonical Edge Direction**: `Provider ? Consumer` (Forward = Downstream, Reverse = Upstream).
2. **Dataset Ingestion**:
   - `dependencies` entries are reversed into `Provider ? Consumer`.
   - `consumers` entries are directly mapped as `Provider ? Consumer`.
   - Edges declared across multiple files are deduplicated into single canonical edges.
3. **Direction-Aware Impact Propagation**:
   - Outage / Change Impact propagates **downstream** from the affected node toward dependent consumers.
   - Upstream components are contextual dependencies and are not assumed to fail symmetrically.
   - Direct impact: graph distance $= 1$; Indirect impact: graph distance $> 1$.
4. **Dynamic Computation**:
   - Zero hardcoded metrics or results. All connectivity counts, blast radius scores, and critical candidates are computed dynamically at runtime using in-memory graph traversals.

---

## Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Run Automated Test Suite
```bash
npm test
```
Runs all 20 unit and integration test cases verifying parser, normalization, BFS traversals, cycle safety, metrics computation, and REST endpoints.

### 2. Start Backend Server
```bash
cd backend
npm start
```
Backend runs on `http://localhost:5000`.

### 3. Start Frontend Development Server
In a new terminal:
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## REST API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health status and timestamp |
| `/api/components` | GET | List all identified ecosystem components (supports `?type=` filter) |
| `/api/components/:id` | GET | Get component metadata, direct/indirect upstream & downstream reach |
| `/api/graph` | GET | Returns normalized nodes and canonical edges for visualization |
| `/api/impact/failure/:id` | GET | Simulates service outage and computes downstream blast radius |
| `/api/impact/change/:id` | GET | Analyzes downstream change impact and affected applications |
| `/api/metrics` | GET | Dynamically calculated ecosystem metrics and candidate scores |
| `/api/validation` | GET | Dataset validation report and schema integrity status |

---

## Demo Walkthrough

1. **Dashboard & Metrics**: Open `http://localhost:5173`. Notice dynamic counts for Microservices, Applications, Databases, External Gateways, Most Connected Service, and Candidate Critical Service.
2. **Search & Exploration**: Type in the search box to filter by name or click category chips (`SERVICE`, `APPLICATION`, `DATABASE`, `EXTERNAL`).
3. **Interactive Graph**: Pan, zoom, click nodes, or toggle between Horizontal (Left-to-Right) and Vertical (Top-to-Bottom) Dagre layouts.
4. **Outage Simulation**:
   - Select `Auth Service` (or any service) and click **Simulate Failure (Outage)**.
   - Observe the pulsating Crimson Red root node, Direct impacted nodes (1 hop), Indirect impacted nodes (2+ hops), and affected end-user applications highlighted with glowing animated edges.
5. **Change Impact Analysis**:
   - Select `Inventory Service` and click **Analyze Change Impact**.
   - Review explainable dependency paths (e.g. `Inventory Service ? Order Service ? Invoice Service`).
6. **Reset View**: Click **Reset Simulation** to return the topology to normal exploration mode.
