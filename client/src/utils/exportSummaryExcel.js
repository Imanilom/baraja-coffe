import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportSummaryExcel = async ({
    summaryData,
    calculatedValues,
    paymentBreakdown = [],
    orderTypeBreakdown = [],
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Ringkasan");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:B1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN RINGKASAN PENJUALAN";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    // =====================
    // 2. HEADER INFO
    // =====================
    let currentRow = 3;
    headerInfo.forEach(([label, value]) => {
        sheet.getCell(`A${currentRow}`).value = label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
    });

    currentRow++; // spasi

    // =====================
    // 3. RINGKASAN UTAMA
    // =====================
    const summaryRows = [
        ["Penjualan Kotor", calculatedValues.penjualanKotor],
        ["Total Diskon", calculatedValues.diskonTotal],
        ["Penjualan Bersih", calculatedValues.penjualanBersih],
        ["Service Charge", calculatedValues.serviceCharge],
        ["Pajak", calculatedValues.pajak],
    ];

    summaryRows.forEach(([label, value]) => {
        const labelCell = sheet.getCell(`A${currentRow}`);
        const valueCell = sheet.getCell(`B${currentRow}`);

        labelCell.value = label;
        labelCell.font = { bold: true };

        valueCell.value = value;
        valueCell.numFmt = "#,##0";
        valueCell.alignment = { horizontal: "right" };

        currentRow++;
    });

    // Total Penjualan (highlight)
    const totalLabelCell = sheet.getCell(`A${currentRow}`);
    const totalValueCell = sheet.getCell(`B${currentRow}`);

    totalLabelCell.value = "Total Penjualan";
    totalLabelCell.font = { bold: true };
    totalLabelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" }
    };

    totalValueCell.value = calculatedValues.totalPenjualan;
    totalValueCell.numFmt = "#,##0";
    totalValueCell.alignment = { horizontal: "right" };
    totalValueCell.font = { bold: true };
    totalValueCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" }
    };
    totalValueCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } }
    };

    currentRow += 2; // spasi

    // =====================
    // 4. STATISTIK TAMBAHAN
    // =====================
    const statsRows = [
        ["Total Transaksi", summaryData.totalTransactions],
        ["Total Item Terjual", summaryData.totalItems],
        ["Rata-rata Nilai Transaksi", summaryData.avgOrderValue],
    ];

    statsRows.forEach(([label, value]) => {
        const labelCell = sheet.getCell(`A${currentRow}`);
        const valueCell = sheet.getCell(`B${currentRow}`);

        labelCell.value = label;
        labelCell.font = { bold: true };

        if (label === "Total Transaksi" || label === "Total Item Terjual") {
            valueCell.value = value;
            valueCell.alignment = { horizontal: "right" };
        } else {
            valueCell.value = value;
            valueCell.numFmt = "#,##0";
            valueCell.alignment = { horizontal: "right" };
        }

        currentRow++;
    });

    // =====================
    // 5. RINCIAN METODE PEMBAYARAN
    // =====================
    if (paymentBreakdown.length > 0) {
        currentRow += 2; // spasi

        const paymentTitleCell = sheet.getCell(`A${currentRow}`);
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        paymentTitleCell.value = "RINCIAN METODE PEMBAYARAN";
        paymentTitleCell.font = { bold: true, size: 14 };
        currentRow++;

        // Header
        const paymentHeaders = ["Metode Pembayaran", "Jumlah Transaksi", "Total Nominal", "Persentase"];
        paymentHeaders.forEach((header, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD9D9D9" }
            };
            cell.alignment = {
                horizontal: i === 0 ? "left" : "right"
            };
        });
        currentRow++;

        // Data
        paymentBreakdown.forEach(item => {
            const rowData = [
                item.method || "Pembayaran Tidak Terdeteksi / Null",
                item.count,
                item.amount,
                item.percentage
            ];

            rowData.forEach((value, i) => {
                const cell = sheet.getCell(currentRow, i + 1);
                cell.value = value;

                if (i === 1) {
                    cell.alignment = { horizontal: "right" };
                } else if (i === 2) {
                    cell.numFmt = "#,##0";
                    cell.alignment = { horizontal: "right" };
                } else if (i === 3) {
                    cell.value = value + "%";
                    cell.alignment = { horizontal: "right" };
                } else {
                    cell.alignment = { horizontal: "left" };
                }
            });

            currentRow++;
        });
    }

    // =====================
    // 6. RINCIAN TIPE PESANAN
    // =====================
    if (orderTypeBreakdown.length > 0) {
        currentRow += 2; // spasi

        const orderTitleCell = sheet.getCell(`A${currentRow}`);
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        orderTitleCell.value = "RINCIAN TIPE PESANAN";
        orderTitleCell.font = { bold: true, size: 14 };
        currentRow++;

        // Header
        const orderHeaders = ["Tipe Pesanan", "Jumlah Transaksi", "Total Nominal", "Persentase"];
        orderHeaders.forEach((header, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD9D9D9" }
            };
            cell.alignment = {
                horizontal: i === 0 ? "left" : "right"
            };
        });
        currentRow++;

        // Data
        orderTypeBreakdown.forEach(item => {
            const rowData = [
                item.type,
                item.count,
                item.total,
                item.percentage
            ];

            rowData.forEach((value, i) => {
                const cell = sheet.getCell(currentRow, i + 1);
                cell.value = value;

                if (i === 1) {
                    cell.alignment = { horizontal: "right" };
                } else if (i === 2) {
                    cell.numFmt = "#,##0";
                    cell.alignment = { horizontal: "right" };
                } else if (i === 3) {
                    cell.value = value + "%";
                    cell.alignment = { horizontal: "right" };
                } else {
                    cell.alignment = { horizontal: "left" };
                }
            });

            currentRow++;
        });
    }

    // =====================
    // 7. AUTO WIDTH
    // =====================
    sheet.columns.forEach(column => {
        let maxLength = 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            maxLength = Math.max(maxLength, val.length);
        });
        column.width = maxLength + 2;
    });

    // =====================
    // 8. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, fileName);
};