import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

describe("community-network focused tests", () => {
  const accounts = simnet.getAccounts();
  const wallet1 = accounts.get("wallet_1")!;
  const wallet2 = accounts.get("wallet_2")!;

  it("registers a community and reads it back", () => {
    const id = 301;
    const tx = simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(id), Cl.stringAscii("Green Valley")],
      wallet1
    );

    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("ok");

    const ro = simnet.callReadOnlyFn("community-network", "get-community", [Cl.uint(id)], wallet1);
    const roString = Cl.prettyPrint(ro.result);
    expect(roString).toContain("Green Valley");
  });

  it("rejects duplicate community registration", () => {
    const id = 302;
    const first = simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(id), Cl.stringAscii("Sunrise Coop")],
      wallet1
    );
    expect(Cl.prettyPrint(first.result).toLowerCase()).toContain("ok");

    const second = simnet.callPublicFn(
      "community-network",
      "register-community",
      [Cl.uint(id), Cl.stringAscii("Sunrise Coop 2")],
      wallet1
    );
    expect(Cl.prettyPrint(second.result).toLowerCase()).toContain("err");
  });

  it("allows different wallets to register distinct communities", () => {
    const id1 = 303;
    const id2 = 304;
    const a = simnet.callPublicFn("community-network", "register-community", [Cl.uint(id1), Cl.stringAscii("A")], wallet1);
    const b = simnet.callPublicFn("community-network", "register-community", [Cl.uint(id2), Cl.stringAscii("B")], wallet2);
    expect(Cl.prettyPrint(a.result).toLowerCase()).toContain("ok");
    expect(Cl.prettyPrint(b.result).toLowerCase()).toContain("ok");
  });
});
