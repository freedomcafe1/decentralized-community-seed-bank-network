import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

describe("seed-exchange focused tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const wallet1 = accounts.get("wallet_1")!;
  const wallet2 = accounts.get("wallet_2")!;
  const wallet3 = accounts.get("wallet_3")!;

  function parseUintFromOk(result: any): number {
    const str = Cl.prettyPrint(result);
    const m = str.match(/u(\d+)/);
    return m ? parseInt(m[1]) : -1;
  }

  it("initiates a trade in a community and reads it back", () => {
    const offered = 10;
    const requested = 20;
    const communityId = 1;

    const tx = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(offered), Cl.uint(requested), Cl.uint(communityId)],
      wallet1
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("ok");

    const tradeId = parseUintFromOk(tx.result);
    const ro = simnet.callReadOnlyFn("my-contract", "get-trade", [Cl.uint(tradeId)], wallet1);
    const roStr = Cl.prettyPrint(ro.result);
    expect(roStr).toContain("open");
    expect(roStr).toContain("u10");
    expect(roStr).toContain("u20");
    expect(roStr).toContain("u1");  // community-id

    // next-trade-id should now equal tradeId+1
    const next = simnet.callReadOnlyFn("my-contract", "get-next-trade-id", [], wallet1);
    expect(Cl.prettyPrint(next.result)).toContain("u" + (tradeId + 1));
  });

  it("rejects initiation when offered and requested seed IDs match", () => {
    const tx = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(5), Cl.uint(5), Cl.uint(1)],
      wallet2
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("err");
  });

  it("forbids unauthorized cancellation and allows offerer to cancel", () => {
    const tx1 = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(100), Cl.uint(200), Cl.uint(1)],
      wallet2
    );
    expect(Cl.prettyPrint(tx1.result).toLowerCase()).toContain("ok");
    const tradeId = parseUintFromOk(tx1.result);

    // wallet1 tries to cancel wallet2's trade
    const badCancel = simnet.callPublicFn("my-contract", "cancel-trade", [Cl.uint(tradeId)], wallet1);
    expect(Cl.prettyPrint(badCancel.result).toLowerCase()).toContain("err");

    // actual offerer cancels
    const goodCancel = simnet.callPublicFn("my-contract", "cancel-trade", [Cl.uint(tradeId)], wallet2);
    expect(Cl.prettyPrint(goodCancel.result).toLowerCase()).toContain("ok");

    const ro = simnet.callReadOnlyFn("my-contract", "get-trade", [Cl.uint(tradeId)], wallet2);
    expect(Cl.prettyPrint(ro.result)).toContain("cancel");
  });

  it("accepts open trade and prevents further actions", () => {
    // initiate with wallet1
    const tx1 = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(7), Cl.uint(8), Cl.uint(1)],
      wallet1
    );
    expect(Cl.prettyPrint(tx1.result).toLowerCase()).toContain("ok");
    const tradeId = parseUintFromOk(tx1.result);

    // wallet2 accepts the trade
    const accept = simnet.callPublicFn("my-contract", "accept-trade", [Cl.uint(tradeId)], wallet2);
    expect(Cl.prettyPrint(accept.result).toLowerCase()).toContain("ok");

    // cannot accept again
    const doubleAccept = simnet.callPublicFn("my-contract", "accept-trade", [Cl.uint(tradeId)], wallet2);
    expect(Cl.prettyPrint(doubleAccept.result).toLowerCase()).toContain("err");

    // offerer cannot cancel after completion
    const cancelAfter = simnet.callPublicFn("my-contract", "cancel-trade", [Cl.uint(tradeId)], wallet1);
    expect(Cl.prettyPrint(cancelAfter.result).toLowerCase()).toContain("err");

    const ro = simnet.callReadOnlyFn("my-contract", "get-trade", [Cl.uint(tradeId)], wallet1);
    expect(Cl.prettyPrint(ro.result)).toContain("completed");
  });

  it("uses query helpers for status and open flag", () => {
    const tx = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(55), Cl.uint(66), Cl.uint(1)],
      wallet3
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("ok");
    const tid = parseUintFromOk(tx.result);

    const status = simnet.callReadOnlyFn("my-contract", "get-trade-status", [Cl.uint(tid)], wallet3);
    expect(Cl.prettyPrint(status.result)).toContain("open");

    const openFlag = simnet.callReadOnlyFn("my-contract", "is-trade-open", [Cl.uint(tid)], wallet3);
    expect(Cl.prettyPrint(openFlag.result)).toContain("true");

    // after cancellation the status/flag should change
    const cancel = simnet.callPublicFn("my-contract", "cancel-trade", [Cl.uint(tid)], wallet3);
    expect(Cl.prettyPrint(cancel.result).toLowerCase()).toContain("ok");

    const status2 = simnet.callReadOnlyFn("my-contract", "get-trade-status", [Cl.uint(tid)], wallet3);
    expect(Cl.prettyPrint(status2.result)).toContain("cancel");

    const openFlag2 = simnet.callReadOnlyFn("my-contract", "is-trade-open", [Cl.uint(tid)], wallet3);
    expect(Cl.prettyPrint(openFlag2.result)).toContain("false");
  });

  it("tracks trades by offerer and retrieves them", () => {
    const offerer = wallet1;

    // Offerer initiates 3 trades
    const tx1 = simnet.callPublicFn("my-contract", "initiate-trade", [Cl.uint(100), Cl.uint(101), Cl.uint(1)], offerer);
    const tid1 = parseUintFromOk(tx1.result);

    const tx2 = simnet.callPublicFn("my-contract", "initiate-trade", [Cl.uint(102), Cl.uint(103), Cl.uint(1)], offerer);
    const tid2 = parseUintFromOk(tx2.result);

    const tx3 = simnet.callPublicFn("my-contract", "initiate-trade", [Cl.uint(104), Cl.uint(105), Cl.uint(1)], offerer);
    const tid3 = parseUintFromOk(tx3.result);

    // Check count
    const countResult = simnet.callReadOnlyFn(
      "my-contract",
      "get-trades-count-by-offerer",
      [Cl.principal(offerer)],
      offerer
    );
    const countStr = Cl.prettyPrint(countResult.result);
    expect(countStr).toContain("u3");

    // Retrieve each trade by index
    const trade0 = simnet.callReadOnlyFn(
      "my-contract",
      "get-trade-by-offerer-at-index",
      [Cl.principal(offerer), Cl.uint(0)],
      offerer
    );
    expect(Cl.prettyPrint(trade0.result)).toContain("u" + tid1);

    const trade1 = simnet.callReadOnlyFn(
      "my-contract",
      "get-trade-by-offerer-at-index",
      [Cl.principal(offerer), Cl.uint(1)],
      offerer
    );
    expect(Cl.prettyPrint(trade1.result)).toContain("u" + tid2);

    const trade2 = simnet.callReadOnlyFn(
      "my-contract",
      "get-trade-by-offerer-at-index",
      [Cl.principal(offerer), Cl.uint(2)],
      offerer
    );
    expect(Cl.prettyPrint(trade2.result)).toContain("u" + tid3);

    // Out of bounds should error
    const oob = simnet.callReadOnlyFn(
      "my-contract",
      "get-trade-by-offerer-at-index",
      [Cl.principal(offerer), Cl.uint(99)],
      offerer
    );
    expect(Cl.prettyPrint(oob.result).toLowerCase()).toContain("err");

    // Different offerer should have count 0
    const otherCount = simnet.callReadOnlyFn(
      "my-contract",
      "get-trades-count-by-offerer",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(Cl.prettyPrint(otherCount.result)).toContain("u0");
  });
});
