/**
 * Quick Read-Only Demo
 * 
 * This is a simpler example that demonstrates read-only queries
 * to the deployed contracts on your local Devnet.
 *
 * These calls don't require signing, so they work immediately.
 *
 * Usage:
 *   npx ts-node scripts/read-only-demo.ts
 */

import { StacksTestnet } from "@stacks/network";
import { uintCV, callReadOnlyFunction } from "@stacks/transactions";

const DEVNET_NODE = "http://localhost:20443";
const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

const network = new StacksTestnet({
  url: DEVNET_NODE,
});

/**
 * Query all available data from contracts
 */
async function readOnlyDemo() {
  console.log("🌱 Seed Bank Read-Only Demo");
  console.log(`Network: ${DEVNET_NODE}`);
  console.log("=".repeat(60));

  // 1. Query seed-registry
  console.log("\n📚 Seed Registry - Querying seeds:");
  for (let id = 1; id <= 3; id++) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: "seed-registry",
        functionName: "get-seed",
        functionArgs: [uintCV(id)],
        senderAddress: DEPLOYER,
        network,
      });
      console.log(`  Seed ${id}:`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`  Seed ${id}: Not found (err 404)`);
    }
  }

  // 2. Query community-network
  console.log("\n👥 Community Network - Querying communities:");
  for (let id = 1; id <= 3; id++) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: "community-network",
        functionName: "get-community",
        functionArgs: [uintCV(id)],
        senderAddress: DEPLOYER,
        network,
      });
      console.log(`  Community ${id}:`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`  Community ${id}: Not found (err 404)`);
    }
  }

  // 2b. Query community membership counts
  console.log("\n👥 Community Membership - Member counts:");
  for (let id = 1; id <= 3; id++) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: "community-network",
        functionName: "get-member-count",
        functionArgs: [uintCV(id)],
        senderAddress: DEPLOYER,
        network,
      });
      console.log(`  Community ${id} members:`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`  Community ${id}: Not found (err 404)`);
    }
  }

  // 3. Query my-contract (seed-exchange)
  console.log("\n🔄 Seed Exchange - Querying trades:");
  for (let id = 1; id <= 3; id++) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: "my-contract",
        functionName: "get-trade",
        functionArgs: [uintCV(id)],
        senderAddress: DEPLOYER,
        network,
      });
      console.log(`  Trade ${id}:`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`  Trade ${id}: Not found (err 404)`);
    }
  }

  // 4. Query next trade ID
  console.log("\n📍 Next Trade ID:");
  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "get-next-trade-id",
      functionArgs: [],
      senderAddress: DEPLOYER,
      network,
    });
    console.log("  Next Trade ID:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.log("  Error:", e);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Demo complete!");
}

readOnlyDemo().catch(console.error);
