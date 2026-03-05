# Devnet Interaction Scripts

This directory contains TypeScript/Node.js scripts for interacting with your deployed contracts on a local Stacks Devnet.

## Prerequisites

1. **Start your Devnet:**
   ```bash
   clarinet devnet start
   ```
   This will spin up Docker containers and display wallet information.

2. **Deploy contracts:**
   ```bash
   clarinet deployments apply --devnet
   # Answer Y when prompted
   ```

3. **Install ts-node** (if not already installed):
   ```bash
   npm install --save-dev ts-node
   ```

---

## Scripts

### 1. **read-only-demo.ts** ✅ Start here!

The simplest example – queries all contracts without needing to sign anything.

**What it does:**
- Queries seeds from `seed-registry`
- Queries communities from `community-network`
- Queries trades from `my-contract`
- Checks the next trade ID

**Run it:**
```bash
npx ts-node scripts/read-only-demo.ts
```

**Example output:**
```
🌱 Seed Bank Read-Only Demo
Network: http://localhost:20443
============================================================

📚 Seed Registry - Querying seeds:
  Seed 1: Not found (err 404)
  Seed 2: Not found (err 404)
  Seed 3: Not found (err 404)

👥 Community Network - Querying communities:
  Community 1: Not found (err 404)
  ...
```

---

### 2. **devnet-interaction.ts**

More comprehensive examples showing how to structure calls to all three contracts.

**What it shows:**
- How to register seeds
- How to register communities
- How to initiate, accept, and cancel trades
- How to check trade status
- Proper function signatures and argument types

**Note:** Most examples are commented out because they require a private key. See the "Signing Transactions" section below.

**Run it:**
```bash
npx ts-node scripts/devnet-interaction.ts
```

---

### 3. **signed-tx-example.ts**

Demonstrates how to craft and broadcast signed transactions to the Devnet.

**What it shows:**
- Getting account nonce
- Building contract calls with proper parameters
- Broadcasting transactions to the network
- Handling transaction results

**Prerequisites:**
- Get a private key from your Devnet startup output
- Set the `PRIVATE_KEY` environment variable

**Run it:**
```bash
# First, get a private key from: clarinet devnet start output
PRIVATE_KEY='0x...' npx ts-node scripts/signed-tx-example.ts
```

**Important:** Transactions are commented out by default. Uncomment them in the script to actually broadcast.

---

## Common Patterns

### Query a contract (read-only, no signing needed)

```typescript
import { callReadOnlyFunction, uintCV } from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

const network = new StacksTestnet({ url: "http://localhost:20443" });
const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

const result = await callReadOnlyFunction({
  contractAddress: DEPLOYER,
  contractName: "seed-registry",
  functionName: "get-seed",
  functionArgs: [uintCV(1)],
  senderAddress: DEPLOYER,
  network,
});
```

### Send a signed transaction

```typescript
import { makeContractCall, broadcastTransaction, uintCV } from "@stacks/transactions";

const tx = await makeContractCall({
  contractAddress: DEPLOYER,
  contractName: "community-network",
  functionName: "register-community",
  functionArgs: [uintCV(1), stringAsciiCV("My Community")],
  senderKey: PRIVATE_KEY,
  network,
  anchorMode: "onChainOnly",
  fee: 1500,
  nonce: 0, // increment for each transaction
});

const txid = await broadcastTransaction(tx, network);
```

---

## Getting Private Keys

When you run `clarinet devnet start`, it displays wallet information like:

```
Accounts for Devnet:
  ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM (deployer)
    Mnemonic: ... (for HD wallets)
    Private key: 0x1234...abcd
```

Copy one of these private keys and use it in the signed transaction scripts.

---

## Contract Reference

### seed-registry

**Functions:**
- `register-seed(id, species, variety, origin, viability)` – Register a new seed
- `get-seed(id)` – Query seed data
- `update-seed(id, ...)` – Update seed (owner only)
- `transfer-seed(id, new-owner)` – Transfer ownership

**Example:**
```typescript
await callReadOnlyFunction({
  contractAddress: DEPLOYER,
  contractName: "seed-registry",
  functionName: "get-seed",
  functionArgs: [uintCV(1)],
  senderAddress: DEPLOYER,
  network,
});
```

---

### community-network

**Functions:**
- `register-community(id, name)` – Register a new community
- `get-community(id)` – Query community data

**Example:**
```typescript
const tx = await makeContractCall({
  contractAddress: DEPLOYER,
  contractName: "community-network",
  functionName: "register-community",
  functionArgs: [uintCV(1), stringAsciiCV("My Community")],
  senderKey: PRIVATE_KEY,
  network,
  // ... other options
});
```

---

### my-contract (seed-exchange)

**Functions:**
- `initiate-trade(offered-seed-id, requested-seed-id)` – Create a trade proposal
- `accept-trade(trade-id)` – Accept an open trade
- `cancel-trade(trade-id)` – Cancel a trade (offerer only)
- `get-trade(id)` – Query trade details
- `is-trade-open(id)` – Check if trade is open (true/false)
- `get-trade-status(id)` – Get trade status string ("open", "completed", "cancelled")
- `get-next-trade-id()` – Get the next assignable trade ID

**Example:**
```typescript
const tx = await makeContractCall({
  contractAddress: DEPLOYER,
  contractName: "my-contract",
  functionName: "initiate-trade",
  functionArgs: [uintCV(101), uintCV(102)],
  senderKey: PRIVATE_KEY,
  network,
  // ... other options
});
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Make sure `clarinet devnet start` is running in another terminal |
| "Contract not found" | Verify deployment completed: `clarinet deployments apply --devnet` |
| "err u403 (unauthorized)" | Only the seed owner can update/transfer; only the trade offerer can cancel |
| "err u409 (conflict)" | Seed already registered; trade already accepted/cancelled |
| "err u404 (not found)" | ID doesn't exist; check if you registered it first |

---

## Next Steps

1. **Run `read-only-demo.ts`** to verify contracts are deployed
2. **Populate data** by using `signed-tx-example.ts` (uncomment the examples)
3. **Query the results** with `read-only-demo.ts` again
4. **Build a front-end** using Stacks.js for a full UI

---

## Resources

- [Stacks.js Documentation](https://docs.stacks.co/docs/build-apps/overview)
- [Clarity Language Docs](https://docs.stacks.co/docs/write-smart-contracts/clarity-language)
- [Local Devnet Guide](https://docs.stacks.co/docs/clarinet/quickstart)
