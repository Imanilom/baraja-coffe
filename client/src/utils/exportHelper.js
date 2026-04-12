import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Optimized Excel Export dengan batch processing
 * Menghindari memory overflow untuk dataset besar
 */
export const exportToExcel = async (data, fileName, headerInfo = []) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan");

    // 1. Judul
    sheet.mergeCells("A1", "Z1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Laporan Transaksi Penjualan";
    titleCell.font = { bold: true, size: 16 };

    // 2. Header Info
    let currentRow = 3;
    headerInfo.forEach(([label, value]) => {
        sheet.getCell(`A${currentRow}`).value = label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
    });

    currentRow++; // Spasi kosong sebelum tabel

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // 3. Header Kolom
    const rightAlignedCols = [
        "Jumlah Produk",
        "Harga Produk",
        "Penjualan Kotor",
        "Diskon Produk",
        "Subtotal",
        "Diskon Transaksi",
        "Pajak",
        "Service Charge",
        "Pembulatan",
        "Poin Ditukar",
        "Biaya Admin",
        "Total",
        "Pembayaran"
    ];

    // Pre-calculate column indices
    const columnIndices = {};
    columns.forEach((col, i) => {
        columnIndices[col] = i + 1;
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = col;
        cell.font = { bold: true };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        };
        cell.alignment = {
            horizontal: rightAlignedCols.includes(col) ? "right" : "left"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // 4. OPTIMIZED: Group by "ID Struk" more efficiently
    const grouped = {};
    data.forEach(row => {
        const trxId = row["ID Struk"] || "UNKNOWN";
        if (!grouped[trxId]) {
            grouped[trxId] = [];
        }
        grouped[trxId].push(row);
    });

    // 5. Warna latar belakang selang-seling
    const bgColors = ["FFFFFFFF", "FFF2F2F2"];
    let colorIndex = 0;

    // 6. OPTIMIZED: Batch write rows (process in chunks to avoid memory issues)
    const BATCH_SIZE = 100;
    const trxIds = Object.keys(grouped);

    for (let batchStart = 0; batchStart < trxIds.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, trxIds.length);
        const batchTrxIds = trxIds.slice(batchStart, batchEnd);

        for (const trxId of batchTrxIds) {
            const rows = grouped[trxId];
            const bgColor = bgColors[colorIndex % bgColors.length];
            colorIndex++;

            rows.forEach((rowData, index) => {
                const row = sheet.getRow(currentRow);

                columns.forEach((col) => {
                    let value = rowData[col];

                    // Kosongkan info duplikat di baris kedua+ transaksi
                    if (
                        ["Subtotal", "Service Charge", "Pembulatan", "Poin Ditukar",
                            "Biaya Admin", "Total", "Pajak", "Diskon Transaksi",
                            "Metode Pembayaran", "Pembayaran"].includes(col) &&
                        index > 0
                    ) {
                        value = "";
                    }

                    const colIndex = columnIndices[col];
                    const cell = sheet.getCell(currentRow, colIndex);
                    cell.value = value;

                    // Format angka ribuan (only if number and not empty)
                    if (
                        typeof value === "number" &&
                        value !== 0 &&
                        (col.toLowerCase().includes("harga") ||
                            col.toLowerCase().includes("subtotal") ||
                            col.toLowerCase().includes("total") ||
                            col.toLowerCase().includes("pajak") ||
                            col.toLowerCase().includes("diskon") ||
                            col.toLowerCase().includes("biaya") ||
                            col.toLowerCase().includes("pembayaran") ||
                            col.toLowerCase().includes("penjualan"))
                    ) {
                        cell.numFmt = "#,##0";
                    }

                    // Format tampilan
                    cell.alignment = { vertical: "top", wrapText: true };
                    cell.border = undefined;

                    // Set latar belakang
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: bgColor },
                    };
                });

                currentRow++;
            });
        }

        // Give browser time to breathe between batches
        if (batchEnd < trxIds.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    // 7. Calculate Grand Totals
    const totals = {
        jumlahProduk: 0,
        hargaProduk: 0,
        penjualanKotor: 0,
        diskonProduk: 0,
        totalSubtotal: 0,
        diskonTransaksi: 0,
        serviceCharge: 0,
        totalPajak: 0,
        pembulatan: 0,
        poinDitukar: 0,
        biayaAdmin: 0,
        totalTotal: 0,
        pembayaran: 0
    };

    data.forEach((row) => {
        totals.jumlahProduk += parseFloat(row["Jumlah Produk"]) || 0;
        totals.hargaProduk += parseFloat(row["Harga Produk"]) || 0;
        totals.penjualanKotor += parseFloat(row["Penjualan Kotor"]) || 0;
        totals.diskonProduk += parseFloat(row["Diskon Produk"]) || 0;
        totals.totalSubtotal += parseFloat(row["Subtotal"]) || 0;
        totals.diskonTransaksi += parseFloat(row["Diskon Transaksi"]) || 0;
        totals.serviceCharge += parseFloat(row["Service Charge"]) || 0;
        totals.totalPajak += parseFloat(row["Pajak"]) || 0;
        totals.pembulatan += parseFloat(row["Pembulatan"]) || 0;
        totals.poinDitukar += parseFloat(row["Poin Ditukar"]) || 0;
        totals.biayaAdmin += parseFloat(row["Biaya Admin"]) || 0;
        totals.totalTotal += parseFloat(row["Total"]) || 0;
        totals.pembayaran += parseFloat(row["Pembayaran"]) || 0;
    });

    // 8. Add Grand Total Row
    const row = sheet.getRow(currentRow);

    columns.forEach((col) => {
        const colIndex = columnIndices[col];
        const cell = sheet.getCell(currentRow, colIndex);

        let value;
        switch (col) {
            case "Tanggal & Waktu":
                value = "Grand Total";
                break;
            case "Jumlah Produk":
                value = totals.jumlahProduk;
                break;
            case "Harga Produk":
                value = totals.hargaProduk;
                break;
            case "Penjualan Kotor":
                value = totals.penjualanKotor;
                break;
            case "Diskon Produk":
                value = totals.diskonProduk;
                break;
            case "Subtotal":
                value = totals.totalSubtotal;
                break;
            case "Diskon Transaksi":
                value = totals.diskonTransaksi;
                break;
            case "Service Charge":
                value = totals.serviceCharge;
                break;
            case "Pajak":
                value = totals.totalPajak;
                break;
            case "Pembulatan":
                value = totals.pembulatan;
                break;
            case "Poin Ditukar":
                value = totals.poinDitukar;
                break;
            case "Biaya Admin":
                value = totals.biayaAdmin;
                break;
            case "Total":
                value = totals.totalTotal;
                break;
            case "Pembayaran":
                value = totals.pembayaran;
                break;
            default:
                value = "";
        }

        cell.value = value;

        // Format angka ribuan
        if (
            typeof value === "number" &&
            (col.toLowerCase().includes("harga") ||
                col.toLowerCase().includes("subtotal") ||
                col.toLowerCase().includes("total") ||
                col.toLowerCase().includes("pajak") ||
                col.toLowerCase().includes("diskon") ||
                col.toLowerCase().includes("biaya") ||
                col.toLowerCase().includes("pembayaran") ||
                col.toLowerCase().includes("penjualan"))
        ) {
            cell.numFmt = "#,##0";
        }

        // Format Grand Total
        cell.alignment = { vertical: "top", wrapText: true };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        };
        cell.font = { bold: true };
        cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
        };
    });

    // 9. Freeze Header
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // 10. OPTIMIZED: Auto Width (sample first 1000 rows only for large datasets)
    const sampleSize = Math.min(1000, data.length);

    sheet.columns.forEach((column, colIndex) => {
        let maxLength = 10;

        // Check header
        const headerCell = sheet.getCell(headerRowNumber, colIndex + 1);
        if (headerCell.value) {
            maxLength = Math.max(maxLength, headerCell.value.toString().length);
        }

        // Sample data rows
        for (let i = 0; i < sampleSize; i++) {
            const cell = sheet.getCell(headerRowNumber + 1 + i, colIndex + 1);
            if (cell.value) {
                const val = cell.value.toString();
                maxLength = Math.max(maxLength, Math.min(val.length, 50)); // Cap at 50
            }
        }

        column.width = Math.min(maxLength + 2, 60); // Cap width at 60
    });

    // 11. Write file with streaming for large files
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);

    console.log(`✅ Excel generated: ${data.length} rows`);
};