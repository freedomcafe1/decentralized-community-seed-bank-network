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

  it("initiates a trade and reads it back", () => {
    const offered = 10;
    const requested = 20;

    const tx = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(offered), Cl.uint(requested)],
      wallet1
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("ok");

    const tradeId = parseUintFromOk(tx.result);
    const ro = simnet.callReadOnlyFn("my-contract", "get-trade", [Cl.uint(tradeId)], wallet1);
    const roStr = Cl.prettyPrint(ro.result);
    expect(roStr).toContain("open");
    expect(roStr).toContain("u10");
    expect(roStr).toContain("u20");
    // wallet address appears in tuple but we don't assert it explicitly

    // next-trade-id should now equal tradeId+1
    const next = simnet.callReadOnlyFn("my-contract", "get-next-trade-id", [], wallet1);
    expect(Cl.prettyPrint(next.result)).toContain("u" + (tradeId + 1));
  });

  it("rejects initiation when offered and requested seed IDs match", () => {
    const tx = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(5), Cl.uint(5)],
      wallet2
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("err");
  });

  it("forbids unauthorized cancellation and allows offerer to cancel", () => {
    const tx1 = simnet.callPublicFn(
      "my-contract",
      "initiate-trade",
      [Cl.uint(100), Cl.uint(200)],
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
      [Cl.uint(7), Cl.uint(8)],
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
      [Cl.uint(55), Cl.uint(66)],
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
});
