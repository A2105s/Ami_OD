// Script to create a sample Excel file for testing
const XLSX = require('xlsx');
const path = require('path');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Create data for the Excel file
const eventData = [
  ['Event Details', ''],
  ['Event Name', 'Coding Workshop'],
  ['Coordinator', 'Dr. John Smith'],
  ['Event Date', '2023-11-15'],
  ['Day', 'Wednesday'],
  ['Event Time', '10:00-12:00'],
  ['Venue', 'Computer Lab 101'],
  ['', ''],
  ['Student Name', 'Program', 'Section', 'Semester', 'Group'],
  ['John Doe', 'B.Tech CSE', 'A', '3', 'Group 1'],
  ['Jane Smith', 'B.Tech CSE', 'A', '3', 'Group 2'],
  ['Alice Johnson', 'B.Tech CSE', 'B', '3', 'Group 1'],
  ['Bob Brown', 'B.Tech CSE', 'B', '3', 'Group 2'],
  ['Charlie Davis', 'B.Tech CSE', 'A', '3', 'Group 1']
];

// Convert data to worksheet
const ws = XLSX.utils.aoa_to_sheet(eventData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Event');

// Write to file
const filePath = path.join(__dirname, 'sample_event.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Sample Excel file created at: ${filePath}`);