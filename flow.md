what KisanLink actually does


                    KISANLINK
                        │
                        ▼
              ┌──────────────────┐
              │ Farmer selects   │
              │ crop + quantity  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ AGMARKNET prices │
              │ + market data    │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Price Forecast   │
              │ AI / ML          │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ NET REALIZATION  │
              │ Price - Costs    │
              └────────┬─────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Best market option │
             │ Mandi / Direct     │
             │ Buyer              │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Produce listing    │
             │ + Buyer matching   │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Negotiation / Deal │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Escrow simulation  │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Transporter        │
             │ dispatch           │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Delivery           │
             │ confirmation       │
             └─────────┬──────────┘
                       │
                       ▼
                  Settlement

How all the technical pieces connect

             ┌─────────────────────┐
             │       FRONTEND      │
             │ React + Vite        │
             └──────────┬──────────┘
                        │
                  REST API calls
                        │
                        ▼
             ┌─────────────────────┐
             │   SPRING BOOT API   │
             │     BACKEND         │
             └─────┬─────────┬─────┘
                   │         │
                   │         │
             Database        │ AI requests
                   │         │
                   ▼         ▼
             PostgreSQL   AI SERVICE
                           Python/
                           FastAPI
                              │
                              ▼
                         ML Models
