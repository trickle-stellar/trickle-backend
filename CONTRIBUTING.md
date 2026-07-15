# Contributing to Trickle Backend

Welcome — thanks for helping build Trickle. This guide covers the backend API server.

## Quick Links

- [trickle-contracts](../trickle-contracts/CONTRIBUTING.md) — Smart contract tasks
- [Issue Board](https://github.com/your-org/trickle/issues) — Find tasks labeled `backend`, `api`, `stellar`, `bug`
- **`good first issue`** = no prior context needed, scoped to 1 file/module

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- pnpm or npm
- Basic NestJS knowledge

## Getting Started

```bash
cd trickle-backend
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

The server starts on `http://localhost:3000`. Swagger docs at `/api/docs`.

## Branch & Commit

```bash
git checkout -b feat/your-feature
git commit -m "feat(module): short description"
git push origin feat/your-feature
```

Then open a PR against `main`.

## Project Structure

```
src/modules/
├── stellar/        # StellarService (Horizon + Soroban RPC wrappers)
├── auth/           # Freighter wallet verification + API keys
├── stream/         # Stream CRUD + real-time balance
├── factory/        # Factory contract interactions
├── multistream/    # Multi-recipient streams
├── vesting/        # Vesting schedules
├── stream-nft/     # Stream NFTs
├── fees/           # Fee management
└── indexer/        # Event + state sync
```

## How Endpoints Work

Every endpoint follows one of two patterns:

### Pattern A: Cached State (Postgres)
Used for: stream info, list queries, event history.
```
1. Client → GET /streams/:address
2. Controller → Service.getCachedInfo()
3. Service → TypeORM repository → Postgres
4. Response ← cached data
```
Data is updated periodically by `StateSyncService`.

### Pattern B: Real-time (Soroban RPC)
Used for: claimable balance, withdrawal.
```
1. Client → GET /streams/:address/balance
2. Controller → Service.getClaimableBalance()
3. Service → StellarService.simulateContractCall()
4. Soroban RPC ← simulates contract call
5. Response ← live on-chain data
```
**Never cache** claimable balance — it can change every ledger (~5s).

## Adding a New Endpoint

1. **Service method** — add the business logic (Soroban RPC or Postgres)
2. **Controller method** — add `@Api*` decorators, handle request body
3. **DTO** — if body validation needed, add `class-validator` decorators
4. **Auth** — use `@ApiBearerAuth()` or `@Public()` as appropriate
5. **Tests** — add `*.spec.ts` for the service and controller

Example:

```typescript
// stream.service.ts
async getClaimableBalance(contractAddress: string): Promise<string> {
  const result = await this.stellarService.simulateContractCall(
    contractAddress,
    'get_claimable_balance',
    [],
  );
  return result.result;
}

// stream.controller.ts
@Get(':address/balance')
@Public()
@ApiOperation({ summary: 'Real-time claimable balance' })
getClaimableBalance(@Param('address') address: string) {
  return this.streamService.getClaimableBalance(address);
}
```

## Testing

```bash
npm run test              # Unit tests (Jest)
npm run test:cov          # With coverage
```

Add tests in `*.spec.ts` files co-located with the service/controller.

## Common Pitfalls

- **Don't cache claimable balances.** Always call Soroban RPC at query time.
- **Don't use `any` in return types** — define proper interfaces.
- **All Stellar addresses** are strings — validate with `class-validator` IsStellarAddress if needed.
- **Transaction XDRs** are built server-side and returned to the client for signing.
- **The factory contract address** must be configured in `.env` for create endpoints to work.

## Labels

| Label | Meaning |
|---|---|
| `backend` | Backend API work |
| `good first issue` | Scoped to 1 module, clear spec |
| `stellar` | Requires Stellar/Soroban knowledge |
| `bug` | Something broken |
| `contract` | Smart contract task (see contracts repo) |

## Questions?

Open a discussion or ask in the PR.
