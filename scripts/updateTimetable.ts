import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertTimetable } from '../utils/convertTimetable.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The new timetable data you provided
const newTimetableData = [
  {
    "class_name": "B.Tech (CSE) III E",
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
  }
  // Add other classes (A, B, C, D) in the same format
];

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../../public/data');
mkdirSync(outputDir, { recursive: true });

// Convert the timetable data
const converted = convertTimetable(newTimetableData);

// Save to the public directory
const outputPath = path.join(outputDir, 'timetable_updated.json');
writeFileSync(outputPath, JSON.stringify(converted, null, 2));

console.log(`Timetable data has been converted and saved to ${outputPath}`);
