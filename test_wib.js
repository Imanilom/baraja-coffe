const method1 = () => {
  const now = new Date();
  return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

const method2 = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const m1 = method1();
const m2 = method2();

console.log("System TZ:", sysTz);
console.log("Method 1 (order.model.js):", m1.toISOString());
console.log("Method 2 (monitor/checker):", m2.toISOString());

const nowM2 = m2;
const todayM2 = new Date(nowM2.getFullYear(), nowM2.getMonth(), nowM2.getDate());
console.log("today in monitor:", todayM2.toISOString());
