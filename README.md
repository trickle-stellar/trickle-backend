# Trickle Backend

NestJS API server for the Trickle streaming payments platform on Stellar/Soroban.

## Overview

This backend provides REST APIs for interacting with on-chain Soroban contracts:
- **Stream** — create, fund, withdraw from, and query streams
- **Factory** — deploy new stream contract instances via the factory pattern
- **MultiStream** — manage weighted multi-recipient streams
- **Vesting** — create and claim vesting schedules
- **Stream NFT** — wrap streams as tradeable NFTs
- **Fees** — query and configure platform fees
- **Indexer** — event history and state sync

## Architecture

```
Client (Frontend / Freighter wallet)
    │
    ▼
NestJS API (this repo)
    ├── Auth: Freighter challenge/verify + API keys
    ├── Soroban RPC: contract simulation, state queries
    ├── Horizon: account history, transaction lookups
    └── Postgres: cached state, API keys, event history
    │
    ▼
Soroban Contracts (on-chain)
```

**Key design decisions:**
- **Auth:** Freighter wallet signing (users) + API keys (service-to-service)
- **Real-time balance queries** (`getClaimable`) always go directly to Soroban RPC — never cached
- **Cached state** (stream info, status, amounts) lives in Postgres, updated by periodic state sync
- **Event indexing** persists all on-chain events for history queries
- **Claimable balance endpoint is the reference implementation** — full Soroban RPC call pattern

## Tech Stack

| Layer        | Technology             |
| ------------ | ---------------------- |
| Framework    | NestJS 11              |
| Language     | TypeScript 5.7         |
| ORM          | TypeORM 0.3            |
| Database     | PostgreSQL 16          |
| Auth         | passport-jwt + Freighter |
| Stellar SDK  | @stellar/stellar-sdk 13 |
| API Docs     | Swagger/OpenAPI (via @nestjs/swagger) |

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or use Docker)
- pnpm (recommended) or npm

### Quick Start (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Manual Setup

```bash
cp .env.example .env    # edit with your values
npm install
npm run migration:run
npm run start:dev
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_USER` | Database user | `trickle` |
| `POSTGRES_PASSWORD` | Database password | `trickle_dev` |
| `POSTGRES_DB` | Database name | `trickle` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://soroban-rpc.testnet.stellar.org` |
| `SOROBAN_NETWORK_PASSPHRASE` | Soroban network | `Test SDF Network ; September 2015` |
| `HORIZON_URL` | Stellar Horizon endpoint | `https://horizon-testnet.stellar.org` |
| `STELLAR_NETWORK_PASSPHRASE` | Stellar network | `Test SDF Network ; September 2015` |
| `FACTORY_CONTRACT_ADDRESS` | Deployed factory contract | (required for create endpoints) |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |

### Auth — `/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/challenge` | — | Get signing challenge for Freighter |
| `POST` | `/auth/verify` | Freighter signed XDR | Verify wallet and return JWT |
| `GET` | `/auth/me` | JWT | Get current user info |
| `POST` | `/auth/api-keys` | JWT | Generate API key |
| `GET` | `/auth/api-keys` | JWT | List API keys |
| `DELETE` | `/auth/api-keys/:id` | JWT | Revoke API key |

### Streams — `/streams`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/streams` | Freighter | Create stream via factory |
| `GET` | `/streams/:address` | — | Get stream info (cached) |
| `POST` | `/streams/:address/fund` | Freighter | Fund stream |
| `POST` | `/streams/:address/withdraw` | Freighter | Withdraw from stream |
| `GET` | `/streams/:address/balance` | — | **Real-time claimable balance (Soroban RPC)** |
| `GET` | `/streams/sender/:sender` | — | List streams by sender |
| `GET` | `/streams/recipient/:recipient` | — | List streams by recipient |
| `GET` | `/streams/history/:address` | — | Stream event history |
| `POST` | `/streams/:address/cancel` | Freighter | Cancel stream |

### MultiStreams — `/multistreams`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/multistreams` | Freighter | Create multistream |
| `GET` | `/multistreams/:address` | — | Get multistream info |
| `POST` | `/multistreams/:address/recipients` | Freighter | Add recipient |
| `DELETE` | `/multistreams/:address/recipients/:recipient` | Freighter | Remove recipient |
| `POST` | `/multistreams/:address/withdraw` | Freighter | Withdraw |
| `GET` | `/multistreams/:address/claimable/:recipient` | — | **Real-time claimable (Soroban RPC)** |

### Vesting — `/vesting`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/vesting` | Freighter | Create vesting schedule |
| `GET` | `/vesting/:address` | — | Get vesting info |
| `POST` | `/vesting/:address/claim` | Freighter | Claim vested tokens |
| `POST` | `/vesting/:address/revoke` | Freighter | Revoke schedule |
| `GET` | `/vesting/:address/claimable/:beneficiary` | — | **Real-time claimable (Soroban RPC)** |

### Stream NFT — `/stream-nft`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/stream-nft` | Freighter | Create stream NFT |
| `GET` | `/stream-nft/:address` | — | Get NFT info |
| `POST` | `/stream-nft/:address/transfer` | Freighter | Transfer NFT |
| `POST` | `/stream-nft/:address/withdraw` | Freighter | Withdraw from NFT |

### Fees — `/fees`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/fees` | — | Get fee info |
| `GET` | `/fees/calculate` | — | Calculate fee for amount |
| `POST` | `/fees` | API Key | Set fee percentage (admin) |
| `POST` | `/fees/withdraw` | API Key | Withdraw accumulated fees (admin) |

### Indexer — `/indexer`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/indexer/events` | — | Query historical events |
| `POST` | `/indexer/sync/:address` | API Key | Trigger manual state sync |

## Development

### Commands

```bash
npm run start:dev          # Development server with hot reload
npm run build              # Production build
npm run test               # Unit tests
npm run test:cov           # Coverage report
npm run migration:run      # Run database migrations
npm run migration:revert   # Revert last migration
```

### Project Structure

```
src/
├── main.ts                    # Bootstrap, global pipes, Swagger
├── app.module.ts              # Root module
├── config/                    # Environment configuration
├── database/                  # TypeORM, migrations
├── common/                    # Shared decorators, guards, filters, DTOs
│   ├── decorators/            # @CurrentUser, @Public, @UseApiKey
│   ├── guards/                # JwtAuthGuard, ApiKeyGuard
│   ├── interceptors/          # Logging, Transform
│   ├── filters/               # Exception filters
│   ├── entities/              # BaseEntity
│   └── dto/                   # PaginationDto
└── modules/
    ├── stellar/               # StellarService (Horizon + Soroban RPC)
    ├── auth/                  # Freighter wallet auth + API keys
    ├── stream/                # Stream CRUD + real-time balance
    ├── factory/               # Factory contract interactions
    ├── multistream/           # Multi-recipient stream ops
    ├── vesting/               # Vesting schedule ops
    ├── stream-nft/            # Stream NFT ops
    ├── fees/                  # Fee management
    └── indexer/               # Event + state sync
```

### Adding a New Endpoint

1. Create or update the service in the appropriate module
2. Create the controller method with `@Api*` decorators
3. Add DTO validation with `class-validator` if needed
4. If the endpoint hits Soroban RPC: use `StellarService` methods
5. If the endpoint needs caching: use Postgres entity + TypeORM repo
6. Add tests in `*.spec.ts` co-located with the service/controller

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full guidelines.

## License

MIT
