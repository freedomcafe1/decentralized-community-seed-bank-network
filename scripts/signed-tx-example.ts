/**
 * Signed Transaction Example
 * 
 * This script demonstrates how to craft and send signed transactions
 * to the deployed contracts on your local Devnet.
 *
 * Before running:
 *   1. Get a private key from your Devnet wallet (clarinet devnet start prints them)
 *   2. Set PRIVATE_KEY environment variable or paste it below
 *   3. Ensure the account has STX to pay fees
 *
 * Usage:
 *   PRIVATE_KEY='your_key_here' npx ts-node scripts/signed-tx-example.ts
 */

import { StacksTestnet } from "@stacks/network";
import {
  uintCV,
  stringAsciiCV,
  TxBroadcastResult,
  makeContractCall,
  broadcastTransaction,
  getNonce,
} from "@stacks/transactions";
import axios from "axios";

const DEVNET_NODE = "http://localhost:20443";
const DEVNET_API = "http://localhost:3999";
const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

const network = new StacksTestnet({
  url: DEVNET_NODE,
});

/**
 * Get account nonce from Devnet API
 */
async function getAccountNonce(address: string): Promise<number> {
  try {
    const response = await axios.get(`${DEVNET_API}/v2/accounts/${address}`);
    return response.data.nonce;
  } catch (error) {
    console.log("Note: API not responding, using nonce 0");
    return 0;
  }
}

/**
 * Broadcast transaction to Devnet
 */
async function broadcastTx(tx: any): Promise<string> {
  const serialized = tx.serialize();
  const response = await fetch(`${DEVNET_NODE}/v2/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: serialized,
  });

  if (!response.ok) {
    throw new Error(`Broadcast failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.txid;
}

/**
 * Example 1: Register a community
 */
async function exampleRegisterCommunity(privateKey: string) {
  console.log("\n📍 Example 1: Register Community");
  console.log("━".repeat(60));

  const nonce = await getAccountNonce(DEPLOYER);

  const tx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: "community-network",
    functionName: "register-community",
    functionArgs: [uintCV(10), stringAsciiCV("Downtown Seed Share")],
    senderKey: privateKey,
    nonce,
    network,
    anchorMode: "onChainOnly",
    fee: 1500,
  });

  console.log("Signing transaction...");
  console.log(`  Deployer: ${DEPLOYER}`);
  console.log(`  Community ID: 10`);
  console.log(`  Community Name: Downtown Seed Share`);
  console.log(`  Fee: 1500 uSTX`);

  try {
    const txid = await broadcastTx(tx);
    console.log(`✅ Transaction broadcast!`);
    console.log(`   TXID: ${txid}`);
    console.log(`   View at: ${DEVNET_API}/extended/v1/tx/${txid}`);
    return txid;
  } catch (error) {
    console.error(`❌ Failed to broadcast:`, error);
  }
}

/**
 * Example 2: Register a seed
 */
async function exampleRegisterSeed(privateKey: string) {
  console.log("\n📍 Example 2: Register Seed");
  console.log("━".repeat(60));

  const nonce = await getAccountNonce(DEPLOYER);

  const tx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: "seed-registry",
    functionName: "register-seed",
    functionArgs: [
      uintCV(5001),
      stringAsciiCV("Basil"),
      stringAsciiCV("Thai"),
      stringAsciiCV("Community Garden"),
      uintCV(92),
    ],
    senderKey: privateKey,
    nonce,
    network,
    anchorMode: "onChainOnly",
    fee: 2000,
  });

  console.log("Signing transaction...");
  console.log(`  Deployer: ${DEPLOYER}`);
  console.log(`  Seed ID: 5001`);
  console.log(`  Species: Basil`);
  console.log(`  Variety: Thai`);
  console.log(`  Origin: Community Garden`);
  console.log(`  Viability: 92%`);
  console.log(`  Fee: 2000 uSTX`);

  try {
    const txid = await broadcastTx(tx);
    console.log(`✅ Transaction broadcast!`);
    console.log(`   TXID: ${txid}`);
    return txid;
  } catch (error) {
    console.error(`❌ Failed to broadcast:`, error);
  }
}

/**
 * Example 3: Initiate a seed trade
 */
async function exampleInitiateTrade(privateKey: string) {
  console.log("\n📍 Example 3: Initiate Trade");
  console.log("━".repeat(60));

  const nonce = await getAccountNonce(DEPLOYER);

  const tx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: "my-contract",
    functionName: "initiate-trade",
    functionArgs: [uintCV(5001), uintCV(5002)],
    senderKey: privateKey,
    nonce,
    network,
    anchorMode: "onChainOnly",
    fee: 2000,
  });

  console.log("Signing transaction...");
  console.log(`  Deployer: ${DEPLOYER}`);
  console.log(`  Offered Seed ID: 5001`);
  console.log(`  Requested Seed ID: 5002`);
  console.log(`  Fee: 2000 uSTX`);

  try {
    const txid = await broadcastTx(tx);
    console.log(`✅ Transaction broadcast!`);
    console.log(`   TXID: ${txid}`);
    console.log(`   This creates a new trade (ID will be assigned by contract)`);
    return txid;
  } catch (error) {
    console.error(`❌ Failed to broadcast:`, error);
  }
}

/**
 * Main: Run examples
 */
async function main() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log("🌱 Seed Bank - Signed Transaction Examples");
    console.log("=".repeat(60));
    console.error(
      "\n❌ PRIVATE_KEY environment variable not set!\n"
    );
    console.log("To run this script:");
    console.log(
      "   1. Start Devnet: clarinet devnet start"
    );
    console.log("   2. Get a private key from the Devnet startup output");
    console.log("   3. Run: PRIVATE_KEY='your_key' npx ts-node scripts/signed-tx-example.ts\n");
    console.log("Example:");
    console.log(
      "   PRIVATE_KEY='0x1234...' npx ts-node scripts/signed-tx-example.ts\n"
    );
    process.exit(1);
  }

  console.log("🌱 Seed Bank - Signed Transaction Examples");
  console.log(`Network: ${DEVNET_NODE}`);
  console.log("=".repeat(60));

  try {
    // Uncomment the examples you want to run:
    // await exampleRegisterCommunity(privateKey);
    // await exampleRegisterSeed(privateKey);
    // await exampleInitiateTrade(privateKey);

    console.log("\n⚠️  Examples are commented out to prevent accidental transactions.");
    console.log("\nTo run them, uncomment the lines in this script:");
    console.log("   await exampleRegisterCommunity(privateKey);");
    console.log("   await exampleRegisterSeed(privateKey);");
    console.log("   await exampleInitiateTrade(privateKey);");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
