// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  const raw = line.trim();
  if (!raw) continue;

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    continue;
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) continue;

  const txnId = event.txn_id;
  if (typeof txnId !== "string" || txnId.trim() === "") continue;

  const prev = latest.get(txnId);
  const ts = event.ts || "";
  if (!prev || ts >= (prev.ts || "")) {
    latest.set(txnId, event);
  }
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status !== "success") continue;
  const amount = typeof event.amount === "string" ? event.amount.replace(/,/g, "") : event.amount;
  total += Number(amount);
  count += 1;
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
