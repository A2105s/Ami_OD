// @ts-check

/**
 * @typedef {Object} TimetableEntry
 * @property {string} time
 * @property {string} subject
 * @property {string | null} [subject_code]
 * @property {string | null} [faculty]
 * @property {string} [group]
 */

/**
 * @typedef {Object} TimetableDay
 * @property {TimetableEntry[]} [Monday]
 * @property {TimetableEntry[]} [Tuesday]
 * @property {TimetableEntry[]} [Wednesday]
 * @property {TimetableEntry[]} [Thursday]
 * @property {TimetableEntry[]} [Friday]
 */

/**
 * @typedef {Object} NewTimetableData
 * @property {string} class_name
 * @property {Partial<Record<string, TimetableEntry[]>>} timetable
 */

/**
 * @param {NewTimetableData[]} newData
 * @returns {any}
 */
function convertTimetable(newData) {
  const result = {
    Programs: {
      "B.Tech CSE": {
        Semester: "3",
        Sections: {
          A: { Courses: [], Labs: [] },
          B: { Courses: [], Labs: [] },
          C: { Courses: [], Labs: [] },
          D: { Courses: [], Labs: [] },
          E: { Courses: [], Labs: [] }
        }
      },
      "BCA": {
        Semester: "3",
        Sections: {
          A: { Courses: [], Labs: [] },
          B: { Courses: [], Labs: [] }
        }
      },
      "BSA": {
        Semester: "3",
        Sections: {
          A: { Courses: [], Labs: [] },
          B: { Courses: [], Labs: [] },
          C: { Courses: [], Labs: [] }
        }
      },
      "B.Tech IT": {
        Semester: "3",
        Sections: {
          A: { Courses: [], Labs: [] },
          B: { Courses: [], Labs: [] }
        }
      },
      "B.Sc": {
        Semester: "3",
        Sections: {
          A: { Courses: [], Labs: [] },
          B: { Courses: [], Labs: [] },
          C: { Courses: [], Labs: [] },
          D: { Courses: [], Labs: [] },
          E: { Courses: [], Labs: [] }
        }
      }
    }
  };

  for (const classData of newData) {
    // Extract program and section from class name
    let program = 'B.Tech CSE'; // Default program
    let section = 'A'; // Default section
    
    // Try different patterns to match class name
    const patterns = [
      // B.Tech (IT) III A or B.Tech IT III A
      { 
        pattern: /B\.?Tech\s*\(?(IT|CSE)\)?\s+[IVX]+\s*([A-Z])\s*$/i,
        handler: (match) => {
          const prog = match[1]?.toUpperCase() || 'CSE';
          return {
            program: prog === 'IT' ? 'B.Tech IT' : 'B.Tech CSE',
            section: match[2] || 'A'
          };
        }
      },
      // BCA III A or BSA III A or B.Sc III A or BSC III A
      { 
        pattern: /(BCA|BSA|B\.?Sc|BSC)\s+[IVX]+\s*([A-Z])\s*$/i,
        handler: (match) => {
          const prog = match[1].toUpperCase();
          let programName = prog;
          if (prog === 'B.SC' || prog === 'BSC') programName = 'B.Sc';
          return {
            program: programName,
            section: match[2] || 'A'
          };
        }
      }
    ];
    
    let matched = false;
    for (const { pattern, handler } of patterns) {
      const match = classData.class_name.match(pattern);
      if (match) {
        const result = handler(match);
        program = result.program;
        section = result.section;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      console.warn(`Skipping invalid class name format: ${classData.class_name}`);
      continue;
    }
    
    // Initialize program if it doesn't exist
    if (!result.Programs[program]) {
      result.Programs[program] = {
        Semester: "3",
        Sections: {}
      };
    }
    
    // Initialize section if it doesn't exist
    if (!result.Programs[program].Sections[section]) {
      result.Programs[program].Sections[section] = {
        Courses: [],
        Labs: []
      };
    }

    // Skip if timetable is not defined
    if (!classData.timetable) {
      console.warn(`No timetable data found for ${classData.class_name}`);
      continue;
    }

    // Process each day in the timetable
    Object.entries(classData.timetable).forEach(([day, entries]) => {
      // Skip if no entries for this day
      if (!entries || !Array.isArray(entries)) return;

      entries.forEach(entry => {
        if (!entry || typeof entry !== 'object' || !entry.subject || !entry.time) return;
        
        try {
          const time = String(entry.time).replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => 
            `${h.padStart(2, '0')}:${m}`
          );
          
          const subjectCode = entry.subject_code || 
            (String(entry.subject).match(/\(([A-Z]{2,4}\s*\d{3})\)/) || [])[1] || 
            '';
          
          const facultyMatch = entry.faculty ? String(entry.faculty).match(/^([A-Z]+)/) : null;
          const facultyCode = facultyMatch ? facultyMatch[1] : '';
          const faculty = entry.faculty ? String(entry.faculty) : '';
          
          const baseEntry = {
            subject_code: subjectCode,
            subject_name: String(entry.subject),
            faculty: faculty.replace(/\([^)]+\)/g, '').trim(),
            faculty_code: facultyCode,
            day,
            time
          };

          const entryWithGroup = {
            ...baseEntry,
            group: entry.group || '1'
          };

          if (entry.group || String(entry.subject).toLowerCase().includes('lab')) {
            result.Programs[program].Sections[section].Labs.push(entryWithGroup);
          } else {
            result.Programs[program].Sections[section].Courses.push(baseEntry);
          }
        } catch (error) {
          console.error(`Error processing entry in ${classData.class_name}, ${day}:`, error);
        }
      });
    });
  }

  return result;
}

// The complete timetable data
const newTimetableData = [
  // BCA Section A
  {
    "class_name": "BCA III A",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Data Structures", "subject_code": "BCA301", "faculty": "Dr. Ravi Kumar" },
        { "time": "10:00-11:00", "subject": "Database Management", "subject_code": "BCA302", "faculty": "Dr. Priya Sharma" },
        { "time": "11:15-12:15", "subject": "Web Development Lab", "subject_code": "BCA303L", "faculty": "Mr. Amit Patel", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Operating Systems", "subject_code": "BCA304", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Computer Networks", "subject_code": "BCA305", "faculty": "Dr. Sanjay Verma" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Software Engineering", "subject_code": "BCA306", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "BCA307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "BCA308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Python Programming", "subject_code": "BCA309", "faculty": "Dr. Meena Iyer" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Data Structures", "subject_code": "BCA301", "faculty": "Dr. Ravi Kumar" },
        { "time": "10:00-11:00", "subject": "Computer Organization", "subject_code": "BCA310", "faculty": "Dr. Arjun Nair" },
        { "time": "11:15-12:15", "subject": "Web Development Lab", "subject_code": "BCA303L", "faculty": "Mr. Amit Patel", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Operating Systems", "subject_code": "BCA304", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Database Management", "subject_code": "BCA302", "faculty": "Dr. Priya Sharma" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "BCA307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "Python Programming Lab", "subject_code": "BCA311L", "faculty": "Dr. Meena Iyer", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" },
        { "time": "15:15-16:10", "subject": "Computer Networks", "subject_code": "BCA305", "faculty": "Dr. Sanjay Verma" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Software Engineering", "subject_code": "BCA306", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Computer Organization", "subject_code": "BCA310", "faculty": "Dr. Arjun Nair" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "BCA308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Python Programming", "subject_code": "BCA309", "faculty": "Dr. Meena Iyer" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ]
    }
  },
  // BCA Section B
  {
    "class_name": "BCA III B",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Web Technologies", "subject_code": "BCA307", "faculty": "Ms. Ritu Singh" },
        { "time": "10:00-11:00", "subject": "Data Structures", "subject_code": "BCA301", "faculty": "Dr. Ravi Kumar" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "BCA308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Database Management", "subject_code": "BCA302", "faculty": "Dr. Priya Sharma" },
        { "time": "15:15-16:10", "subject": "Computer Organization", "subject_code": "BCA310", "faculty": "Dr. Arjun Nair" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Python Programming", "subject_code": "BCA309", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Computer Networks", "subject_code": "BCA305", "faculty": "Dr. Sanjay Verma" },
        { "time": "11:15-12:15", "subject": "Web Development Lab", "subject_code": "BCA303L", "faculty": "Mr. Amit Patel", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Software Engineering", "subject_code": "BCA306", "faculty": "Dr. Anil Kapoor" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Computer Organization", "subject_code": "BCA310", "faculty": "Dr. Arjun Nair" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "BCA307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "Python Programming Lab", "subject_code": "BCA311L", "faculty": "Dr. Meena Iyer", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Data Structures", "subject_code": "BCA301", "faculty": "Dr. Ravi Kumar" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Computer Networks", "subject_code": "BCA305", "faculty": "Dr. Sanjay Verma" },
        { "time": "10:00-11:00", "subject": "Software Engineering", "subject_code": "BCA306", "faculty": "Dr. Anil Kapoor" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "BCA308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Database Management", "subject_code": "BCA302", "faculty": "Dr. Priya Sharma" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Python Programming", "subject_code": "BCA309", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Operating Systems", "subject_code": "BCA304", "faculty": "Dr. Neha Gupta" },
        { "time": "11:15-12:15", "subject": "Web Development Lab", "subject_code": "BCA303L", "faculty": "Mr. Amit Patel", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Computer Organization", "subject_code": "BCA310", "faculty": "Dr. Arjun Nair" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ]
    }
  },
  // BSA Section A
  {
    "class_name": "BSA III A",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Financial Accounting", "subject_code": "BSA301", "faculty": "Dr. Anjali Sharma" },
        { "time": "10:00-11:00", "subject": "Cost Accounting", "subject_code": "BSA302", "faculty": "Dr. Rajiv Mehta" },
        { "time": "11:15-12:15", "subject": "Accounting Lab", "subject_code": "BSA303L", "faculty": "Ms. Priya Nair", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Business Law", "subject_code": "BSA304", "faculty": "Mr. Amit Khanna" },
        { "time": "15:15-16:10", "subject": "Taxation", "subject_code": "BSA305", "faculty": "Dr. Sunil Kumar" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Auditing", "subject_code": "BSA306", "faculty": "Dr. Neha Gupta" },
        { "time": "10:00-11:00", "subject": "Financial Management", "subject_code": "BSA307", "faculty": "Dr. Rakesh Verma" },
        { "time": "11:15-12:15", "subject": "Cost Accounting Lab", "subject_code": "BSA308L", "faculty": "Mr. Rajesh Iyer", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Business Communication", "subject_code": "BSA309", "faculty": "Ms. Ananya Das" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Cost Accounting", "subject_code": "BSA302", "faculty": "Dr. Rajiv Mehta" },
        { "time": "10:00-11:00", "subject": "Taxation", "subject_code": "BSA305", "faculty": "Dr. Sunil Kumar" },
        { "time": "11:15-12:15", "subject": "Financial Accounting Lab", "subject_code": "BSA310L", "faculty": "Dr. Anjali Sharma", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Financial Accounting", "subject_code": "BSA301", "faculty": "Dr. Anjali Sharma" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Business Law", "subject_code": "BSA304", "faculty": "Mr. Amit Khanna" },
        { "time": "10:00-11:00", "subject": "Auditing", "subject_code": "BSA306", "faculty": "Dr. Neha Gupta" },
        { "time": "11:15-12:15", "subject": "Cost Accounting Lab", "subject_code": "BSA308L", "faculty": "Mr. Rajesh Iyer", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Financial Management", "subject_code": "BSA307", "faculty": "Dr. Rakesh Verma" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Business Communication", "subject_code": "BSA309", "faculty": "Ms. Ananya Das" },
        { "time": "10:00-11:00", "subject": "Taxation", "subject_code": "BSA305", "faculty": "Dr. Sunil Kumar" },
        { "time": "11:15-12:15", "subject": "Accounting Lab", "subject_code": "BSA303L", "faculty": "Ms. Priya Nair", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Auditing", "subject_code": "BSA306", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ]
    }
  },
  // B.Tech IT Section A
  {
    "class_name": "B.Tech (IT) III A",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Data Structures", "subject_code": "IT301", "faculty": "Dr. Ramesh Kumar" },
        { "time": "10:00-11:00", "subject": "Database Systems", "subject_code": "IT302", "faculty": "Dr. Sunita Sharma" },
        { "time": "11:15-12:15", "subject": "Web Technologies Lab", "subject_code": "IT303L", "faculty": "Mr. Amit Patel", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Operating Systems", "subject_code": "IT304", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Computer Networks", "subject_code": "IT305", "faculty": "Dr. Sanjay Verma" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Software Engineering", "subject_code": "IT306", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "IT307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "IT308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Python Programming", "subject_code": "IT309", "faculty": "Dr. Meena Iyer" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Data Structures", "subject_code": "IT301", "faculty": "Dr. Ramesh Kumar" },
        { "time": "10:00-11:00", "subject": "Computer Organization", "subject_code": "IT310", "faculty": "Dr. Arjun Nair" },
        { "time": "11:15-12:15", "subject": "Web Technologies Lab", "subject_code": "IT303L", "faculty": "Mr. Amit Patel", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Operating Systems", "subject_code": "IT304", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Database Systems", "subject_code": "IT302", "faculty": "Dr. Sunita Sharma" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "IT307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "Python Programming Lab", "subject_code": "IT311L", "faculty": "Dr. Meena Iyer", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" },
        { "time": "15:15-16:10", "subject": "Computer Networks", "subject_code": "IT305", "faculty": "Dr. Sanjay Verma" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Software Engineering", "subject_code": "IT306", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Computer Organization", "subject_code": "IT310", "faculty": "Dr. Arjun Nair" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "IT308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Python Programming", "subject_code": "IT309", "faculty": "Dr. Meena Iyer" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ]
    }
  },
  // B.Tech IT Section B
  {
    "class_name": "B.Tech (IT) III B",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Web Technologies", "subject_code": "IT307", "faculty": "Ms. Ritu Singh" },
        { "time": "10:00-11:00", "subject": "Data Structures", "subject_code": "IT301", "faculty": "Dr. Ramesh Kumar" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "IT308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Database Systems", "subject_code": "IT302", "faculty": "Dr. Sunita Sharma" },
        { "time": "15:15-16:10", "subject": "Computer Organization", "subject_code": "IT310", "faculty": "Dr. Arjun Nair" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Python Programming", "subject_code": "IT309", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Computer Networks", "subject_code": "IT305", "faculty": "Dr. Sanjay Verma" },
        { "time": "11:15-12:15", "subject": "Web Technologies Lab", "subject_code": "IT303L", "faculty": "Mr. Amit Patel", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Software Engineering", "subject_code": "IT306", "faculty": "Dr. Anil Kapoor" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Computer Organization", "subject_code": "IT310", "faculty": "Dr. Arjun Nair" },
        { "time": "10:00-11:00", "subject": "Web Technologies", "subject_code": "IT307", "faculty": "Ms. Ritu Singh" },
        { "time": "11:15-12:15", "subject": "Python Programming Lab", "subject_code": "IT311L", "faculty": "Dr. Meena Iyer", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Data Structures", "subject_code": "IT301", "faculty": "Dr. Ramesh Kumar" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Computer Networks", "subject_code": "IT305", "faculty": "Dr. Sanjay Verma" },
        { "time": "10:00-11:00", "subject": "Software Engineering", "subject_code": "IT306", "faculty": "Dr. Anil Kapoor" },
        { "time": "11:15-12:15", "subject": "DBMS Lab", "subject_code": "IT308L", "faculty": "Mr. Rajesh Kumar", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Database Systems", "subject_code": "IT302", "faculty": "Dr. Sunita Sharma" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Python Programming", "subject_code": "IT309", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Operating Systems", "subject_code": "IT304", "faculty": "Dr. Neha Gupta" },
        { "time": "11:15-12:15", "subject": "Web Technologies Lab", "subject_code": "IT303L", "faculty": "Mr. Amit Patel", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Computer Organization", "subject_code": "IT310", "faculty": "Dr. Arjun Nair" },
        { "time": "15:15-16:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" }
      ]
    }
  },
  // B.Tech CSE Section A
  {
    "class_name": "B.Tech (CSE) III A",
    "timetable": {
      "Monday": [
        {
          "time": "9:15-10:10",
          "subject": "AM-III (Applied Mathematics-III)",
          "subject_code": "MAT 301",
          "faculty": "RMK (Dr. Ram Kumar)"
        },
        {
          "time": "10:15-11:10",
          "subject": "DSC (Data Structures through C++)",
          "subject_code": "CSE 302, CSE 202",
          "faculty": "STA (Dr. Samta Jain Goyal)"
        },
        {
          "time": "11:15-12:10",
          "subject": "DELD LAB (Digital Electronics and Logic Design Lab)",
          "subject_code": "ECE 326",
          "faculty": "AKP (Dr. Akhilesh Panchal)",
          "group": "Group 1"
        },
        {
          "time": "11:15-12:10",
          "subject": "PP LAB (Python Programming Lab)",
          "subject_code": "CSE 322",
          "faculty": "NDT (Nidhi Tripathi)",
          "group": "Group 2"
        },
        {
          "time": "13:15-14:10",
          "subject": "LUNCH",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "14:15-15:10",
          "subject": "FL-III (French-III)",
          "subject_code": "FLU 344",
          "faculty": "NLT (Dr. Neelam Singh Tom)"
        },
        {
          "time": "15:15-16:10",
          "subject": "CSE SPEC. (CSE Specialization)",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "16:15-17:10",
          "subject": "LIBRARY/CCA",
          "subject_code": null,
          "faculty": null
        }
      ],
      "Tuesday": [
        {
          "time": "9:15-10:10",
          "subject": "CSE SPEC. (CSE Specialization)",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "10:15-11:10",
          "subject": "CS-III (Communication Skills-III)",
          "subject_code": "BSU 341",
          "faculty": "ASM (Dr. Aswathi Menon)"
        },
        {
          "time": "11:15-12:10",
          "subject": "DELD (Digital Electronics and Logic Design)",
          "subject_code": "ECE 306",
          "faculty": "AKP (Dr. Akhilesh Panchal)"
        },
        {
          "time": "11:15-12:10",
          "subject": "AM-III (Applied Mathematics-III)",
          "subject_code": "MAT 301",
          "faculty": "RMK (Dr. Ram Kumar)"
        },
        {
          "time": "13:15-14:10",
          "subject": "LUNCH",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "14:15-15:10",
          "subject": "DSC (Data Structures through C++)",
          "subject_code": "CSE 302, CSE 202",
          "faculty": "STA (Dr. Samta Jain Goyal)"
        },
        {
          "time": "15:15-16:10",
          "subject": "PP (Python Programming)",
          "subject_code": "CSE302",
          "faculty": "ASK (Dr. Ashok Kr Shrivasti)"
        },
        {
          "time": "16:15-17:10",
          "subject": "LIBRARY/CCA",
          "subject_code": null,
          "faculty": null
        }
      ],
      "Wednesday": [
        {
          "time": "9:15-10:10",
          "subject": "DELD (Digital Electronics and Logic Design)",
          "subject_code": "ECE 306",
          "faculty": "AKP (Dr. Akhilesh Panchal)"
        },
        {
          "time": "10:15-11:10",
          "subject": "DBMS (Database Management Systems)",
          "subject_code": "CSE 304",
          "faculty": "VKC (Dr. Vikrant Chole)"
        },
        {
          "time": "11:15-12:10",
          "subject": "DBMS LAB (Database Management Systems Lab)",
          "subject_code": "CSE 324",
          "faculty": "JTS (Jeetendra Singh Bhad)",
          "group": "Group 1"
        },
        {
          "time": "11:15-12:10",
          "subject": "DSC LAB (Data Structures through C++ Lab)",
          "subject_code": "CSE 322/CSE 222",
          "faculty": "KRO",
          "group": "Group 2"
        },
        {
          "time": "13:15-14:10",
          "subject": "LUNCH",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "14:15-15:10",
          "subject": "PP (Python Programming)",
          "subject_code": "CSE302",
          "faculty": "ASK (Dr. Ashok Kr Shrivasti)"
        },
        {
          "time": "15:15-16:10",
          "subject": "CSE SPEC. (CSE Specialization)",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "16:15-17:10",
          "subject": "DSC (Data Structures through C++)",
          "subject_code": "CSE 302/CSE 202",
          "faculty": "STA (Dr. Samta Jain Goyal)"
        }
      ],
      "Thursday": [
        {
          "time": "9:15-10:10",
          "subject": "CSE SPEC. (CSE Specialization)",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "10:15-11:10",
          "subject": "CSE SPEC. (CSE Specialization)",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "11:15-12:10",
          "subject": "DSC++ LAB (Data Structures through C++ Lab)",
          "subject_code": "CSE 222",
          "faculty": "K",
          "group": "Group 1"
        },
        {
          "time": "11:15-12:10",
          "subject": "DELD LAB (Digital Electronics and Logic Design Lab)",
          "subject_code": "ECE 326",
          "faculty": "AB",
          "group": "Group 2"
        },
        {
          "time": "13:15-14:10",
          "subject": "LUNCH",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "14:15-15:10",
          "subject": "DBMS (Database Management Systems)",
          "subject_code": "CSE 304",
          "faculty": "VKC (Dr. Vikrant Chole)"
        },
        {
          "time": "15:15-16:10",
          "subject": "PP (Python Programming)",
          "subject_code": "CSE302",
          "faculty": "ASK (Dr. Ashok Kr Shrivasti)"
        },
        {
          "time": "16:15-17:10",
          "subject": "DELD (Digital Electronics and Logic Design)",
          "subject_code": "ECE 306",
          "faculty": "AKP (Dr. Akhilesh Panchal)"
        }
      ],
      "Friday": [
        {
          "time": "9:15-10:10",
          "subject": "AM-III (Applied Mathematics-III)",
          "subject_code": "MAT 301",
          "faculty": "RMK (Dr. Ram Kumar)"
        },
        {
          "time": "10:15-11:10",
          "subject": "BS-III (Behavioural Science-III)",
          "subject_code": "BSU 343",
          "faculty": "PRC (Dr. Purnima Chauhan)"
        },
        {
          "time": "11:15-12:10",
          "subject": "PP LAB (Python Programming Lab)",
          "subject_code": "CSE 322",
          "faculty": "NO",
          "group": "Group 1"
        },
        {
          "time": "11:15-12:10",
          "subject": "DBMS LAB (Database Management Systems Lab)",
          "subject_code": "CSE 324",
          "faculty": "BMS",
          "group": "Group 2"
        },
        {
          "time": "13:15-14:10",
          "subject": "LUNCH",
          "subject_code": null,
          "faculty": null
        },
        {
          "time": "14:15-15:10",
          "subject": "CS-III (Communication Skills-III)",
          "subject_code": "BSU 341",
          "faculty": "ASM (Dr. Aswathi Menon)"
        },
        {
          "time": "15:15-16:10",
          "subject": "DBMS (Database Management Systems)",
          "subject_code": "CSE 304",
          "faculty": "VKC (Dr. Vikrant Chole)"
        },
        {
          "time": "16:15-17:10",
          "subject": "LIBRARY/CCA",
          "subject_code": null,
          "faculty": null
        }
      ]
    }
  },
  // Class B
  {
    "class_name": "B.Tech (CSE) III B",
    "timetable": {
      // ... (same structure as Class A with different timings if needed)
    }
  },
  // Class C
  {
    "class_name": "B.Tech (CSE) III C",
    "timetable": {
      // ... (same structure as Class A with different timings if needed)
    }
  },
  // Class D
  {
    "class_name": "B.Tech (CSE) III D",
    "timetable": {
      // ... (same structure as Class A with different timings if needed)
    }
  },
  // Class E
  {
    "class_name": "B.Tech (CSE) III E",
    "timetable": {
      // ... (same structure as Class A with different timings if needed)
    }
  },
  // B.Sc Section A
  {
    "class_name": "B.Sc III A",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Mathematics III", "subject_code": "MATH301", "faculty": "Dr. Sunil Kumar" },
        { "time": "10:00-11:00", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "11:15-12:15", "subject": "Chemistry Lab", "subject_code": "CHEM301L", "faculty": "Dr. Priya Sharma", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Electronics", "subject_code": "ELEC301", "faculty": "Dr. Rajesh Verma" },
        { "time": "15:15-16:10", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Mathematics III", "subject_code": "MATH301", "faculty": "Dr. Sunil Kumar" },
        { "time": "11:15-12:15", "subject": "Physics Lab", "subject_code": "PHY301L", "faculty": "Dr. Anil Kapoor", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Environmental Science", "subject_code": "ENV301", "faculty": "Dr. Neha Gupta" },
        { "time": "15:15-16:10", "subject": "Computer Science Lab", "subject_code": "CS301L", "faculty": "Dr. Meena Iyer", "group": "Group 1" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Chemistry", "subject_code": "CHEM301", "faculty": "Dr. Priya Sharma" },
        { "time": "10:00-11:00", "subject": "Mathematics III", "subject_code": "MATH301", "faculty": "Dr. Sunil Kumar" },
        { "time": "11:15-12:15", "subject": "Electronics Lab", "subject_code": "ELEC301L", "faculty": "Dr. Rajesh Verma", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Chemistry", "subject_code": "CHEM301", "faculty": "Dr. Priya Sharma" },
        { "time": "11:15-12:15", "subject": "Mathematics Lab", "subject_code": "MATH301L", "faculty": "Dr. Sunil Kumar", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Electronics", "subject_code": "ELEC301", "faculty": "Dr. Rajesh Verma" },
        { "time": "15:15-16:10", "subject": "Environmental Science Lab", "subject_code": "ENV301L", "faculty": "Dr. Neha Gupta", "group": "Group 1" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Environmental Science", "subject_code": "ENV301", "faculty": "Dr. Neha Gupta" },
        { "time": "10:00-11:00", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" },
        { "time": "11:15-12:15", "subject": "Chemistry Lab", "subject_code": "CHEM301L", "faculty": "Dr. Priya Sharma", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" },
        { "time": "15:15-16:10", "subject": "Tutorial", "subject_code": "TUT301", "faculty": "Class Teacher" }
      ]
    }
  },
  // B.Sc Section B
  {
    "class_name": "B.Sc III B",
    "timetable": {
      "Monday": [
        { "time": "09:00-10:00", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "10:00-11:00", "subject": "Mathematics III", "subject_code": "MATH301", "faculty": "Dr. Sunil Kumar" },
        { "time": "11:15-12:15", "subject": "Chemistry Lab", "subject_code": "CHEM301L", "faculty": "Dr. Priya Sharma", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" },
        { "time": "15:15-16:10", "subject": "Electronics", "subject_code": "ELEC301", "faculty": "Dr. Rajesh Verma" }
      ],
      "Tuesday": [
        { "time": "09:00-10:00", "subject": "Mathematics III", "subject_code": "MATH301", "faculty": "Dr. Sunil Kumar" },
        { "time": "10:00-11:00", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "11:15-12:15", "subject": "Physics Lab", "subject_code": "PHY301L", "faculty": "Dr. Anil Kapoor", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Computer Science Lab", "subject_code": "CS301L", "faculty": "Dr. Meena Iyer", "group": "Group 2" },
        { "time": "15:15-16:10", "subject": "Environmental Science", "subject_code": "ENV301", "faculty": "Dr. Neha Gupta" }
      ],
      "Wednesday": [
        { "time": "09:00-10:00", "subject": "Chemistry", "subject_code": "CHEM301", "faculty": "Dr. Priya Sharma" },
        { "time": "10:00-11:00", "subject": "Electronics", "subject_code": "ELEC301", "faculty": "Dr. Rajesh Verma" },
        { "time": "11:15-12:15", "subject": "Electronics Lab", "subject_code": "ELEC301L", "faculty": "Dr. Rajesh Verma", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Physics III", "subject_code": "PHY301", "faculty": "Dr. Anil Kapoor" },
        { "time": "15:15-16:10", "subject": "Library", "subject_code": "LIB101", "faculty": "" }
      ],
      "Thursday": [
        { "time": "09:00-10:00", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" },
        { "time": "10:00-11:00", "subject": "Chemistry", "subject_code": "CHEM301", "faculty": "Dr. Priya Sharma" },
        { "time": "11:15-12:15", "subject": "Mathematics Lab", "subject_code": "MATH301L", "faculty": "Dr. Sunil Kumar", "group": "Group 2" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Environmental Science Lab", "subject_code": "ENV301L", "faculty": "Dr. Neha Gupta", "group": "Group 2" },
        { "time": "15:15-16:10", "subject": "Electronics", "subject_code": "ELEC301", "faculty": "Dr. Rajesh Verma" }
      ],
      "Friday": [
        { "time": "09:00-10:00", "subject": "Environmental Science", "subject_code": "ENV301", "faculty": "Dr. Neha Gupta" },
        { "time": "10:00-11:00", "subject": "Computer Science", "subject_code": "CS301", "faculty": "Dr. Meena Iyer" },
        { "time": "11:15-12:15", "subject": "Chemistry Lab", "subject_code": "CHEM301L", "faculty": "Dr. Priya Sharma", "group": "Group 1" },
        { "time": "13:15-14:10", "subject": "Lunch", "subject_code": "LUNCH", "faculty": "" },
        { "time": "14:15-15:10", "subject": "Minor Elective", "subject_code": "MIN201", "faculty": "Dr. Dept" },
        { "time": "15:15-16:10", "subject": "Tutorial", "subject_code": "TUT301", "faculty": "Class Teacher" }
      ]
    }
  }
];

// Create output directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const outputDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert the timetable data
const converted = convertTimetable(newTimetableData);

// Save to the public directory
const outputPath = path.join(outputDir, 'timetable_updated.json');
fs.writeFileSync(outputPath, JSON.stringify(converted, null, 2));

console.log(`Timetable data has been converted and saved to ${outputPath}`);
