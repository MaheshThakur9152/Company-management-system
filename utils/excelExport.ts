// import ExcelJS from 'exceljs';
import { Employee, AttendanceRecord } from '../types';
import { ensureExcelJSLoaded } from './excelGenerator';

/**
 * Generates Excel attendance report matching the exact Ambe-Bill.xlsx format
 * with precise styling, colors, formulas, and layout
 */
export async function generateAttendanceExcel(
    employees: Employee[],
    attendanceData: AttendanceRecord[],
    month: number = 11, // November
    year: number = 2025
): Promise<any> {
    const ExcelJS = await ensureExcelJSLoaded();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Get month details
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthName = monthNames[month - 1];
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // ============ COLUMN WIDTHS ============
    worksheet.getColumn(1).width = 5;   // SR
    worksheet.getColumn(2).width = 12;  // Biometric Code
    worksheet.getColumn(3).width = 25;  // Employee Name
    worksheet.getColumn(4).width = 10;  // Weekly Off

    // Day columns (5 to 35 for max 31 days)
    for (let i = 5; i <= 4 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 3.5;
    }

    // Summary columns
    worksheet.getColumn(4 + daysInMonth + 1).width = 12; // TOTAL PRESENT DAYS
    worksheet.getColumn(4 + daysInMonth + 2).width = 10; // WEEKLY OFF
    worksheet.getColumn(4 + daysInMonth + 3).width = 6;  // HD
    worksheet.getColumn(4 + daysInMonth + 4).width = 10; // TOTAL DAYS

    // ============ HEADER ROWS ============
    let currentRow = 1;

    // Row 1: Empty spacer
    worksheet.getRow(currentRow).height = 15;
    currentRow++;

    // Row 2: Company Name
    const companyRow = worksheet.getRow(currentRow);
    companyRow.height = 20;
    worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
    const companyCell = worksheet.getCell(currentRow, 1);
    companyCell.value = 'AMBE SERVICE FACILITY PVT. LTD.';
    companyCell.font = { name: 'Arial', size: 14, bold: true };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    companyCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
    };
    currentRow++;

    // Row 3: Site Name
    const siteRow = worksheet.getRow(currentRow);
    siteRow.height = 18;
    worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
    const siteCell = worksheet.getCell(currentRow, 1);
    siteCell.value = 'SITE - AJMERA MANHATTAN, BHAKTI PARK, WADALA (E)';
    siteCell.font = { name: 'Arial', size: 11, bold: true };
    siteCell.alignment = { horizontal: 'center', vertical: 'middle' };
    siteCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
    };
    currentRow++;

    // Row 4: Month/Year
    const monthRow = worksheet.getRow(currentRow);
    monthRow.height = 18;
    worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
    const monthCell = worksheet.getCell(currentRow, 1);
    monthCell.value = `ATTENDANCE FOR THE MONTH OF ${monthName} - ${year}`;
    monthCell.font = { name: 'Arial', size: 11, bold: true };
    monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
    monthCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFCD5B4' }
    };
    currentRow++;

    // Row 5: Column Headers
    const headerRow = worksheet.getRow(currentRow);
    headerRow.height = 30;
    const headers = ['SR', 'Biometric Code', 'Employee Name', 'Weekly Off', ...daysArray, 'TOTAL PRESENT DAYS', 'WEEKLY OFF', 'HD', 'TOTAL DAYS'];

    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF92D050' } // Green
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    currentRow++;

    // Row 6: Day Names (Mon, Tue, etc.)
    const dayNamesRow = worksheet.getRow(currentRow);
    dayNamesRow.height = 15;

    // First 4 columns empty
    for (let i = 1; i <= 4; i++) {
        const cell = dayNamesRow.getCell(i);
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // Day names
    daysArray.forEach((day, index) => {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const cell = dayNamesRow.getCell(5 + index);
        cell.value = dayName;
        cell.font = { name: 'Arial', size: 8, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' } // Light yellow
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Last 4 columns empty
    for (let i = 5 + daysInMonth; i <= 4 + daysInMonth + 4; i++) {
        const cell = dayNamesRow.getCell(i);
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }
    currentRow++;

    // ============ EMPLOYEE DATA ROWS ============
    const dataStartRow = currentRow;
    let totalPresentPerDay = new Array(daysInMonth).fill(0);
    let totalStrengthPerDay = new Array(daysInMonth).fill(0);

    employees.forEach((emp, empIndex) => {
        const empRecords = attendanceData.filter(r => r.employeeId === emp.id);

        // Main employee row
        const empRow = worksheet.getRow(currentRow);
        empRow.height = 18;

        let rowPresent = 0;
        let rowWO = 0;
        let rowHD = 0;

        // SR Number
        const srCell = empRow.getCell(1);
        srCell.value = empIndex + 1;
        srCell.font = { name: 'Arial', size: 9 };
        srCell.alignment = { horizontal: 'center', vertical: 'middle' };
        srCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Biometric Code
        const codeCell = empRow.getCell(2);
        codeCell.value = emp.biometricCode;
        codeCell.font = { name: 'Arial', size: 9 };
        codeCell.alignment = { horizontal: 'center', vertical: 'middle' };
        codeCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Employee Name
        const nameCell = empRow.getCell(3);
        nameCell.value = emp.name;
        nameCell.font = { name: 'Arial', size: 9 };
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Weekly Off
        const woCell = empRow.getCell(4);
        woCell.value = emp.weeklyOff;
        woCell.font = { name: 'Arial', size: 9 };
        woCell.alignment = { horizontal: 'center', vertical: 'middle' };
        woCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Daily attendance
        daysArray.forEach((day, dayIndex) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = empRecords.find(r => r.date === dateStr);
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const isWO = emp.weeklyOff.toLowerCase() === dayName.toLowerCase();

            const cell = empRow.getCell(5 + dayIndex);
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            if (record) {
                if (record.status === 'P') {
                    cell.value = 'P';
                    cell.font = { ...cell.font, color: { argb: 'FF000000' } };
                    rowPresent++;
                    totalPresentPerDay[dayIndex]++;
                    totalStrengthPerDay[dayIndex]++;
                } else if (record.status === 'A') {
                    cell.value = 'A';
                    cell.font = { ...cell.font, color: { argb: 'FFFF0000' } }; // Red
                    totalStrengthPerDay[dayIndex]++;
                } else if (record.status === 'HD') {
                    cell.value = 'HD';
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF00' } // Yellow
                    };
                    rowHD++;
                    rowPresent += 0.5;
                    totalPresentPerDay[dayIndex] += 0.5;
                    totalStrengthPerDay[dayIndex]++;
                } else if (record.status === 'W/O') {
                    cell.value = 'W/O';
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF92D050' } // Green
                    };
                    rowWO++;
                }
            } else {
                // Future dates or missing data
                const isFuture = date > new Date();
                if (!isFuture) {
                    cell.value = 'A';
                    cell.font = { ...cell.font, color: { argb: 'FFFF0000' } }; // Red
                    totalStrengthPerDay[dayIndex]++;
                }
            }
        });

        // Total Present Days
        const totalPresentCell = empRow.getCell(5 + daysInMonth);
        totalPresentCell.value = rowPresent;
        totalPresentCell.font = { name: 'Arial', size: 9, bold: true };
        totalPresentCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalPresentCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        totalPresentCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCFFCC' } // Light green
        };

        // Weekly Off Count
        const woCountCell = empRow.getCell(6 + daysInMonth);
        woCountCell.value = rowWO;
        woCountCell.font = { name: 'Arial', size: 9, bold: true };
        woCountCell.alignment = { horizontal: 'center', vertical: 'middle' };
        woCountCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // HD Count
        const hdCountCell = empRow.getCell(7 + daysInMonth);
        hdCountCell.value = rowHD;
        hdCountCell.font = { name: 'Arial', size: 9, bold: true };
        hdCountCell.alignment = { horizontal: 'center', vertical: 'middle' };
        hdCountCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Total Days (with formula)
        const totalDaysCell = empRow.getCell(8 + daysInMonth);
        const totalDaysCol = String.fromCharCode(65 + 4 + daysInMonth); // Column letter for total present
        const woCol = String.fromCharCode(65 + 5 + daysInMonth); // Column letter for WO
        totalDaysCell.value = { formula: `${totalDaysCol}${currentRow}+${woCol}${currentRow}` };
        totalDaysCell.font = { name: 'Arial', size: 9, bold: true };
        totalDaysCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalDaysCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        totalDaysCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' } // Light red
        };

        currentRow++;

        // Secondary row for HD indicators (matching template format)
        const hdRow = worksheet.getRow(currentRow);
        hdRow.height = 12;

        for (let i = 1; i <= 4 + daysInMonth + 4; i++) {
            const cell = hdRow.getCell(i);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' } // Very light gray
            };
        }
        currentRow++;
    });

    // ============ FOOTER ROWS ============

    // Present Strength Row
    const presentStrengthRow = worksheet.getRow(currentRow);
    presentStrengthRow.height = 18;

    const psCell1 = presentStrengthRow.getCell(1);
    psCell1.value = '';
    psCell1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    worksheet.mergeCells(currentRow, 2, currentRow, 3);
    const psCell2 = presentStrengthRow.getCell(2);
    psCell2.value = 'PRESENT STRENGTH';
    psCell2.font = { name: 'Arial', size: 10, bold: true };
    psCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    psCell2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' } // Orange
    };
    psCell2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const psCell4 = presentStrengthRow.getCell(4);
    psCell4.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Daily present counts
    totalPresentPerDay.forEach((count, index) => {
        const cell = presentStrengthRow.getCell(5 + index);
        cell.value = count || '';
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' } // Light yellow
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Total present sum
    const totalPresentSum = totalPresentPerDay.reduce((a, b) => a + b, 0);
    const psTotalCell = presentStrengthRow.getCell(5 + daysInMonth);
    psTotalCell.value = totalPresentSum;
    psTotalCell.font = { name: 'Arial', size: 10, bold: true };
    psTotalCell.alignment = { horizontal: 'center', vertical: 'middle' };
    psTotalCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' } // Orange
    };
    psTotalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // "GOOD DAY" label
    worksheet.mergeCells(currentRow, 6 + daysInMonth, currentRow, 8 + daysInMonth);
    const goodDayCell = presentStrengthRow.getCell(6 + daysInMonth);
    goodDayCell.value = 'GOOD DAY';
    goodDayCell.font = { name: 'Arial', size: 10, bold: true };
    goodDayCell.alignment = { horizontal: 'center', vertical: 'middle' };
    goodDayCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF92D050' } // Green
    };
    goodDayCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    currentRow++;

    // Total Strength Row
    const totalStrengthRow = worksheet.getRow(currentRow);
    totalStrengthRow.height = 18;

    const tsCell1 = totalStrengthRow.getCell(1);
    tsCell1.value = '';
    tsCell1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    worksheet.mergeCells(currentRow, 2, currentRow, 3);
    const tsCell2 = totalStrengthRow.getCell(2);
    tsCell2.value = 'TOTAL STRENGTH';
    tsCell2.font = { name: 'Arial', size: 10, bold: true };
    tsCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    tsCell2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6666' } // Light red
    };
    tsCell2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const tsCell4 = totalStrengthRow.getCell(4);
    tsCell4.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Daily strength counts
    totalStrengthPerDay.forEach((count, index) => {
        const cell = totalStrengthRow.getCell(5 + index);
        cell.value = count || '';
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' } // Light red
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Total strength sum
    const totalStrengthSum = totalStrengthPerDay.reduce((a, b) => a + b, 0);
    const tsTotalCell = totalStrengthRow.getCell(5 + daysInMonth);
    tsTotalCell.value = totalStrengthSum;
    tsTotalCell.font = { name: 'Arial', size: 10, bold: true };
    tsTotalCell.alignment = { horizontal: 'center', vertical: 'middle' };
    tsTotalCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6666' } // Light red
    };
    tsTotalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Empty cells
    for (let i = 6 + daysInMonth; i <= 8 + daysInMonth; i++) {
        const cell = totalStrengthRow.getCell(i);
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }

    currentRow++;

    // ============ STATISTICS BOX ============
    currentRow++; // Spacer
    currentRow++; // Spacer

    // Legend and Statistics
    const legendData = [
        { code: 'N/J', desc: 'NEW JOINING', stat: 'JANITORS', value: '' },
        { code: 'W/O', desc: 'WEEKLY OFF', stat: 'Monthly Approved Manpower', value: `${employees.length} x ${daysInMonth} = ${employees.length * daysInMonth}` },
        { code: 'HD', desc: 'HOLIDAY/HALF DAY', stat: '(Excess)/Shortage Manpower', value: `${(employees.length * daysInMonth - totalPresentSum).toFixed(2)}` },
        { code: 'H/F', desc: 'IN/OUT BIOMETRIC MISSING', stat: 'Monthly %', value: `${((totalPresentSum / (employees.length * daysInMonth)) * 100).toFixed(2)}%` }
    ];

    legendData.forEach((item) => {
        const row = worksheet.getRow(currentRow);
        row.height = 18;

        // Empty cell
        const cell1 = row.getCell(1);
        cell1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Code
        const codeCell = row.getCell(2);
        codeCell.value = item.code;
        codeCell.font = { name: 'Arial', size: 10, bold: true };
        codeCell.alignment = { horizontal: 'center', vertical: 'middle' };
        codeCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' } // Gray
        };
        codeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Description
        worksheet.mergeCells(currentRow, 3, currentRow, 14);
        const descCell = row.getCell(3);
        descCell.value = item.desc;
        descCell.font = { name: 'Arial', size: 9 };
        descCell.alignment = { horizontal: 'left', vertical: 'middle' };
        descCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Statistic label
        worksheet.mergeCells(currentRow, 15, currentRow, 18);
        const statCell = row.getCell(15);
        statCell.value = item.stat;
        statCell.font = { name: 'Arial', size: 9, bold: true };
        statCell.alignment = { horizontal: 'right', vertical: 'middle' };
        statCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' } // Light yellow
        };
        statCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Value
        worksheet.mergeCells(currentRow, 19, currentRow, 20);
        const valueCell = row.getCell(19);
        valueCell.value = item.value;
        valueCell.font = { name: 'Arial', size: 9, bold: true };
        valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        valueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCFFCC' } // Light green
        };
        valueCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        currentRow++;
    });

    // Generate buffer
    return await workbook.xlsx.writeBuffer() as ExcelJS.Buffer;
}
