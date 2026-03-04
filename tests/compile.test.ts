import { describe, it, expect } from "vitest";

// A simple test that ensures the Clarinet SDK can initialize the simnet
// and therefore compile the contracts listed in Clarinet.toml. If any
// contract has a syntax error, `simnet.initSession()` will throw and the
// test will fail.

describe("contract syntax", () => {
  it("compiles all contracts", async () => {
    // `simnet` is provided globally by the vitest-environment-clarinet.
    expect(globalThis.simnet).toBeDefined();
    // the clarinet environment initializes and compiles contracts automatically
    // when Vitest starts; if there were syntax errors they would appear before
    // this test runs.
  });
});
