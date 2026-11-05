import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportHourlySalesExcel = async ({
    data,
    grandTotalItems,
    grandTotalPenjualan,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Penjualan Per Jam");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PENJUALAN PER JAM";
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
    // 3. HEADER TABEL
    // =====================
    const columns = [
        "Waktu",
        "Jumlah Transaksi",
        "Penjualan",
        "Rata-rata"
    ];

    columns.forEach((col, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = col;
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

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const avgPerTransaction = item.count > 0
            ? Math.round(item.grandTotalSum / item.count)
            : 0;

        const rowData = [
            item.hour,
            item.count,
            item.grandTotalSum,
            avgPerTransaction
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;

            if (i === 0) {
                // Waktu - left aligned
                cell.alignment = { horizontal: "left" };
            } else {
                // Numeric columns - right aligned with number format
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            }

            cell.border = undefined;
        });

        currentRow++;
    });

    // =====================
    // 5. GRAND TOTAL
    // =====================
    const grandAverage = grandTotalItems > 0
        ? Math.round(grandTotalPenjualan / grandTotalItems)
        : 0;

    const grandRow = [
        "GRAND TOTAL",
        grandTotalItems,
        grandTotalPenjualan,
        grandAverage
    ];

    grandRow.forEach((value, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = value;
        cell.font = { bold: true };

        if (i === 0) {
            cell.alignment = { horizontal: "left" };
        } else {
            cell.numFmt = "#,##0";
            cell.alignment = { horizontal: "right" };
        }

        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" }
        };

        cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } }
        };
    });

    currentRow++;

    // =====================
    // 6. RINGKASAN SECTION
    // =====================
    currentRow += 2; // spasi

    const summaryTitleCell = sheet.getCell(`A${currentRow}`);
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    summaryTitleCell.value = "RINGKASAN";
    summaryTitleCell.font = { bold: true, size: 14 };
    currentRow++;

    // Cari jam dengan penjualan tertinggi dan terendah
    let peakHour = null;
    let lowestHour = null;

    if (data.length > 0) {
        peakHour = data.reduce((max, item) =>
            item.grandTotalSum > max.grandTotalSum ? item : max
        );

        lowestHour = data.reduce((min, item) =>
            item.grandTotalSum < min.grandTotalSum ? item : min
        );
    }

    const summaryData = [
        ["Total Jam Operasional", `${data.length} jam`],
        ["Total Transaksi", `${grandTotalItems?.toLocaleString('id-ID') || 0} transaksi`],
        ["Total Penjualan", `Rp ${grandTotalPenjualan?.toLocaleString('id-ID') || 0}`],
        ["Rata-rata per Transaksi", `Rp ${grandAverage?.toLocaleString('id-ID') || 0}`],
        ["Rata-rata per Jam", `Rp ${data.length > 0 ? Math.round(grandTotalPenjualan / data.length)?.toLocaleString('id-ID') : 0}`]
    ];

    // Tambahkan jam peak dan terendah jika ada data
    if (peakHour) {
        summaryData.push([
            "Jam Tersibuk",
            `${peakHour.hour} (Rp ${peakHour.grandTotalSum?.toLocaleString('id-ID')})`
        ]);
    }

    if (lowestHour) {
        summaryData.push([
            "Jam Tersepi",
            `${lowestHour.hour} (Rp ${lowestHour.grandTotalSum?.toLocaleString('id-ID')})`
        ]);
    }

    summaryData.forEach(([label, value]) => {
        const labelCell = sheet.getCell(`A${currentRow}`);
        const valueCell = sheet.getCell(`B${currentRow}`);

        labelCell.value = label;
        labelCell.font = { bold: true };

        valueCell.value = value;
        valueCell.alignment = { horizontal: "left" };

        currentRow++;
    });

    // =====================
    // 7. FREEZE HEADER
    // =====================
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // =====================
    // 8. AUTO WIDTH
    // =====================
    const columnWidths = [
        20,  // Waktu
        20,  // Jumlah Transaksi
        20,  // Penjualan
        20   // Rata-rata
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && i !== 0) {
                maxLength = val.length;
            }
        });
        column.width = maxLength + 2;
    });

    // =====================
    // 9. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, fileName);
};