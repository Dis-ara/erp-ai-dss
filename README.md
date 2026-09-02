# AI-Based Intelligent ERP Decision Support System for SMEs

**KDU IT3182 – Essentials of Artificial Intelligence | Group 26**

An ERP decision support system for SME inventory management that combines:
1. **Demand Forecasting** — scikit-learn linear regression on historical sales
2. **Fuzzy Logic Risk Assessment** — scikit-fuzzy, evaluating stock level vs. predicted demand vs. supplier lead time
3. **Rule-Based Reasoning** — converts forecast + risk into a reorder recommendation (human-in-the-loop; the system recommends, it never auto-orders)

## Architecture

```
React Frontend (Vite + Tailwind)
        │
        ▼
Node.js/Express API  ──────►  MongoDB (products, sales, suppliers, inventory transactions)
        │
        ▼
Python AI Service (FastAPI)
   ├─ demand_forecasting.py  (scikit-learn)
   ├─ fuzzy_risk.py          (scikit-fuzzy)
   └─ rule_based.py          (business rules)
```

## Project structure

```
erp-dss-project/
├── backend/          # Node.js + Express + MongoDB REST API
├── ai-service/        # Python FastAPI AI microservice
├── frontend/          # React + Tailwind dashboard
└── README.md
```

## Getting started

### 1. AI service (Python)

```bash
cd ai-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py            # runs on http://localhost:8000
```

### 2. Backend (Node.js)

```bash
cd backend
cp .env.example .env     # fill in your MONGO_URI (MongoDB Atlas or local)
npm install
npm run seed              # optional: loads sample products/sales
npm run dev                # runs on http://localhost:5000
```

### 3. Frontend (React)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # runs on http://localhost:5173
```

Open http://localhost:5173 — the **AI Recommendations** tab calls the full
pipeline (forecast → fuzzy risk → rule-based recommendation) for every
product with sales history.

## API overview

| Method | Endpoint                          | Description                          |
|--------|------------------------------------|---------------------------------------|
| GET    | /api/products                      | List products                        |
| POST   | /api/products                      | Create product                       |
| GET    | /api/suppliers                     | List suppliers                       |
| POST   | /api/suppliers                     | Create supplier                      |
| POST   | /api/sales                         | Record a sale                        |
| POST   | /api/inventory/transactions        | Record stock IN/OUT                  |
| GET    | /api/inventory/summary             | Dashboard summary                    |
| GET    | /api/ai/recommend                  | AI recommendation for all products   |
| GET    | /api/ai/recommend/:productId       | AI recommendation for one product    |

## Team (Group 26)

| Member | Responsibility |
|--------|-----------------|
| HMCK Wasala | AI & Demand Forecasting |
| DG Aluthge | Fuzzy Logic & Rule-Based System |
| P.S.T. Perera | Backend & Database |
| AK Weerasekara | Frontend & Dashboard |
