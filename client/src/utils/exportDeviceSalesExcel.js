import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportDeviceSalesExcel = async ({
    data,
    summary,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Penjualan Per Perangkat");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PENJUALAN PER PERANGKAT";
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
        "Nama Perangkat",
        "Tipe",
        "Outlet",
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
            horizontal: i < 3 ? "left" : "right"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const rowData = [
            item.deviceName || "-",
            item.deviceType || "-",
            item.outlet || "-",
            item.transactionCount || 0,
            item.totalSales || 0,
            item.averagePerTransaction || 0
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;

            if (i < 3) {
                // Text columns - left aligned
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
    if (summary) {
        const grandRow = [
            "GRAND TOTAL",
            "",
            "",
            summary.totalTransactions || 0,
            summary.totalSales || 0,
            summary.averagePerTransaction || 0
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i < 3) {
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
    }

    // =====================
    // 6. RINGKASAN SECTION
    // =====================
    if (summary) {
        currentRow += 2; // spasi

        const summaryTitleCell = sheet.getCell(`A${currentRow}`);
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        summaryTitleCell.value = "RINGKASAN";
        summaryTitleCell.font = { bold: true, size: 14 };
        currentRow++;

        // Cari perangkat dengan penjualan tertinggi dan terendah
        let topDevice = null;
        let lowestDevice = null;

        if (data.length > 0) {
            topDevice = data.reduce((max, item) =>
                (item.totalSales || 0) > (max.totalSales || 0) ? item : max
            );

            lowestDevice = data.reduce((min, item) =>
                (item.totalSales || 0) < (min.totalSales || 0) ? item : min
            );
        }

        const summaryData = [
            ["Total Perangkat", `${summary.totalDevices || data.length} perangkat`],
            ["Total Transaksi", `${summary.totalTransactions?.toLocaleString('id-ID') || 0} transaksi`],
            ["Total Penjualan", `Rp ${summary.totalSales?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Transaksi", `Rp ${summary.averagePerTransaction?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Perangkat", `Rp ${data.length > 0 ? Math.round(summary.totalSales / data.length)?.toLocaleString('id-ID') : 0}`]
        ];

        // Tambahkan perangkat terlaris dan terendah jika ada data
        if (topDevice && data.length > 1) {
            summaryData.push([
                "Perangkat Terlaris",
                `${topDevice.deviceName} (${topDevice.deviceType}) - Rp ${topDevice.totalSales?.toLocaleString('id-ID')}`
            ]);
        }

        if (lowestDevice && data.length > 1 && lowestDevice.deviceName !== topDevice.deviceName) {
            summaryData.push([
                "Perangkat Terendah",
                `${lowestDevice.deviceName} (${lowestDevice.deviceType}) - Rp ${lowestDevice.totalSales?.toLocaleString('id-ID')}`
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
    }

    // =====================
    // 7. FREEZE HEADER
    // =====================
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // =====================
    // 8. AUTO WIDTH
    // =====================
    const columnWidths = [
        25,  // Nama Perangkat
        15,  // Tipe
        20,  // Outlet
        20,  // Jumlah Transaksi
        20,  // Penjualan
        20   // Rata-rata
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && i < 3) {
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