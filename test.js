// Smoke test for the compare math + item matching. Run: npm test
// No Discord login happens (token is blank); we just seed client.items by hand.
const assert = require("assert");

process.env.GOOGLE_CREDENTIALS = JSON.stringify({
  client_email: "test@test.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nAA\n-----END PRIVATE KEY-----\n",
});
process.env.token = "";

const client = require("./index");
const compare = require("./functions/compare");

for (const i of [
  { name: "torpedo", value: "10", demand: "4" },
  { name: "arachnid", value: "6", demand: "2" },
  { name: "beam", value: "3", demand: "2" },
  { name: "novalue", demand: "1" },
]) {
  client.items.set(i.name, i);
}

// name lookup + implicit quantity of 1
const [[qty, item]] = compare.check(["torpedo"]);
assert.strictEqual(qty, 1);
assert.strictEqual(item.name, "torpedo");

// leading number is a quantity
assert.strictEqual(compare.check(["2 beam"])[0][0], 2);

// error paths return {title}
assert.ok(compare.check(["nonsense_item"]).title);
assert.ok(compare.check(["torpedo", "torpedo"]).title);
assert.ok(compare.check(["novalue"]).title);
assert.ok(compare.check(new Array(9).fill(0).map((_, i) => `beam${i}`)).title);

// 10M+6M=16M / demand 6  vs  3*3M=9M / demand 2
const { st, value } = compare.calc([
  compare.check(["torpedo", "arachnid"]),
  compare.check(["3 beam"]),
]);
assert.ok(st.includes("First set (16M)"), st);
assert.ok(st.includes("Second set (9M)"), st);
assert.ok(value.startsWith("The first set wins by **`7.00M`**"), value);

// pagination helper
assert.deepStrictEqual(client.pager([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);

console.log("✅ all checks passed");
process.exit(0);
