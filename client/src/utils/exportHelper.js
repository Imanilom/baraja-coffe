import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

    columns.forEach((col, i) => {
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

    // 4. Group by "ID Struk"
    const grouped = data.reduce((acc, row) => {
        const trxId = row["ID Struk"] || "UNKNOWN";
        acc[trxId] = acc[trxId] || [];
        acc[trxId].push(row);
        return acc;
    }, {});

    // 5. Warna latar belakang selang-seling
    const bgColors = ["FFFFFFFF", "FFF2F2F2"]; // Putih dan Abu muda
    let colorIndex = 0;

    for (const trxId in grouped) {
        const rows = grouped[trxId];
        const bgColor = bgColors[colorIndex % bgColors.length];
        colorIndex++;

        rows.forEach((rowData, index) => {
            const row = sheet.getRow(currentRow);
            columns.forEach((col, i) => {
                let value = rowData[col];

                // Kosongkan info duplikat di baris kedua+ transaksi
                if (
                    ["Subtotal", "Service Charge", "Pembulatan", "Poin Ditukar", "Biaya Admin", "Total", "Pajak", "Diskon Transaksi", "Metode Pembayaran", "Pembayaran"].includes(col) &&
                    index > 0
                ) {
                    value = "";
                }

                const cell = sheet.getCell(currentRow, i + 1);
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

                // Format tampilan
                cell.alignment = { vertical: "top", wrapText: true };

                // Hapus border
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

    let jumlahProduk = 0;
    let hargaProduk = 0;
    let penjualanKotor = 0;
    let diskonProduk = 0;
    let totalSubtotal = 0;
    let diskonTransaksi = 0;
    let serviceCharge = 0;
    let totalPajak = 0;
    let pembulatan = 0;
    let poinDitukar = 0;
    let biayaAdmin = 0;
    let totalTotal = 0;
    let pembayaran = 0;

    data.forEach((row) => {
        jumlahProduk += parseFloat(row["Jumlah Produk"]) || 0;
        hargaProduk += parseFloat(row["Harga Produk"]) || 0;
        penjualanKotor += parseFloat(row["Penjualan Kotor"]) || 0;
        diskonProduk += parseFloat(row["Diskon Produk"]) || 0;
        totalSubtotal += parseFloat(row["Subtotal"]) || 0;
        diskonTransaksi += parseFloat(row["Diskon Transaksi"]) || 0;
        serviceCharge += parseFloat(row["Service Charge"]) || 0;
        totalPajak += parseFloat(row["Pajak"]) || 0;
        pembulatan += parseFloat(row["Pembulatan"]) || 0;
        poinDitukar += parseFloat(row["Poin Ditukar"]) || 0;
        biayaAdmin += parseFloat(row["Biaya Admin"]) || 0;
        totalTotal += parseFloat(row["Total"]) || 0;
        pembayaran += parseFloat(row["Pembayaran"]) || 0;
    });

    // 2. Tambahkan baris Grand Total ke exportData
    data.push({
        "Tanggal & Waktu": "Grand Total",
        "Jumlah Produk": jumlahProduk,
        "Harga Produk": hargaProduk,
        "Penjualan Kotor": penjualanKotor,
        "Diskon Produk": diskonProduk,
        "Subtotal": totalSubtotal,
        "Diskon Transaksi": diskonTransaksi,
        "Service Charge": serviceCharge,
        "Pajak": totalPajak,
        "Pembulatan": pembulatan,
        "Poin Ditukar": poinDitukar,
        "Biaya Admin": biayaAdmin,
        "Total": totalTotal,
        "Pembayaran": pembayaran,
    });

    // 6. Freeze Header
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    const lastRow = data[data.length - 1];
    if (lastRow && lastRow["Tanggal & Waktu"] === "Grand Total") {
        const grandTotalRowData = lastRow;
        const row = sheet.getRow(currentRow);

        columns.forEach((col, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            const value = grandTotalRowData[col];

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

            // Format tampilan & pewarnaan Grand Total
            cell.alignment = { vertical: "top", wrapText: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD9D9D9" }, // abu muda
            };
            cell.font = { bold: true };
            cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } },
            };
        });

        currentRow++;
    }

    // 7. Auto Width
    sheet.columns.forEach(column => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            maxLength = Math.max(maxLength, val.length);
        });
        column.width = maxLength + 2;
    });

    // 8. Simpan file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
};
