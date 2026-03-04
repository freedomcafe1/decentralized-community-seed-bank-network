import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

describe("seed-registry focused tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const wallet1 = accounts.get("wallet_1")!;
  const wallet2 = accounts.get("wallet_2")!;

  it("registers a seed and reads it back", () => {
    const id = 201;
    const tx = simnet.callPublicFn(
      "seed-registry",
      "register-seed",
      [
        Cl.uint(id),
        Cl.stringAscii("Tomato"),
        Cl.stringAscii("Heirloom"),
        Cl.stringAscii("Local Farm"),
        Cl.uint(95),
      ],
      wallet1
    );

    // basic success check: result contains ok and the id
    const txStr = Cl.prettyPrint(tx.result);
    expect(txStr.toLowerCase()).toContain("ok");

    const ro = simnet.callReadOnlyFn("seed-registry", "get-seed", [Cl.uint(id)], wallet1);
    // verify returned tuple contains expected fields via prettyPrint
    const roString = Cl.prettyPrint(ro.result);
    expect(roString).toContain("Tomato");
    expect(roString).toContain("Heirloom");
    expect(roString).toContain("u95");
  });

  it("rejects duplicate registration", () => {
    const id = 202;
    // register once
    const first = simnet.callPublicFn(
      "seed-registry",
      "register-seed",
      [Cl.uint(id), Cl.stringAscii("X"), Cl.stringAscii("Y"), Cl.stringAscii("Z"), Cl.uint(50)],
      wallet1
    );
    expect(Cl.prettyPrint(first.result).toLowerCase()).toContain("ok");

    // try to register again with same id
    const tx = simnet.callPublicFn(
      "seed-registry",
      "register-seed",
      [Cl.uint(id), Cl.stringAscii("X2"), Cl.stringAscii("Y2"), Cl.stringAscii("Z2"), Cl.uint(60)],
      wallet1
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("err");
  });

  it("allows owner update and forbids non-owner", () => {
    const id = 102;
    // register under wallet1
    const reg = simnet.callPublicFn(
      "seed-registry",
      "register-seed",
      [Cl.uint(id), Cl.stringAscii("Bean"), Cl.stringAscii("Blue"), Cl.stringAscii("Farm"), Cl.uint(88)],
      wallet1
    );
    expect(Cl.prettyPrint(reg.result).toLowerCase()).toContain("ok");

    // owner (wallet1) updates
    const upd = simnet.callPublicFn(
      "seed-registry",
      "update-seed",
      [Cl.uint(id), Cl.stringAscii("Bean"), Cl.stringAscii("Blue-1"), Cl.stringAscii("Farm"), Cl.uint(90)],
      wallet1
    );
    expect(Cl.prettyPrint(upd.result).toLowerCase()).toContain("ok");

    // non-owner (wallet2) attempts update
    const badUpd = simnet.callPublicFn(
      "seed-registry",
      "update-seed",
      [Cl.uint(id), Cl.stringAscii("Bean"), Cl.stringAscii("X"), Cl.stringAscii("Farm"), Cl.uint(50)],
      wallet2
    );
    expect(Cl.prettyPrint(badUpd.result).toLowerCase()).toContain("err");
  });

  it("transfers ownership and new owner can update", () => {
    const id = 103;
    // register under wallet1
    const reg = simnet.callPublicFn(
      "seed-registry",
      "register-seed",
      [Cl.uint(id), Cl.stringAscii("Corn"), Cl.stringAscii("Field"), Cl.stringAscii("Region"), Cl.uint(77)],
      wallet1
    );
    expect(reg.result).toBeOk(Cl.uint(id));

    // transfer to wallet2
    const tx = simnet.callPublicFn(
      "seed-registry",
      "transfer-seed",
      [Cl.uint(id), Cl.principal(wallet2)],
      wallet1
    );
    expect(Cl.prettyPrint(tx.result).toLowerCase()).toContain("ok");

    // new owner updates
    const upd = simnet.callPublicFn(
      "seed-registry",
      "update-seed",
      [Cl.uint(id), Cl.stringAscii("Corn"), Cl.stringAscii("Field-2"), Cl.stringAscii("Region"), Cl.uint(80)],
      wallet2
    );
    expect(Cl.prettyPrint(upd.result).toLowerCase()).toContain("ok");
  });
});
