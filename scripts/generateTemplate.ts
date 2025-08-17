import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function generateTemplate() {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Sample data based on the image
  const data = [
    ['Event Name', 'Date', 'Day', 'Time', 'Venue', 'Coordinator'],
    ['Jai baba Akhilesh Basa', '02-06-2025', 'Wednesday', '9:15-10:10_10:15-11:10_13:15-14:10_15:15-16:10', 'Amity University', 'Dr. Ram Kumar Sharma Singh'],
    [], // Empty row for better readability
    ['S.No', 'Name', 'Program', 'Section', 'Semester', 'Group', 'Email', 'Phone Number'],
    [1, 'Adarsh Singh', 'CSE', 'A', 3, '1', 'adarsh@example.com', '9876543210'],
    [2, 'Aryan Tomar', 'CSE', 'D', 3, '2', 'aryan@example.com', '9876543211'],
    [3, 'Namma Singh', 'BCA', 'A', 3, '1', 'namma@example.com', '9876543212']
  ];

  // Create a worksheet from the data
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // S.No
    { wch: 20 }, // Name
    { wch: 10 }, // Program
    { wch: 8 },  // Section
    { wch: 8 },  // Semester
    { wch: 8 },  // Group
    { wch: 25 }, // Email
    { wch: 12 }  // Phone Number
  ];
  ws['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'OD Request');

  // Add data validation for Program, Section, and Semester
  const validationSheet = XLSX.utils.aoa_to_sheet([
    ['Programs', 'Sections', 'Semesters', 'Groups'],
    ['CSE', 'A', 1, 1],
    ['IT', 'B', 2, 2],
    ['BCA', 'C', 3, 3],
    ['B.Tech', 'D', 4, 4],
    ['BBA', 'E', 5, 5],
    ['B.Com', 'F', 6, 6],
    ['MBA', 'G', 7, 7],
    ['MCA', 'H', 8, 8]
  ]);
  XLSX.utils.book_append_sheet(wb, validationSheet, 'Validation');

  // Set up data validation
  if (!ws['!dataValidations']) ws['!dataValidations'] = [];
  
  // Program validation (column C, starting from row 5)
  ws['!dataValidations'].push({
    ref: 'C5:C1000',
    t: 'list',
    formula1: 'Validation!$A$2:$A$9'
  });

  // Section validation (column D)
  ws['!dataValidations'].push({
    ref: 'D5:D1000',
    t: 'list',
    formula1: 'Validation!$B$2:$B$9'
  });

  // Semester validation (column E)
  ws['!dataValidations'].push({
    ref: 'E5:E1000',
    t: 'list',
    formula1: 'Validation!$C$2:$C$9'
  });

  // Group validation (column F)
  ws['!dataValidations'].push({
    ref: 'F5:F1000',
    t: 'list',
    formula1: 'Validation!$D$2:$D$9'
  });

  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'public', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the workbook to a file
  const outputPath = path.join(outputDir, 'od_template.xlsx');
  XLSX.writeFile(wb, outputPath);
  
  console.log(`Template generated at: ${outputPath}`);
}

generateTemplate();
