const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const parseDate = (value, XLSX) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value === "number" && value > 20000 && value < 70000) {
        const parsed = (XLSX.SSF || XLSX.default?.SSF)?.parse_date_code(value);
        return parsed ? new Date(parsed.y, parsed.m - 1, parsed.d) : null;
    }

    const text = String(value || "");
    const match = text.match(/\b(\d{1,2})[\s/-]+([A-Za-z]{3})[\s/-]+(\d{4})\b/);
    if (match) {
        const month = MONTHS[match[2].toLowerCase()];
        if (month !== undefined) return new Date(Number(match[3]), month, Number(match[1]));
    }

    const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return null;
};

const parseMoney = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const text = String(value || "").trim();
    const match = text.match(/[-+]?\d[\d.,]*[.,]\d{2}(?!\d)/);
    if (!match) return null;

    let amount = match[0];
    if (amount.includes(",") && amount.includes(".")) {
        amount = amount.lastIndexOf(",") > amount.lastIndexOf(".")
            ? amount.replace(/\./g, "").replace(",", ".")
            : amount.replace(/,/g, "");
    } else if (amount.includes(",")) {
        amount = amount.replace(",", ".");
    }

    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : null;
};

const headerColumns = (row) => {
    const labels = row.map((value) => String(value || "").trim().toLowerCase());
    const date = labels.findIndex((label) => label.includes("tanggal") || label === "date");
    const debit = labels.findIndex((label) => label.includes("debit"));
    const credit = labels.findIndex((label) => label.includes("kredit") || label.includes("credit"));
    const balance = labels.findIndex((label) => label.includes("saldo") || label.includes("balance"));

    return date >= 0 && (debit >= 0 || credit >= 0)
        ? { date, debit, credit, balance }
        : null;
};

const cleanDescription = (values, excludedColumns) => values
    .map((value, index) => {
        if (excludedColumns.has(index) || value === null || value === undefined) return "";
        if (value instanceof Date || typeof value === "number") return "";
        return String(value)
            .replace(/\b\d{1,2}[\s/-]+[A-Za-z]{3}[\s/-]+\d{4}\b/gi, " ")
            .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
            .replace(/\b\d{1,2}:\d{2}:\d{2}\b/g, " ")
            .replace(/[-+]?\d[\d.,]*[.,]\d{2}(?!\d)/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    })
    .filter(Boolean)
    .join(" ")
    .trim();

export const parseCashStatementWorkbook = (workbook, XLSX) => {
    const transactions = [];

    workbook.SheetNames.forEach((sheetName) => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
            raw: true,
            cellDates: true,
            defval: null,
        });
        let columns = null;
        let activeDate = null;
        let lastTransaction = null;

        rows.forEach((row) => {
            const detectedHeaders = headerColumns(row);
            if (detectedHeaders) {
                columns = detectedHeaders;
                activeDate = null;
                lastTransaction = null;
                return;
            }

            const parsedDate = row
                .map((value) => parseDate(value, XLSX))
                .find(Boolean);
            if (parsedDate) activeDate = parsedDate;

            let amount = null;
            const excludedColumns = new Set();
            if (columns) {
                excludedColumns.add(columns.date);
                if (columns.balance >= 0) excludedColumns.add(columns.balance);
                const amountColumns = [columns.debit, columns.credit].filter((index) => index >= 0);
                amountColumns.forEach((index) => excludedColumns.add(index));
                for (const index of amountColumns) {
                    amount = parseMoney(row[index]);
                    if (amount !== null && amount !== 0) break;
                    amount = null;
                }
            } else {
                const candidates = row
                    .map((value, index) => ({ amount: parseMoney(value), index }))
                    .filter((candidate) => candidate.amount !== null && candidate.amount !== 0);
                amount = candidates.find((candidate) => candidate.amount < 0)?.amount
                    ?? candidates[0]?.amount
                    ?? null;
            }

            const description = cleanDescription(row, excludedColumns);
            if (amount !== null && activeDate) {
                const transaction = {
                    id: `${transactions.length}-${activeDate.getTime()}-${Math.round(amount * 100)}`,
                    date: activeDate,
                    amount,
                    description,
                    sheetName,
                };
                transactions.push(transaction);
                lastTransaction = transaction;
            } else if (description && lastTransaction) {
                lastTransaction.description = `${lastTransaction.description} ${description}`.trim();
            }
        });
    });

    const seen = new Set();
    return transactions.filter((transaction) => {
        const key = [
            transaction.date.toISOString().slice(0, 10),
            transaction.amount.toFixed(2),
            transaction.description.toLowerCase().replace(/\s+/g, " ").trim(),
        ].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const normalizedWords = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^\d+$/.test(word));

const dayDifference = (first, second) =>
    Math.abs(new Date(first).setHours(0, 0, 0, 0) - new Date(second).setHours(0, 0, 0, 0))
    / (24 * 60 * 60 * 1000);

export const matchCashStatementTransactions = (transactions, expenses) => {
    const usedExpenses = new Set();
    const matches = {};

    transactions
        .filter((transaction) => transaction.amount < 0)
        .forEach((transaction) => {
            const statementWords = new Set(normalizedWords(transaction.description));
            const candidates = expenses
                .filter((expense) => !usedExpenses.has(expense.id))
                .map((expense) => {
                    const distance = dayDifference(transaction.date, expense.date);
                    if (distance > 60 || Math.abs(Math.abs(transaction.amount) - expense.amount) > 1) return null;

                    const expenseWords = normalizedWords(expense.description);
                    const overlap = expenseWords.filter((word) => statementWords.has(word)).length;
                    return { expense, distance, overlap };
                })
                .filter(Boolean)
                .sort((a, b) => b.overlap - a.overlap || a.distance - b.distance);

            const best = candidates[0];
            const secondBest = candidates[1];
            if (!best) return;

            const uniqueDescriptionMatch = best.overlap > 0
                && (!secondBest || best.overlap > secondBest.overlap);
            const uniqueNearDateMatch = best.distance <= 3
                && (!secondBest || best.distance < secondBest.distance);

            if (uniqueDescriptionMatch || uniqueNearDateMatch) {
                matches[transaction.id] = best.expense.id;
                usedExpenses.add(best.expense.id);
            }
        });

    return matches;
};
