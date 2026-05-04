// Simulate order created at yesterday 21:00 WIB
// Real time of yesterday 21:00 WIB = Yesterday 14:00Z
const realOrderTime = new Date('2026-03-16T14:00:00Z');
// order.model.js shifted time
const createdAtWIB = new Date(realOrderTime.getTime() + 7 * 3600 * 1000); 
console.log("Order createdAtWIB:", createdAtWIB.toISOString()); // 2026-03-16T21:00:00Z

// Cron runs today at 01:00 WIB
// Real time of today 01:00 WIB = Yesterday 18:00Z
const cronRunTime = new Date('2026-03-16T18:00:00Z');
console.log("Cron run time (real):", cronRunTime.toISOString());

// OLD LOGIC
const oldNow = new Date(cronRunTime.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
// In Node on WIB server, oldNow parses as local time -> 01:00 WIB -> 18:00Z
const oldToday = new Date(oldNow.getFullYear(), oldNow.getMonth(), oldNow.getDate());
// oldToday = 00:00 WIB today -> 17:00Z yesterday
console.log("OLD today:", oldToday.toISOString());
console.log("OLD check (createdAtWIB < oldToday):", createdAtWIB < oldToday); // FALSE!

// NEW LOGIC
const newNowWIB = new Date(cronRunTime.getTime() + 7 * 3600 * 1000); 
console.log("newNowWIB:", newNowWIB.toISOString()); // 2026-03-17T01:00:00Z
// Using UTC methods treats the shifted time as if it were UTC.
const newToday = new Date(Date.UTC(newNowWIB.getUTCFullYear(), newNowWIB.getUTCMonth(), newNowWIB.getUTCDate(), 0, 0, 0, 0));
console.log("NEW today:", newToday.toISOString()); // 2026-03-17T00:00:00Z
console.log("NEW check (createdAtWIB < newToday):", createdAtWIB < newToday); // TRUE!
