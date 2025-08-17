interface NewTimetableEntry {
  time: string;
  subject: string;
  subject_code: string | null;
  faculty: string | null;
  group?: string;
}

interface NewTimetableDay {
  [key: string]: NewTimetableEntry[];
}

interface NewTimetableData {
  class_name: string;
  timetable: NewTimetableDay;
}

interface ConvertedTimetable {
  Programs: {
    [program: string]: {
      Semester: string;
      Sections: {
        [section: string]: {
          Courses: {
            subject_code: string;
            subject_name: string;
            faculty: string;
            faculty_code: string;
            day: string;
            time: string;
          }[];
          Labs: {
            subject_code: string;
            subject_name: string;
            faculty: string;
            faculty_code: string;
            day: string;
            time: string;
            group: string;
          }[];
        };
      };
    };
  };
}

export function convertTimetable(newData: NewTimetableData[]): ConvertedTimetable {
  const result: ConvertedTimetable = {
    Programs: {
      "B.Tech CSE": {
        Semester: "3",
        Sections: {}
      }
    }
  };

  for (const classData of newData) {
    // Extract section from class name (e.g., "III A" -> "D")
    const sectionMatch = classData.class_name.match(/([A-Z])\)?$/);
    if (!sectionMatch) continue;
    
    const section = sectionMatch[1];
    result.Programs["B.Tech CSE"].Sections[section] = {
      Courses: [],
      Labs: []
    };

    for (const [day, entries] of Object.entries(classData.timetable)) {
      for (const entry of entries) {
        if (!entry.subject || !entry.time) continue;
        
        const time = entry.time.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => 
          `${h.padStart(2, '0')}:${m}`
        );
        
        const subjectCode = entry.subject_code || 
          entry.subject.match(/^[A-Z0-9\s\/]+/)?.[0]?.trim() || 
          'GEN';
        
        const faculty = entry.faculty || 'TBD';
        const facultyCode = faculty.match(/\(([^)]+)\)/)?.[1] || 
          faculty.split(' ').map(w => w[0]).join('').toUpperCase();
        
        const baseEntry = {
          subject_code: subjectCode,
          subject_name: entry.subject,
          faculty: faculty.replace(/\([^)]+\)/g, '').trim(),
          faculty_code: facultyCode,
          day,
          time
        };

        if (entry.group || entry.subject.toLowerCase().includes('lab')) {
          result.Programs["B.Tech CSE"].Sections[section].Labs.push({
            ...baseEntry,
            group: entry.group || '1'
          });
        } else {
          result.Programs["B.Tech CSE"].Sections[section].Courses.push(baseEntry);
        }
      }
    }
  }

  return result;
}

// Example usage:
// const newTimetableData = [...]; // Your new timetable data
// const converted = convertTimetable(newTimetableData);
// console.log(JSON.stringify(converted, null, 2));
