/**
 * Devnet Interaction Script
 * 
 * This script demonstrates how to interact with deployed contracts
 * on a local Devnet instance running at http://localhost:20443
 *
 * Usage:
 *   npx ts-node scripts/devnet-interaction.ts
 *
 * Prerequisites:
 *   1. Clarinet Devnet running: clarinet devnet start
 *   2. Contracts deployed: clarinet deployments apply --devnet
 *   3. Install ts-node: npm install --save-dev ts-node
 */

import { StacksNetwork, StacksTestnet } from "@stacks/network";
import {
  TxBroadcastResult,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  contractPrincipalCV,
  callReadOnlyFunction,
  submitTransaction,
  makeContractCall,
  broadcastTransaction,
} from "@stacks/transactions";
import { fetchAccountNonce } from "@stacks/stacks-blockchain-api-client";
import { getNetworkFromEnv } from "stacks-common";

/**
 * Configuration
 */
const DEVNET_NODE = "http://localhost:20443";
const DEVNET_API = "http://localhost:3999";

// Deployed contract addresses (from your devnet plan)
const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

// Create a custom Stacks network for local devnet
const network = new StacksTestnet({
  url: DEVNET_NODE,
});

/**
 * Example: Register a seed in the seed-registry contract
 */
async function registerSeed() {
  console.log("\n📍 Registering a seed in seed-registry...");

  try {
    const seedId = uintCV(101);
    const species = stringAsciiCV("Tomato");
    const variety = stringAsciiCV("Heirloom Cherry");
    const origin = stringAsciiCV("Local Farm");
    const viability = uintCV(95);

    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: "seed-registry",
      functionName: "register-seed",
      functionArgs: [seedId, species, variety, origin, viability],
      senderKey: "YOUR_PRIVATE_KEY_HERE", // replace with actual key
      network,
      anchorMode: "onChainOnly",
      fee: 1000,
    });

    console.log(`✅ Transaction created: ${tx.txid}`);
    return tx.txid;
  } catch (error) {
    console.error("❌ Error registering seed:", error);
  }
}

/**
 * Example: Query a seed from seed-registry (read-only)
 */
async function getSeed(seedId: number) {
  console.log(`\n📍 Querying seed ID ${seedId} from seed-registry...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "seed-registry",
      functionName: "get-seed",
      functionArgs: [uintCV(seedId)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Seed data:", result);
    return result;
  } catch (error) {
    console.error("❌ Error querying seed:", error);
  }
}

/**
 * Example: Register a community
 */
async function registerCommunity() {
  console.log("\n📍 Registering a community in community-network...");

  try {
    const communityId = uintCV(1);
    const communityName = stringAsciiCV("Urban Gardeners Collective");

    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: "community-network",
      functionName: "register-community",
      functionArgs: [communityId, communityName],
      senderKey: "YOUR_PRIVATE_KEY_HERE",
      network,
      anchorMode: "onChainOnly",
      fee: 1000,
    });

    console.log(`✅ Transaction created: ${tx.txid}`);
    return tx.txid;
  } catch (error) {
    console.error("❌ Error registering community:", error);
  }
}

/**
 * Example: Initiate a seed trade
 */
async function initiateTrade() {
  console.log("\n📍 Initiating a seed trade in my-contract...");

  try {
    const offeredSeedId = uintCV(101);
    const requestedSeedId = uintCV(102);

    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "initiate-trade",
      functionArgs: [offeredSeedId, requestedSeedId],
      senderKey: "YOUR_PRIVATE_KEY_HERE",
      network,
      anchorMode: "onChainOnly",
      fee: 1500,
    });

    console.log(`✅ Transaction created: ${tx.txid}`);
    return tx.txid;
  } catch (error) {
    console.error("❌ Error initiating trade:", error);
  }
}

/**
 * Example: Query trade status (read-only)
 */
async function getTrade(tradeId: number) {
  console.log(`\n📍 Querying trade ID ${tradeId} from my-contract...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "get-trade",
      functionArgs: [uintCV(tradeId)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Trade data:", result);
    return result;
  } catch (error) {
    console.error("❌ Error querying trade:", error);
  }
}

/**
 * Example: Check if a trade is open (read-only)
 */
async function isTradeOpen(tradeId: number) {
  console.log(`\n📍 Checking if trade ID ${tradeId} is open...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "is-trade-open",
      functionArgs: [uintCV(tradeId)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Trade open status:", result);
    return result;
  } catch (error) {
    console.error("❌ Error checking trade status:", error);
  }
}

/**
 * Example: Accept a trade
 */
async function acceptTrade(tradeId: number) {
  console.log(`\n📍 Accepting trade ID ${tradeId}...`);

  try {
    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "accept-trade",
      functionArgs: [uintCV(tradeId)],
      senderKey: "YOUR_PRIVATE_KEY_HERE",
      network,
      anchorMode: "onChainOnly",
      fee: 1500,
    });

    console.log(`✅ Transaction created: ${tx.txid}`);
    return tx.txid;
  } catch (error) {
    console.error("❌ Error accepting trade:", error);
  }
}

/**
 * Example: Cancel a trade (offerer only)
 */
async function cancelTrade(tradeId: number) {
  console.log(`\n📍 Cancelling trade ID ${tradeId}...`);

  try {
    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "cancel-trade",
      functionArgs: [uintCV(tradeId)],
      senderKey: "YOUR_PRIVATE_KEY_HERE",
      network,
      anchorMode: "onChainOnly",
      fee: 1500,
    });

    console.log(`✅ Transaction created: ${tx.txid}`);
    return tx.txid;
  } catch (error) {
    console.error("❌ Error cancelling trade:", error);
  }
}

/**
 * Example: Get count of trades by an offerer (read-only)
 */
async function getTradeCountByOfferer(offerer: string) {
  console.log(`\n📍 Getting trade count for ${offerer}...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "get-trades-count-by-offerer",
      functionArgs: [standardPrincipalCV(offerer)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Trade count:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting trade count:", error);
  }
}

/**
 * Example: Get trade at specific index for an offerer (read-only)
 */
async function getTradeByOffererAtIndex(offerer: string, index: number) {
  console.log(`\n📍 Getting trade at index ${index} for ${offerer}...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "get-trade-by-offerer-at-index",
      functionArgs: [standardPrincipalCV(offerer), uintCV(index)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Trade ID:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting trade:", error);
  }
}

/**
 * Example: Get all trades for an offerer (utility function)
 */
async function getTradesByOfferer(offerer: string) {
  console.log(`\n📍 Fetching all trades for ${offerer}...`);

  try {
    const countResult = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "my-contract",
      functionName: "get-trades-count-by-offerer",
      functionArgs: [standardPrincipalCV(offerer)],
      senderAddress: DEPLOYER,
      network,
    });

    const countStr = JSON.stringify(countResult);
    const match = countStr.match(/u(\d+)/);
    const count = match ? parseInt(match[1]) : 0;

    console.log(`Found ${count} trades`);

    const trades = [];
    for (let i = 0; i < count; i++) {
      try {
        const tradeIdResult = await callReadOnlyFunction({
          contractAddress: DEPLOYER,
          contractName: "my-contract",
          functionName: "get-trade-by-offerer-at-index",
          functionArgs: [standardPrincipalCV(offerer), uintCV(i)],
          senderAddress: DEPLOYER,
          network,
        });
        trades.push(tradeIdResult);
      } catch (e) {
        // Index out of bounds, stop iteration
        break;
      }
    }

    console.log("✅ Trade IDs:", trades);
    return trades;
  } catch (error) {
    console.error("❌ Error fetching trades:", error);
  }
}

/**
 * Example: Get member count for a community (read-only)
 */
async function getMemberCount(communityId: number) {
  console.log(`\n👥 Getting member count for community ${communityId}...`);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "community-network",
      functionName: "get-member-count",
      functionArgs: [uintCV(communityId)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Member count:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting member count:", error);
  }
}

/**
 * Example: Check if user is a member of a community (read-only)
 */
async function isMember(communityId: number, memberAddress: string) {
  console.log(
    `\n🔍 Checking if ${memberAddress} is member of community ${communityId}...`
  );

  try {
    const result = await callReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: "community-network",
      functionName: "is-member",
      functionArgs: [uintCV(communityId), standardPrincipalCV(memberAddress)],
      senderAddress: DEPLOYER,
      network,
    });

    console.log("✅ Is member?:", result);
    return result;
  } catch (error) {
    console.error("❌ Error checking membership:", error);
  }
}

/**
 * Example: Join a community (requires signing)
 * @note Requires valid private key to sign transaction
 */
async function joinCommunity(communityId: number) {
  console.log(`\n➕ Joining community ${communityId}...`);

  try {
    if (!PRIVATE_KEY || PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
      console.warn(
        "⚠️  PRIVATE_KEY not set. Cannot execute transaction. See script for details."
      );
      return;
    }

    const functionCall = await makeContractCall({
      contract: {
        address: DEPLOYER,
        name: "community-network",
      },
      function: "join-community",
      functionArgs: [uintCV(communityId)],
      senderKey: PRIVATE_KEY,
      network,
      validateWithAbi: true,
      anchorMode: AnchorMode.OnChainOnly,
    });

    const broadcastResult = await broadcastTransaction({
      transaction: functionCall,
      network,
    });

    console.log("✅ Join community transaction broadcast:");
    console.log(`   TXID: ${broadcastResult.txid}`);
    return broadcastResult;
  } catch (error) {
    console.error("❌ Error joining community:", error);
  }
}

/**
 * Main demo function
 */
async function demo() {
  console.log("🌱 Seed Bank Devnet Interaction Demo");
  console.log(`📡 Network: ${DEVNET_NODE}`);
  console.log(`🏗️  Deployer: ${DEPLOYER}`);
  console.log("=".repeat(60));

  // Read-only calls work without private keys
  console.log("\n--- Read-Only Queries (no private key needed) ---");
  await getSeed(101);
  await getTrade(1);
  await isTradeOpen(1);
  
  // NEW: Trade querying by offerer
  console.log("\n--- Query Trades by Offerer ---");
  await getTradeCountByOfferer(DEPLOYER);
  await getTradeByOffererAtIndex(DEPLOYER, 0);
  // await getTradesByOfferer(DEPLOYER);  // uncomment to load all trades

  // NEW: Community membership queries
  console.log("\n--- Community Membership ---");
  await getMemberCount(1);
  await isMember(1, DEPLOYER);

  console.log("\n--- State-Changing Calls (require private key) ---");
  console.log("⚠️  Note: The following calls require YOUR_PRIVATE_KEY_HERE to be set.");
  console.log("   See script for details on how to provide signing keys.");
  console.log("\n   Uncomment the calls below and provide your private key:");
  console.log("     await registerSeed();");
  console.log("     await registerCommunity();");
  console.log("     await joinCommunity(1);");
  console.log("     await initiateTrade(1, 2, 1);  // offerer-seed, requested-seed, community-id");
  console.log("     await acceptTrade(1);");
  console.log("     await cancelTrade(1);");
}

// Run demo
demo().catch(console.error);
