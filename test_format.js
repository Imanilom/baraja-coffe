const m1 = new Date(Date.now() + 7 * 3600 * 1000); // method 1

console.log("M1 UTC time:", m1.toISOString());

const formatted = m1.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

console.log("M1 formatted to WIB:", formatted);
