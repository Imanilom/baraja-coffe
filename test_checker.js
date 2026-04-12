const realTime = new Date('2026-03-17T03:30:00Z'); // 10:30 WIB

// getWIBNow in orderCheker.job.js (simulated on WIB server)
// toLocaleString produces "3/17/2026, 10:30:00 AM" which parses to 2026-03-17T03:30:00Z
const getWIBNowTime = realTime.getTime(); 

const thirtyMinutesAgo = new Date(getWIBNowTime - 30 * 60 * 1000); 
console.log("thirtyMinutesAgo:", thirtyMinutesAgo.toISOString()); // 2026-03-17T03:00:00.000Z

// Order created 40 mins ago (09:50 WIB = 02:50Z)
// Stored as +7h : 02:50Z + 7H = 09:50Z
const orderCreatedAtWIB = new Date(new Date('2026-03-17T02:50:00Z').getTime() + 7 * 3600 * 1000);
console.log("orderCreatedAtWIB:", orderCreatedAtWIB.toISOString()); // 2026-03-17T09:50:00.000Z

console.log("CHECK orderCreatedAtWIB <= thirtyMinutesAgo:", orderCreatedAtWIB <= thirtyMinutesAgo); // FALSE!
