/**
 * Browser-compatible Excel export using ExcelJS
 * This file provides a function to generate attendance Excel with exact formatting
 */

// Import ExcelJS from CDN in index.html
// <script src="https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js"></script>

async function generateAttendanceExcelBrowser(employees, attendanceData, month = 11, year = 2025, sites = []) {
  const ExcelJS = window.ExcelJS;
  if (!ExcelJS) {
    throw new Error('ExcelJS library not loaded');
  }

  const workbook = new ExcelJS.Workbook();

  // Group employees by site
  const employeesBySite = {};

  sites.forEach(site => {
    employeesBySite[site.id] = {
      name: site.name,
      employees: []
    };
  });

  employees.forEach(emp => {
    // Filter out inactive employees who left before the start of the report month
    if (emp.status === 'Inactive' && emp.leavingDate) {
      const leavingDate = new Date(emp.leavingDate);
      const reportMonthStart = new Date(year, month - 1, 1);
      leavingDate.setHours(0, 0, 0, 0);
      reportMonthStart.setHours(0, 0, 0, 0);

      if (leavingDate < reportMonthStart) {
        return;
      }
    }

    const siteId = emp.siteId || 'unknown';
    if (!employeesBySite[siteId]) {
      employeesBySite[siteId] = {
        name: sites.find(s => s.id === siteId)?.name || 'Unknown Site',
        employees: []
      };
    }
    employeesBySite[siteId].employees.push(emp);
  });

  const siteIds = Object.keys(employeesBySite);

  if (siteIds.length === 0) {
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.getCell(1, 1).value = "No Data Available";
  } else {
    for (const siteId of siteIds) {
      const siteData = employeesBySite[siteId];

      // Skip sites with no employees
      if (siteData.employees.length === 0) continue;
      // Skip sites with no employees
      if (siteData.employees.length === 0) continue;
      let sheetName = siteData.name.replace(/[*?:\/\[\]\\]/g, '').substring(0, 31) || `Site ${siteId}`;

      let counter = 1;
      let originalName = sheetName;
      while (workbook.getWorksheet(sheetName)) {
        sheetName = `${originalName.substring(0, 28)}(${counter})`;
        counter++;
      }

      generateSheetContent(workbook, sheetName, siteData.name, siteData.employees, attendanceData, month, year);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = monthNames[month - 1];

  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Attendance_All_Sites_${monthName}_${year}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function generateSheetContent(workbook, sheetName, siteDisplayName, employees, attendanceData, month, year) {
  const worksheet = workbook.addWorksheet(sheetName);
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = monthNames[month - 1];
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ============ COLUMN WIDTHS ============
  worksheet.getColumn(1).width = 6;   // SR
  worksheet.getColumn(2).width = 15;  // Biometric Code
  worksheet.getColumn(3).width = 30;  // Employee Name
  worksheet.getColumn(4).width = 12;  // Weekly Off

  for (let i = 5; i <= 4 + daysInMonth; i++) {
    worksheet.getColumn(i).width = 6;
  }

  // Summary columns
  worksheet.getColumn(4 + daysInMonth + 1).width = 15; // TOTAL PRESENT
  worksheet.getColumn(4 + daysInMonth + 2).width = 12; // WO
  worksheet.getColumn(4 + daysInMonth + 3).width = 8;  // HD (Holiday)
  worksheet.getColumn(4 + daysInMonth + 4).width = 12; // TOTAL

  // ============ HEADER ROWS ============
  let currentRow = 1;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  const companyRow = worksheet.getRow(currentRow);
  companyRow.height = 25;
  worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
  const companyCell = worksheet.getCell(currentRow, 1);
  companyCell.value = 'AMBE SERVICE FACILITY PVT. LTD.';
  companyCell.font = { name: 'Arial', size: 16, bold: true };
  companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
  companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  companyCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++;

  const siteRow = worksheet.getRow(currentRow);
  siteRow.height = 22;
  worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
  const siteCell = worksheet.getCell(currentRow, 1);
  siteCell.value = `SITE - ${siteDisplayName.toUpperCase()}`;
  siteCell.font = { name: 'Arial', size: 12, bold: true };
  siteCell.alignment = { horizontal: 'center', vertical: 'middle' };
  siteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  siteCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++;

  const monthRow = worksheet.getRow(currentRow);
  monthRow.height = 22;
  worksheet.mergeCells(currentRow, 1, currentRow, 4 + daysInMonth + 4);
  const monthCell = worksheet.getCell(currentRow, 1);
  monthCell.value = `${siteDisplayName.toUpperCase()} - ATTENDANCE FOR THE MONTH OF ${monthName} - ${year}`;
  monthCell.font = { name: 'Arial', size: 12, bold: true };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
  monthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  monthCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++;

  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 40;
  const headers = ['SR', 'Biometric Code', 'Employee Name', 'Weekly Off', ...daysArray, 'TOTAL PRESENT', 'WEEKLY OFF', 'HD', 'TOTAL DAYS'];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Removed green fill for header
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Highlight Sunday columns in header if needed, but usually day names row handles it
  });
  currentRow++;

  const dayNamesRow = worksheet.getRow(currentRow);
  dayNamesRow.height = 90; // Taller for vertical text

  for (let i = 1; i <= 4; i++) {
    const cell = dayNamesRow.getCell(i);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }

  daysArray.forEach((day, index) => {
    const date = new Date(year, month - 1, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const cell = dayNamesRow.getCell(5 + index);
    cell.value = dayName;
    cell.font = { name: 'Arial', size: 8, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

    // Highlight Sundays
    if (dayName === 'Sunday') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Green
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    }

    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (let i = 5 + daysInMonth; i <= 4 + daysInMonth + 4; i++) {
    const cell = dayNamesRow.getCell(i);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

    if (i === 5 + daysInMonth) cell.value = "TOTAL PRESENT";
    if (i === 5 + daysInMonth + 1) cell.value = "WEEKLY OFF";
    if (i === 5 + daysInMonth + 2) cell.value = "HD";
    if (i === 5 + daysInMonth + 3) cell.value = "TOTAL DAYS";
  }
  currentRow++;

  // ============ EMPLOYEE DATA ROWS ============
  employees.forEach((emp, empIndex) => {
    const empRecords = attendanceData.filter(r => r.employeeId === emp.id);
    const empRow = worksheet.getRow(currentRow);
    empRow.height = 30;

    let rowPresent = 0;
    let rowWO = 0;
    let rowHD = 0; // Holiday

    const srCell = empRow.getCell(1);
    srCell.value = empIndex + 1;
    srCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const codeCell = empRow.getCell(2);
    codeCell.value = emp.biometricCode;
    codeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const nameCell = empRow.getCell(3);
    nameCell.value = emp.name;
    nameCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const woCell = empRow.getCell(4);
    woCell.value = emp.weeklyOff;
    woCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    let skipUntilIndex = -1;

    daysArray.forEach((day, dayIndex) => {
      if (dayIndex <= skipUntilIndex) return;

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = empRecords.find(r => r.date === dateStr);
      const date = new Date(year, month - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isWO = emp.weeklyOff.toLowerCase() === dayName.toLowerCase();

      // Check for Leave Spanning
      if (emp.status === 'On Leave' && emp.leavingDate) {
        const [ly, lm, ld] = emp.leavingDate.split('-').map(Number);
        const leaveStart = new Date(ly, lm - 1, ld);
        // Reset hours for accurate comparison
        leaveStart.setHours(0, 0, 0, 0);

        let leaveEnd = null;
        if (emp.returnDate) {
          const [ry, rm, rd] = emp.returnDate.split('-').map(Number);
          leaveEnd = new Date(ry, rm - 1, rd);
          leaveEnd.setHours(0, 0, 0, 0);
        }

        const currentMs = date.getTime();
        const startMs = leaveStart.getTime();

        // Determine effective range for this month
        const monthStart = new Date(year, month - 1, 1);
        monthStart.setHours(0, 0, 0, 0);
        const effectiveStart = startMs < monthStart.getTime() ? monthStart : leaveStart;

        // Check if current date is within leave
        const isWithin = leaveEnd ? (currentMs >= startMs && currentMs <= leaveEnd.getTime()) : (currentMs >= startMs);

        if (isWithin) {
          // Only trigger merge on the first day of the visible leave block
          if (currentMs === effectiveStart.getTime()) {
            const monthEnd = new Date(year, month, 0);
            monthEnd.setHours(0, 0, 0, 0);
            const effectiveEnd = (leaveEnd && leaveEnd.getTime() < monthEnd.getTime()) ? leaveEnd : monthEnd;

            const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
            const spanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const cell = empRow.getCell(5 + dayIndex);
            try {
              // ExcelJS columns are 1-based, mergeCells takes (top, left, bottom, right)
              // 5 + dayIndex is the column number.
              worksheet.mergeCells(currentRow, 5 + dayIndex, currentRow, 5 + dayIndex + spanDays - 1);
            } catch (e) { console.error("Merge error", e); }

            cell.value = emp.leaveReason ? `On Leave: ${emp.leaveReason}` : 'On Leave';
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF9C4000' } }; // Orange text
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6CC' } }; // Light Orange
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            skipUntilIndex = dayIndex + spanDays - 1;
            return;
          }
        }
      }

      // Check for New Joining
      let isPreJoining = false;
      if (emp.joiningDate && emp.status !== 'Reliever') { // Exclude Relievers from New Joining display
        const joiningDate = new Date(emp.joiningDate);
        // Reset time parts for accurate comparison
        joiningDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date < joiningDate) {
          isPreJoining = true;
        }
      }

      const cell = empRow.getCell(5 + dayIndex);
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      if (isPreJoining) {
        cell.value = "N/J";
      } else if (record) {
        switch (record.status) {
          case 'P':
            if (isWO) {
              // Present on Week Off -> display as W/O on top and P on bottom
              cell.value = 'W/O\nP';
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC99FF' } };
              rowPresent++;
              rowWO++;
            } else {
              cell.value = 'P';
              rowPresent++;
            }
            break;
          case 'A':
            cell.value = 'A';
            cell.font = { ...cell.font, color: { argb: 'FFFF0000' }, bold: true };
            // Absent = 0 days.
            break;
          case 'PH': // Public Holiday -> Counts as HD (Holiday) column = 1 day
            cell.value = 'HD'; // Display HD for Holiday? Legend says HD = DASERA...
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
            rowHD++;
            break;
          case 'W/O': // Week Off -> 1 day
            cell.value = 'W/O';
            cell.font = { ...cell.font, color: { argb: 'FF0000FF' }, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCFF' } };
            rowWO++;
            break;
          case 'WOP': // Week Off Present -> 2 days (1 Present + 1 WO)
            // Display as two lines: W/O on top and P at bottom
            cell.value = 'W/O\nP';
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC99FF' } };
            rowPresent++;
            rowWO++;
            break;
          case 'WOE': // Week Off Extra? Assuming similar to W/O or WOP? 
            // Context implies Extra Week Off maybe?
            // If it's a paid off day:
            cell.value = 'WOE';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            rowWO++;
            break;
          case 'HDE': // Holiday Extra?
            cell.value = 'HDE';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
            rowHD++;
            break;
          case 'HD': // Half Day -> 0.5 Present
            cell.value = '0.5';
            rowPresent += 0.5;
            break;
          default:
            cell.value = record.status;
            // Default handling?
            break;
        }
      } else {
        const isFuture = date > new Date();
        if (!isFuture) {
          cell.value = 'A';
          cell.font = { ...cell.font, color: { argb: 'FFFF0000' }, bold: true };
          // Absent = 0
        }
      }
    });

    // Formulas for summary
    const startCol = worksheet.getColumn(5).letter;
    const endCol = worksheet.getColumn(4 + daysInMonth).letter;
    const rowNum = empRow.number;

    const totalPresentCell = empRow.getCell(5 + daysInMonth);
    // Include WOP (Week Off Present) variants in present count. Some cells may contain a newline ("W/O\nP"),
    // so we add COUNTIF checks for both contiguous and newline-containing variants using CHAR(10).
    totalPresentCell.value = {
      formula: `COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"P") + (COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"0.5")*0.5) + COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"WOP") + COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*WO*P*") + COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*WO"&CHAR(10)&"P*") + COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*W/O*P*") + COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*W/O"&CHAR(10)&"P*")`,
      result: rowPresent
    };
    totalPresentCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    totalPresentCell.numFmt = '0.00';

    const woCountCell = empRow.getCell(6 + daysInMonth);
    // Count WO variants including W/O, WOE and WOP. Also include patterns that may contain a newline (e.g. "W/O\nP").
    woCountCell.value = {
      formula: `COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"W/O")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"WOE")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"WOP")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*WO*P*")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*WO"&CHAR(10)&"P*")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*W/O*P*")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"*W/O"&CHAR(10)&"P*")`,
      result: rowWO
    };
    woCountCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    woCountCell.numFmt = '0.00';

    const hdCountCell = empRow.getCell(7 + daysInMonth);
    hdCountCell.value = {
      formula: `COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"HD")+COUNTIF(${startCol}${rowNum}:${endCol}${rowNum},"HDE")`,
      result: rowHD
    };
    hdCountCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const totalDaysCell = empRow.getCell(8 + daysInMonth);
    const pCol = worksheet.getColumn(5 + daysInMonth).letter;
    const wCol = worksheet.getColumn(6 + daysInMonth).letter;
    const hCol = worksheet.getColumn(7 + daysInMonth).letter;
    totalDaysCell.value = {
      formula: `${pCol}${rowNum}+${wCol}${rowNum}+${hCol}${rowNum}`,
      result: rowPresent + rowWO + rowHD
    };
    totalDaysCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    totalDaysCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White BG
    totalDaysCell.numFmt = '0.00';

    currentRow++;
  });

  // ============ FOOTER ROWS ============

  // PRESENT STRENGTH
  const presentStrengthRow = worksheet.getRow(currentRow);
  presentStrengthRow.height = 20;
  const psLabelCell = presentStrengthRow.getCell(3);
  psLabelCell.value = "PRESENT STRENGTH";
  psLabelCell.font = { bold: true };
  psLabelCell.alignment = { horizontal: 'right' };

  // Fill 0s for first 4 cols
  for (let i = 1; i <= 4; i++) {
    const cell = presentStrengthRow.getCell(i);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (i === 4) cell.value = 0;
  }

  // Formulas for Present Strength per day
  for (let i = 1; i <= daysInMonth; i++) {
    const colLetter = worksheet.getColumn(4 + i).letter;
    const startRow = 6; // Data starts at row 6
    const endRow = currentRow - 1;
    const cell = presentStrengthRow.getCell(4 + i);
    cell.value = {
      // Include WOP variants in daily present strength as well (including W/O\nP)
      formula: `COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"P") + (COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"0.5")*0.5) + COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"WOP") + COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"*WO*P*") + COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"*WO"&CHAR(10)&"P*") + COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"*W/O*P*") + COUNTIF(${colLetter}${startRow}:${colLetter}${endRow},"*W/O"&CHAR(10)&"P*")`,
    };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }; // Pinkish
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center' };
  }

  // Total Present Strength Sum
  const totalPresentColLetter = worksheet.getColumn(5 + daysInMonth).letter;
  const psTotalCell = presentStrengthRow.getCell(5 + daysInMonth);

  // Sum of daily present counts (Horizontal Sum)
  // This should match the vertical sum of employee total presents
  const psStartColLetter = worksheet.getColumn(5).letter;
  const psEndColLetter = worksheet.getColumn(4 + daysInMonth).letter;

  psTotalCell.value = {
    formula: `SUM(${psStartColLetter}${currentRow}:${psEndColLetter}${currentRow})`
  };
  psTotalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  psTotalCell.numFmt = '0.00';

  currentRow++;

  // TOTAL STRENGTH
  const totalStrengthRow = worksheet.getRow(currentRow);
  totalStrengthRow.height = 20;
  const tsLabelCell = totalStrengthRow.getCell(3);
  tsLabelCell.value = "TOTAL STRENGTH";
  tsLabelCell.font = { bold: true };
  tsLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let i = 1; i <= 4; i++) {
    const cell = totalStrengthRow.getCell(i);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (i === 4) cell.value = 0;
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const cell = totalStrengthRow.getCell(4 + i);

    // Calculate active employees for this day
    const currentDate = new Date(year, month - 1, i);
    currentDate.setHours(0, 0, 0, 0);

    const activeCount = employees.filter(e => {
      if (!e.joiningDate) return true;
      const jd = new Date(e.joiningDate);
      jd.setHours(0, 0, 0, 0);
      return currentDate >= jd;
    }).length;

    cell.value = activeCount;
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center' };
  }

  // Total Strength Sum (Horizontal Sum of Daily Total Strengths)
  // This represents the total man-days capacity for the month
  const startColLetter = worksheet.getColumn(5).letter; // Day 1
  const endColLetter = worksheet.getColumn(4 + daysInMonth).letter; // Last Day
  const tsTotalCell = totalStrengthRow.getCell(5 + daysInMonth);

  tsTotalCell.value = {
    formula: `SUM(${startColLetter}${currentRow}:${endColLetter}${currentRow})`
  };
  tsTotalCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  tsTotalCell.numFmt = '0.00';

  // GOOD DAY cell
  const goodDayCell = totalStrengthRow.getCell(5 + daysInMonth + 1); // WO column
  goodDayCell.value = "GOOD DAY";
  goodDayCell.alignment = { horizontal: 'center', vertical: 'middle' };
  goodDayCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // Add borders for HD and TOTAL DAYS columns in Total Strength row
  const hdStrengthCell = totalStrengthRow.getCell(5 + daysInMonth + 2);
  hdStrengthCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  const totalDaysStrengthCell = totalStrengthRow.getCell(5 + daysInMonth + 3);
  totalDaysStrengthCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  currentRow += 2; // Spacer

  // ============ FOOTER BOX ============
  // Legend
  const legendStartRow = currentRow;

  const legends = [
    { code: "N/J", desc: "NEW JOINING", color: null },
    { code: "W/O", desc: "WEEKLY OFF", color: null },
    { code: "HD", desc: "DASERA + DIWALI", color: 'FF00B0F0' }, // Blue
    { code: "IN", desc: "IN BIOMETRIC MISSING", color: 'FF92D050' }, // Green
    { code: "OUT", desc: "OUT BIOMETRIC MISSING", color: 'FFFFC000' }, // Orange
    { code: "I/O", desc: "IN & OUT BIOMETRIC", color: 'FFFF0000' } // Red
  ];

  legends.forEach((leg, i) => {
    const r = legendStartRow + i;
    const codeCell = worksheet.getCell(r, 2);
    codeCell.value = leg.code;
    codeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    if (leg.color) codeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: leg.color } };

    const descCell = worksheet.getCell(r, 3);
    descCell.value = leg.desc;
    descCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    descCell.font = { bold: true };
  });

  // Stats Box (Right Side)
  // Position: Aligned with Summary columns
  // We want to cover from (Last Day - 1) to (Total Days)
  // Columns: (4 + daysInMonth - 1) to (4 + daysInMonth + 4)
  const statsStartCol = 4 + daysInMonth - 1;

  // KEYMAN
  const keymanLabel = worksheet.getCell(legendStartRow, statsStartCol);
  keymanLabel.value = "KEYMAN";
  keymanLabel.font = { bold: true };
  keymanLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  // Merge from start to (Total Days - 1)
  // Total columns involved: 6. Indices: 0, 1, 2, 3, 4, 5.
  // Value is at index 5 (Total Days column).
  // Label merges 0 to 4.
  worksheet.mergeCells(legendStartRow, statsStartCol, legendStartRow, statsStartCol + 4);

  const keymanValue = worksheet.getCell(legendStartRow, statsStartCol + 5);
  keymanValue.value = { formula: `SUM(${totalPresentColLetter}6:${totalPresentColLetter}${legendStartRow - 4})` }; // Sum of Total Present
  keymanValue.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  keymanValue.numFmt = '0.00';
  keymanValue.font = { bold: true };

  // Monthly Approved Manpower
  const mamLabel = worksheet.getCell(legendStartRow + 1, statsStartCol);
  mamLabel.value = "Monthly Approved Manpower";
  mamLabel.font = { bold: true };
  mamLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  // Merge first 3 columns (Day 29, Day 30, Total Present)
  worksheet.mergeCells(legendStartRow + 1, statsStartCol, legendStartRow + 1, statsStartCol + 2);

  const mamVal1 = worksheet.getCell(legendStartRow + 1, statsStartCol + 3); // WO column
  mamVal1.value = employees.length; // Count
  mamVal1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  mamVal1.alignment = { horizontal: 'center' };

  const mamVal2 = worksheet.getCell(legendStartRow + 1, statsStartCol + 4); // HD column
  mamVal2.value = daysInMonth; // Days
  mamVal2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  mamVal2.alignment = { horizontal: 'center' };

  const mamTotal = worksheet.getCell(legendStartRow + 1, statsStartCol + 5); // Total Days column
  mamTotal.value = { formula: `${mamVal1.address}*${mamVal2.address}` };
  mamTotal.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  mamTotal.numFmt = '0.00';
  mamTotal.font = { bold: true };

  // (Excess)/Shortage Manpower
  const esLabel = worksheet.getCell(legendStartRow + 2, statsStartCol);
  esLabel.value = "(Excess)/Shortage Manpower";
  esLabel.font = { bold: true, color: { argb: 'FFFF0000' } };
  esLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.mergeCells(legendStartRow + 2, statsStartCol, legendStartRow + 2, statsStartCol + 4);

  const esValue = worksheet.getCell(legendStartRow + 2, statsStartCol + 5);
  esValue.value = { formula: `${mamTotal.address}-${keymanValue.address}` };
  esValue.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  esValue.numFmt = '0.00';
  esValue.font = { bold: true };

  // Monthly %
  const mpLabel = worksheet.getCell(legendStartRow + 3, statsStartCol);
  mpLabel.value = "Monthly %";
  mpLabel.font = { bold: true };
  mpLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.mergeCells(legendStartRow + 3, statsStartCol, legendStartRow + 3, statsStartCol + 4);

  const mpValue = worksheet.getCell(legendStartRow + 3, statsStartCol + 5);
  mpValue.value = { formula: `(${keymanValue.address}/${mamTotal.address})` };
  mpValue.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  mpValue.numFmt = '0.00%';
  mpValue.font = { bold: true };
}

window.generateAttendanceExcelBrowser = generateAttendanceExcelBrowser;

async function generatePayrollExcel(employees, attendanceData, month, year, sites = [], salaryRecords = []) {
  const ExcelJS = window.ExcelJS;
  if (!ExcelJS) throw new Error('ExcelJS library not loaded');

  const workbook = new ExcelJS.Workbook();

  const employeesBySite = {};
  sites.forEach(site => {
    employeesBySite[site.id] = { name: site.name, employees: [] };
  });

  employees.forEach(emp => {
    // Filter out inactive employees who left before the start of the report month
    if (emp.status === 'Inactive' && emp.leavingDate) {
      const leavingDate = new Date(emp.leavingDate);
      const reportMonthStart = new Date(year, month - 1, 1);
      leavingDate.setHours(0, 0, 0, 0);
      reportMonthStart.setHours(0, 0, 0, 0);

      if (leavingDate < reportMonthStart) {
        return;
      }
    }

    const siteId = emp.siteId || 'unknown';
    if (!employeesBySite[siteId]) {
      employeesBySite[siteId] = { name: sites.find(s => s.id === siteId)?.name || 'Unknown Site', employees: [] };
    }
    employeesBySite[siteId].employees.push(emp);
  });

  const siteIds = Object.keys(employeesBySite);

  if (siteIds.length === 0) {
    const worksheet = workbook.addWorksheet('Payroll');
    worksheet.getCell(1, 1).value = "No Data Available";
  } else {
    for (const siteId of siteIds) {
      const siteData = employeesBySite[siteId];
      if (siteData.employees.length === 0) continue;

      let sheetName = siteData.name.replace(/[*?:\/\[\]\\]/g, '').substring(0, 31) || `Site ${siteId}`;
      let counter = 1;
      let originalName = sheetName;
      while (workbook.getWorksheet(sheetName)) {
        sheetName = `${originalName.substring(0, 28)}(${counter})`;
        counter++;
      }

      generatePayrollSheet(workbook, sheetName, siteData.name, siteData.employees, attendanceData, month, year, salaryRecords);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Payroll_${year}_${month}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function generatePayrollSheet(workbook, sheetName, siteName, employees, attendanceData, month, year, salaryRecords = []) {
  const worksheet = workbook.addWorksheet(sheetName);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Title Row
  worksheet.mergeCells(1, 1, 1, 24);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `PAYROLL FOR ${siteName.toUpperCase()} - ${month}/${year}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
  worksheet.getRow(1).height = 25;

  // Headers
  const headers = [
    'SR', 'Employee Name', 'Post', 'Salary Base', '/Day', '/Hour',
    'PD', 'WO', 'WOE', 'HD', 'HDE', 'Deduction', 'TOTAL',
    'OT Hours', 'Total Days Amt', 'Total OT Amt', 'TOTAL GROSS',
    'Advance', 'Uniform', 'Shoes', 'ID', 'Others', 'Total Deduction', 'TOTAL NET'
  ];

  const headerRow = worksheet.getRow(2);
  headerRow.height = 30;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Data
  employees.forEach((emp, index) => {
    const empRecords = attendanceData.filter(r => {
      const d = new Date(r.date);
      return r.employeeId === emp.id && d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    // 1. Calculate Days (Matching employeeUtils.ts logic)
    let totalPaidDays = 0;

    // Counters for display columns
    let countPD = 0;
    let countWO = 0;
    let countWOE = 0;
    let countHD = 0; // HD (Holiday) from PH
    let countHDE = 0;
    let countHalfDay = 0; // HD status (0.5)

    const weekDayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const empWeeklyOffIdx = weekDayMap[emp.weeklyOff || 'Sunday'] ?? 0;

    // Iterate loop for day logic
    empRecords.forEach(r => {
      const d = new Date(r.date);
      const dayOfWeek = d.getDay();
      const isWeekoff = dayOfWeek === empWeeklyOffIdx;

      switch (r.status) {
        case 'P':
          if (isWeekoff) {
            totalPaidDays += 2;
            countPD += 1;
            countWO += 1;
          } else {
            totalPaidDays += 1;
            countPD += 1;
          }
          break;
        case 'WOP':
          totalPaidDays += 2;
          countPD += 1; // Treated as Present for breakdown
          countWO += 1; // Treated as Weekoff for breakdown
          break;
        case 'W/O':
          totalPaidDays += 1;
          countWO += 1;
          break;
        case 'HD': // Half Day
          totalPaidDays += 0.5;
          countHalfDay += 1;
          break;
        case 'PH': // Public Holiday
          totalPaidDays += 1;
          countHD += 1;
          break;
        case 'HDE':
          totalPaidDays += 1;
          countHDE += 1;
          break;
        case 'WOE':
          totalPaidDays += 1;
          countWOE += 1;
          break;
      }
    });

    const totalOTHours = empRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    // 2. Rates
    const salaryDetails = emp.salaryDetails || {};
    const baseSalary = salaryDetails.baseSalary || 0;
    const isDailyRated = salaryDetails.isDailyRated || false;
    const dailyRateOverride = salaryDetails.dailyRateOverride || 0;

    let dailyRate = 0;
    if (isDailyRated) {
      dailyRate = dailyRateOverride;
    } else {
      dailyRate = Math.floor(baseSalary / daysInMonth);
    }
    const hourlyRate = dailyRate / 9;

    // 3. Amounts (Calculated)
    const daysAmount = totalPaidDays * dailyRate;
    const otAmount = totalOTHours * hourlyRate;
    let grossSalary = daysAmount + otAmount;

    // 4. Deductions (Calculated)
    let ded = salaryDetails.deductionBreakdown || { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 };
    let totalDeductions = (ded.advance || 0) + (ded.uniform || 0) + (ded.shoes || 0) + (ded.idCard || 0) + (ded.cbre || 0) + (ded.others || 0);

    // 5. Net (Calculated)
    const netBeforeAllowances = grossSalary - totalDeductions;
    const allowances = (salaryDetails.allowancesBreakdown?.travelling || 0) + (salaryDetails.allowancesBreakdown?.others || 0);
    let finalNet = netBeforeAllowances + allowances;

    // 6. OVERRIDE with Salary Record if exists
    const record = salaryRecords.find(r => r.employeeId === emp.id && r.month === month && r.year === year);
    if (record) {
      // Use stored values
      grossSalary = record.grossSalary || grossSalary;
      totalDeductions = record.totalDeductions !== undefined ? record.totalDeductions : totalDeductions;
      finalNet = record.netSalary !== undefined ? record.netSalary : finalNet;

      // Use stored breakdown for deductions if available
      if (record.breakdown && record.breakdown.deductions) {
        ded = record.breakdown.deductions;
      }
    }

    const row = worksheet.getRow(index + 3);
    row.height = 20;

    // effectivePD calculation for display: countPD + (countHalfDay * 0.5)
    // Previous code used: effectivePD = pd + (hdHalf * 0.5)
    const effectivePD = countPD + (countHalfDay * 0.5);

    const cells = [
      index + 1,
      emp.name,
      emp.role,
      isDailyRated ? '-' : baseSalary,
      dailyRate,
      hourlyRate,
      effectivePD,
      countWO,
      countWOE,
      countHD, // HD column (PH)
      countHDE,
      ded.cbre || 0, // Deduction (CBRE)
      totalPaidDays, // TOTAL
      totalOTHours,
      daysAmount,
      otAmount,
      grossSalary,
      ded.advance || 0,
      ded.uniform || 0,
      ded.shoes || 0,
      ded.idCard || 0,
      ded.others || 0,
      totalDeductions,
      Math.round(finalNet)
    ];

    cells.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // Number formatting
      if (typeof val === 'number') {
        if (i === 4 || i === 5) { // Rates
          cell.numFmt = '#,##0.00';
        } else if (i >= 14) { // Amounts
          cell.numFmt = '#,##0';
        }
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  });

  // Auto-width
  worksheet.columns.forEach(column => {
    column.width = 10;
  });
  worksheet.getColumn(2).width = 25; // Name
  worksheet.getColumn(3).width = 15; // Post
  worksheet.getColumn(13).width = 12; // TOTAL
  worksheet.getColumn(17).width = 15; // GROSS
  worksheet.getColumn(24).width = 15; // NET
}

window.generatePayrollExcel = generatePayrollExcel;
