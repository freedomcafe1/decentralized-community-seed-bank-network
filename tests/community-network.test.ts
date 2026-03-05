import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

describe("community-network membership tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const wallet1 = accounts.get("wallet_1")!;
  const wallet2 = accounts.get("wallet_2")!;

  it("allows joining and leaving a community", () => {
    const communityId = 1;
    const communityName = "Urban Farmers";

    // First, register a community
    const regTx = simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(communityId), Cl.stringAscii(communityName)],
      wallet1
    );
    expect(Cl.prettyPrint(regTx.result).toLowerCase()).toContain("ok");

    // wallet1 joins the community
    const joinTx = simnet.callPublicFn(
      "community-network",
      "join-community",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(joinTx.result).toLowerCase()).toContain("ok");

    // Check wallet1 is a member
    const isMemberResult = simnet.callReadOnlyFn(
      "community-network",
      "is-member",
      [Cl.uint(communityId), Cl.principal(wallet1)],
      wallet1
    );
    expect(Cl.prettyPrint(isMemberResult.result)).toContain("true");

    // wallet1 leaves the community
    const leaveTx = simnet.callPublicFn(
      "community-network",
      "leave-community",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(leaveTx.result).toLowerCase()).toContain("ok");

    // Check wallet1 is no longer a member
    const notMemberResult = simnet.callReadOnlyFn(
      "community-network",
      "is-member",
      [Cl.uint(communityId), Cl.principal(wallet1)],
      wallet1
    );
    expect(Cl.prettyPrint(notMemberResult.result)).toContain("false");
  });

  it("tracks member count accurately", () => {
    const communityId = 2;
    const communityName = "Seed Sharers";

    // Register community
    simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(communityId), Cl.stringAscii(communityName)],
      wallet1
    );

    // Check initial count is 0
    const initialCount = simnet.callReadOnlyFn(
      "community-network",
      "get-member-count",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(initialCount.result)).toContain("u0");

    // wallet1 joins
    simnet.callPublicFn("community-network", "join-community", [Cl.uint(communityId)], wallet1);

    // Check count is now 1
    const countAfterJoin1 = simnet.callReadOnlyFn(
      "community-network",
      "get-member-count",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(countAfterJoin1.result)).toContain("u1");

    // wallet2 joins
    simnet.callPublicFn("community-network", "join-community", [Cl.uint(communityId)], wallet2);

    // Check count is now 2
    const countAfterJoin2 = simnet.callReadOnlyFn(
      "community-network",
      "get-member-count",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(countAfterJoin2.result)).toContain("u2");

    // wallet1 leaves
    simnet.callPublicFn("community-network", "leave-community", [Cl.uint(communityId)], wallet1);

    // Check count is back to 1
    const countAfterLeave = simnet.callReadOnlyFn(
      "community-network",
      "get-member-count",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(countAfterLeave.result)).toContain("u1");
  });

  it("prevents non-existent community join and rejects duplicate membership", () => {
    const communityId = 3;

    // Try to join non-existent community
    const nonExistentJoin = simnet.callPublicFn(
      "community-network",
      "join-community",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(nonExistentJoin.result).toLowerCase()).toContain("err");

    // Register the community
    simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(communityId), Cl.stringAscii("Test Community")],
      wallet1
    );

    // Join community
    const firstJoin = simnet.callPublicFn(
      "community-network",
      "join-community",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(firstJoin.result).toLowerCase()).toContain("ok");

    // Try to join again (should error - already a member)
    const secondJoin = simnet.callPublicFn(
      "community-network",
      "join-community",
      [Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(secondJoin.result).toLowerCase()).toContain("err");
  });
});
