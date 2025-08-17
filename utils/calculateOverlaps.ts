import { Student, MissedLecture, StudentWithMissedLectures, TimeSlot, Timetable, Program, Section, Course, Lab } from '@/types/od';

/**
 * Loads timetable data from the JSON file
 * @returns Promise<Timetable> - Timetable data
 */
export async function loadTimetable(): Promise<Timetable> {
  try {
    // Prioritize the updated timetable file, fall back to custom if not found
    const filenames = ['timetable_updated.json', 'timetable_custom.json'];
    const loaded: Timetable[] = [];

    // In Next.js, we'll always fetch from the public directory in the browser
    for (const name of filenames) {
      try {
        const resp = await fetch(`/data/${name}`);
        if (resp && resp.ok) {
          const json = await resp.json();
          const tt = convertUnknownTimetable(json) || (json as Timetable);
          if (tt && tt.Programs) {
            loaded.push(tt);
            console.log(`[Timetable] Loaded ${name}`);
          }
        }
      } catch (error) {
        console.warn(`[Timetable] Failed to load ${name}:`, error);
      }
    }

    if (!loaded.length) throw new Error('No timetable sources could be loaded');

    const merged = mergeTimetables(loaded);
    console.log(`[Timetable] Merged ${loaded.length} source(s)`);
    return merged;
  } catch (error) {
    console.error('Error loading timetable:', error);
    return { Programs: {} };
  }
}

/**
 * Calculates missed lectures for students based on event time and timetable
 * @param students - Array of students
 * @param eventTime - Event time string (e.g., "09:15–10:10_10:15–11:10")
 * @param eventDay - Day of the week (e.g., "Monday", "Tuesday")
 * @param timetable - Timetable data
 * @returns Array of students with their missed lectures
 */
export function calculateMissedLectures(
  students: Student[],
  eventTime: string,
  eventDay: string,
  timetable: Timetable
): StudentWithMissedLectures[] {
  console.log('🕐 Starting missed lecture calculation...');
  console.log(`📅 Event time: ${eventTime}, Day: ${eventDay} (normalized: ${normalizeDayName(eventDay)})`);
  console.log(`👥 Processing ${students.length} students`);

  // Parse event time slots
  const eventSlots = parseEventTimeSlots(eventTime);
  console.log('⏰ Event time slots:', eventSlots);

  const studentsWithMissedLectures: StudentWithMissedLectures[] = [];

  students.forEach((student, index) => {
    console.log(`\n🔍 Processing student ${index + 1}/${students.length}: ${student.name}`);
    console.log(`📚 Looking for: ${student.normalizedProgram} - Semester ${student.semester} - ${student.section}`);

    const missedLectures = findMissedLecturesForStudent(
      student,
      eventSlots,
      eventDay,
      timetable
    );

    const studentWithMissed: StudentWithMissedLectures = {
      ...student,
      missedLectures
    };

    studentsWithMissedLectures.push(studentWithMissed);

    if (missedLectures.length > 0) {
      console.log(`❌ Found ${missedLectures.length} missed lectures for ${student.name}`);
      missedLectures.forEach(lecture => {
        console.log(`   - ${lecture.subject_name} (${lecture.faculty}) at ${lecture.time}`);
      });
    } else {
      console.log(`✅ No missed lectures for ${student.name}`);
    }
  });

  const totalMissedLectures = studentsWithMissedLectures.reduce(
    (sum, student) => sum + student.missedLectures.length, 0
  );
  
  console.log(`\n📊 Summary: ${totalMissedLectures} total missed lectures across ${students.length} students`);
  return studentsWithMissedLectures;
}

/**
 * Parses event time string into time slots
 * @param eventTime - Event time string (e.g., "09:15–10:10_10:15–11:10")
 * @returns Array of TimeSlot objects
 */
export function parseEventTimeSlots(eventTime: string): TimeSlot[] {
  if (!eventTime) return [];

  // Normalize separators
  const text = String(eventTime).replace(/[–]/g, '-');
  // Treat underscores as explicit separators between time blocks
  const blocks = text.split(/_/g).map(s => s.trim()).filter(Boolean);
  // Regex to capture ranges like "9:15-10:10" with optional AM/PM
  const re = /(\d{1,2}:\d{2}\s*(?:am|pm)?)[\s-]+(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi;
  const out: TimeSlot[] = [];
  for (const block of blocks.length ? blocks : [text]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) {
      const start = m[1].trim();
      const end = m[2].trim();
      if (start && end) out.push({ start, end });
    }
  }
  return out;
}

/**
 * Merges multiple `Timetable` objects into one. Later sources can add new programs/sections
 * and append courses/labs to existing sections. Duplicates are naively deduped by a simple key.
 */
function mergeTimetables(sources: Timetable[]): Timetable {
  const merged: Timetable = { Programs: {} };

  const pushUnique = <T extends { subject_code?: string; subject_name?: string; day?: string; time?: string }>(
    arr: T[], item: T
  ) => {
    const key = `${(item.subject_code || '').toLowerCase()}|${(item.subject_name || '').toLowerCase()}|${(item.day || '').toLowerCase()}|${(item.time || '').toLowerCase()}`;
    const exists = arr.some(it => (
      `${(it.subject_code || '').toLowerCase()}|${(it.subject_name || '').toLowerCase()}|${(it.day || '').toLowerCase()}|${(it.time || '').toLowerCase()}` === key
    ));
    if (!exists) arr.push(item);
  };

  for (const src of sources) {
    for (const [progName, prog] of Object.entries(src.Programs || {})) {
      if (!merged.Programs[progName]) {
        merged.Programs[progName] = { Sections: {}, Semester: (prog as Program).Semester } as Program;
      }
      const mProg = merged.Programs[progName];
      for (const [secName, sec] of Object.entries(prog.Sections || {})) {
        if (!mProg.Sections[secName]) {
          mProg.Sections[secName] = { Courses: [], Labs: [] };
        }
        const mSec = mProg.Sections[secName];
        (sec.Courses || []).forEach(c => pushUnique(mSec.Courses as any, c as any));
        (sec.Labs || []).forEach(l => pushUnique(mSec.Labs as any, l as any));
      }
    }
  }

  return merged;
}

/**
 * Finds missed lectures for a specific student
 * @param student - Student data
 * @param eventSlots - Event time slots
 * @param eventDay - Event day
 * @param timetable - Timetable data
 * @returns Array of missed lectures
 */
function findMissedLecturesForStudent(
  student: Student,
  eventSlots: TimeSlot[],
  eventDay: string,
  timetable: Timetable
): MissedLecture[] {
  const missedLectures: MissedLecture[] = [];

  // Find the student's program in timetable
  const programKey = findProgramKey(student.normalizedProgram, timetable);
  if (!programKey) {
    console.log(`⚠️  Program not found: ${student.normalizedProgram}`);
    return missedLectures;
  }

  const program = timetable.Programs[programKey];
  if (!program) return missedLectures;

  // Find the student's section (support variants like "A" vs "Section A")
  const section = findSection(program.Sections, student.section);
  if (!section) {
    console.log(`⚠️  Section not found: ${student.section} for ${programKey}`);
    return missedLectures;
  }

  // Check courses and labs for the event day
  const dayKey = normalizeDayName(eventDay);
  const dayCourses = section.Courses.filter((course: Course) => normalizeDayName(course.day) === dayKey);
  const dayLabs = section.Labs.filter((lab: Lab) => normalizeDayName(lab.day) === dayKey);

  console.log(`📚 Found ${dayCourses.length} courses and ${dayLabs.length} labs for ${eventDay}`);

  // For each event time slot, choose at most one best-matching lecture/lab
  eventSlots.forEach(eventSlot => {
    console.log(`⏰ Checking event slot: ${eventSlot.start} - ${eventSlot.end}`);

    // Overlapping candidates
    const overlappingCourses = dayCourses.filter((course: Course) => isTimeOverlapping(eventSlot, course.time));
    const overlappingLabsAll = dayLabs.filter((lab: Lab) => isTimeOverlapping(eventSlot, lab.time));

    // Evaluate group match quality for labs
    const studentTokens = normalizeGroupTokens(student.group || '');
    const scoredLabs = overlappingLabsAll.map((lab) => {
      const labTokens = normalizeGroupTokens(lab.group || '');
      let score = 0;
      if (labTokens.length === 0) score = 70; // applies to all
      else if (labTokens.includes('all') || labTokens.includes('both')) score = 75;
      else if (studentTokens.length && studentTokens.some(t => labTokens.includes(t))) score = 100; // exact group hit
      else score = 0;
      return { lab, score };
    }).filter(s => s.score > 0);

    // Score courses: prefer Minor > regular > Library/Lunch
    const scoredCourses = overlappingCourses.map((course) => {
      const name = String(course.subject_name || '');
      const isMinor = /\bminor\b/i.test(name);
      const isLibLunch = /\b(library|lunch)\b/i.test(name);
      let score = 80; // base for regular course
      if (isMinor) score = 90;
      if (isLibLunch) score = 20;
      return { course, score };
    });

    // Pick the single best candidate by score, prefer lab ties over course
    const bestLab = scoredLabs.sort((a, b) => b.score - a.score)[0];
    const bestCourse = scoredCourses.sort((a, b) => b.score - a.score)[0];

    let chosen: MissedLecture | null = null;
    let chosenType: 'lab' | 'course' | null = null;

    if (bestLab && (!bestCourse || bestLab.score >= bestCourse.score)) {
      const lab = bestLab.lab;
      chosen = {
        subject_code: lab.subject_code || '',
        subject_name: lab.subject_name || '',
        faculty: lab.faculty || '',
        faculty_code: lab.faculty_code || '',
        time: lab.time || '',
        group: lab.group || '',
        day: eventDay
      };
      chosenType = 'lab';
    } else if (bestCourse) {
      const course = bestCourse.course;
      chosen = {
        subject_code: course.subject_code || '',
        subject_name: course.subject_name || '',
        faculty: course.faculty || '',
        faculty_code: course.faculty_code || '',
        time: course.time || '',
        group: '',
        day: eventDay
      };
      chosenType = 'course';
    }

    if (chosen) {
      missedLectures.push(chosen);
      console.log(`❌ Selected ${chosenType} for slot ${eventSlot.start}-${eventSlot.end}: ${chosen.subject_name} at ${chosen.time}`);
    } else {
      console.log(`ℹ️  No timetable entry selected for slot ${eventSlot.start}-${eventSlot.end}`);
    }
  });

  return missedLectures;
}

/**
 * Finds the correct program key in timetable
 * @param normalizedProgram - Normalized program name
 * @param timetable - Timetable data
 * @returns Program key or null
 */
function findProgramKey(normalizedProgram: string, timetable: Timetable): string | null {
  const programKeys = Object.keys(timetable.Programs);
  
  // Exact match first
  const exactMatch = programKeys.find(key => 
    key.toLowerCase() === normalizedProgram.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Fuzzy match with common variations
  const fuzzyMatch = programKeys.find(key => {
    const keyLower = key.toLowerCase();
    const programLower = normalizedProgram.toLowerCase();
    
    // Handle common variations
    const variations = [
      keyLower,
      keyLower.replace(/\s+/g, ''),
      keyLower.replace(/[()]/g, ''),
      keyLower.replace(/\s*\([^)]*\)\s*/g, ''),
      keyLower.replace(/b\.?tech/i, 'btech'),
      keyLower.replace(/btech/i, 'b.tech'),
      keyLower.replace(/cse/i, 'computer science'),
      keyLower.replace(/it/i, 'information technology'),
      keyLower.replace(/bca/i, 'bachelor of computer applications')
    ];
    
    return variations.some(variant => 
      variant.includes(programLower) || programLower.includes(variant)
    );
  });

  return fuzzyMatch || null;
}

/**
 * Resolves a section object given possibly normalized/variant section labels
 * Accepts: "A", "a", "Section A", "SEC A", etc.
 */
function findSection(
  sections: Record<string, Section>,
  rawSection: string
): Section | null {
  if (!rawSection) return null;
  const keys = Object.keys(sections);
  // Prepare candidate tokens to try
  const s = String(rawSection).trim();
  const upper = s.toUpperCase();
  // Prefer a trailing single-letter token like '... SECTION A' -> 'A'
  let letter = '';
  const endToken = upper.match(/\b([A-Z])\b$/);
  if (endToken) {
    letter = endToken[1];
  } else {
    // Fallback: find any standalone single-letter token
    const standalone = upper.match(/\b([A-Z])\b/);
    letter = standalone ? standalone[1] : upper;
  }
  const candidates = new Set<string>([
    s,
    upper,
    letter,
    `SECTION ${letter}`,
    `SEC ${letter}`,
  ]);

  // direct and case-insensitive matches
  for (const key of keys) {
    if (candidates.has(key) || candidates.has(key.toUpperCase())) {
      return sections[key];
    }
  }

  // Fallback: find key containing the letter token
  const ci = keys.find(k => k.toUpperCase().includes(letter));
  return ci ? sections[ci] : null;
}

/**
 * Checks if two time slots overlap
 * @param eventSlot - Event time slot
 * @param lectureTime - Lecture time string
 * @returns boolean indicating overlap
 */
function isTimeOverlapping(eventSlot: TimeSlot, lectureTime: string): boolean {
  if (!lectureTime) return false;
  const ranges = parseLectureTimeRanges(lectureTime);
  if (!ranges.length) return false;

  const eventStartMinutes = timeToMinutes(eventSlot.start);
  const eventEndMinutes = timeToMinutes(eventSlot.end);

  return ranges.some(({ start, end }) => {
    const lectureStartMinutes = timeToMinutes(start);
    const lectureEndMinutes = timeToMinutes(end);
    return eventStartMinutes < lectureEndMinutes && eventEndMinutes > lectureStartMinutes;
  });
}

/**
 * Parses timetable lecture time strings which can contain multiple ranges
 * Example: "09:15-10:10, 10:15–11:10" or "09:15-10:10_10:15-11:10"
 */
function parseLectureTimeRanges(lectureTime: string): TimeSlot[] {
  if (!lectureTime) return [];
  const text = String(lectureTime).replace(/[–]/g, '-');
  const blocks = text.split(/[_;,]+/g).map(s => s.trim()).filter(Boolean);
  const re = /(\d{1,2}:\d{2}\s*(?:am|pm)?)[\s-]+(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi;
  const out: TimeSlot[] = [];
  for (const block of blocks.length ? blocks : [text]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) {
      const start = m[1].trim();
      const end = m[2].trim();
      if (start && end) out.push({ start, end });
    }
  }
  return out;
}

/**
 * Converts time string to minutes
 * @param time - Time string (e.g., "09:15")
 * @returns Minutes since midnight
 */
function timeToMinutes(time: string): number {
  // Supports formats: "09:15", "9:15 am", "10:10 PM"
  const s = String(time).trim();
  const ampmMatch = s.match(/\s*(am|pm)$/i);
  const hasAmPm = Boolean(ampmMatch);
  const ampm = ampmMatch ? ampmMatch[1].toLowerCase() : '';
  const timePart = s.replace(/\s*(am|pm)$/i, '').trim();
  const [hStr, mStr = '0'] = timePart.split(':');
  let hours = Number(hStr);
  const minutes = Number(mStr);

  if (hasAmPm) {
    if (ampm === 'am') {
      if (hours === 12) hours = 0;
    } else if (ampm === 'pm') {
      if (hours !== 12) hours += 12;
    }
  }

  return hours * 60 + minutes;
}

/**
 * Determines if a subject should be excluded from OD (Library/Lunch only)
 */
function isExcludedSubject(subject?: string): boolean {
  if (!subject) return false;
  return /\b(library|lunch)\b/i.test(subject);
}

/**
 * Normalizes group labels like "Group 1", "G1", "Grp-1", "1" to a canonical token
 */
function normalizeGroupLabel(label: string): string {
  if (!label) return '';
  const s = String(label).trim().toLowerCase();
  // Extract alphanumeric tokens
  // Prefer trailing number if available
  const numMatch = s.match(/(\d+)/);
  if (numMatch) return numMatch[1];
  // Map common alphabetic groups (A/B) if used
  const alphaMatch = s.match(/\b([a-z])\b/);
  return alphaMatch ? alphaMatch[1] : '';
}

/**
 * Normalizes possibly multi-valued group labels into token arrays.
 * Examples:
 *  - "G1" -> ["1"]
 *  - "1 & 2" -> ["1","2"]
 *  - "A/B" -> ["a","b"]
 *  - "Both", "All" -> ["both"] or ["all"]
 */
function normalizeGroupTokens(label: string): string[] {
  if (!label) return [];
  const s = String(label).trim().toLowerCase();
  if (/\b(all|both)\b/.test(s)) return [s.includes('all') ? 'all' : 'both'];
  // Split by common delimiters
  const rawParts = s.split(/[,&/|+\-\s]+/).filter(Boolean);
  const tokens: string[] = [];
  rawParts.forEach((p) => {
    // Prefer trailing number if available
    const num = p.match(/(\d+)/);
    if (num) {
      tokens.push(num[1]);
      return;
    }
    const alpha = p.match(/^([a-z])$/);
    if (alpha) {
      tokens.push(alpha[1]);
      return;
    }
    // Map aliases like g1, grp1
    const aliasNum = p.match(/g(?:rp)?\s*(\d+)/);
    if (aliasNum) {
      tokens.push(aliasNum[1]);
    }
  });
  // Deduplicate
  return Array.from(new Set(tokens));
}

/**
 * Normalizes day strings like "Mon", "MONDAY", "mon" to canonical lowercase keys
 */
function normalizeDayName(day?: string): string {
  if (!day) return '';
  const s = String(day).trim().toLowerCase();
  const map: Record<string, string> = {
    mon: 'monday', monday: 'monday',
    tue: 'tuesday', tues: 'tuesday', tuesday: 'tuesday',
    wed: 'wednesday', weds: 'wednesday', wednesday: 'wednesday',
    thu: 'thursday', thur: 'thursday', thurs: 'thursday', thursday: 'thursday',
    fri: 'friday', friday: 'friday',
    sat: 'saturday', saturday: 'saturday',
    sun: 'sunday', sunday: 'sunday',
  };
  // Try direct
  if (map[s]) return map[s];
  // Try first three letters
  const abbr = s.slice(0, 3);
  if (map[abbr]) return map[abbr];
  return s;
}

/**
 * Attempts to convert a user-provided raw timetable JSON into our Timetable schema.
 * Supported loose shapes:
 *  - Array of entries with fields like: { class_name, day, time, subject, subject_code, faculty, type, group }
 *  - Object with { classes: [...same as above] }
 *  - Already-in-schema objects are returned as-is.
 */
function convertUnknownTimetable(input: any): Timetable | null {
  // If already in schema
  if (input && input.Programs) return input as Timetable;

  // Shape 1: array of { class_name, timetable: { DayName: [ { time, subject, subject_code, faculty, group? } ] } }
  if (Array.isArray(input) && input.length && input[0] && typeof input[0].timetable === 'object') {
    const out: Timetable = { Programs: {} };
    const ensureProgram = (progName: string) => {
      if (!out.Programs[progName]) out.Programs[progName] = { Sections: {} } as Program;
      return out.Programs[progName];
    };
    const ensureSection = (prog: Program, secName: string) => {
      if (!prog.Sections[secName]) prog.Sections[secName] = { Courses: [], Labs: [] } as Section;
      return prog.Sections[secName];
    };
    const cleanFaculty = (f?: string) => {
      if (!f) return '';
      const m = String(f).match(/\(([^)]+)\)/);
      return m ? m[1].trim() : String(f).trim();
    };
    const parseClass = (cls: string): { program: string; section: string; semester: string } => {
      const s = String(cls || '').trim();
      const semMap: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8' };
      const semMatch = s.match(/\b(I{1,3}|IV|V?I{0,3}|VIII)\b/ig);
      let semester = '';
      if (semMatch && semMatch.length) {
        const last = semMatch[semMatch.length - 1].toLowerCase();
        semester = semMap[last as keyof typeof semMap] || '';
      }
      const secMatch = s.match(/\b([A-Z])\b(?!.*\b[A-Z]\b)/);
      const section = secMatch ? secMatch[1] : '';
      let program = s
        .replace(/\bSection\b.*$/i, '')
        .replace(/\b(I{1,3}|IV|V?I{0,3}|VIII)\b/ig, '')
        .replace(/\b[A-Z]\b$/, '')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      program = program
        .replace(/B\.?\s*Tech\.?/i, 'B.Tech')
        .replace(/CSE/i, 'CSE')
        .replace(/IT/i, 'IT');
      if (/B\.Tech\s+IT/i.test(program)) program = 'B.Tech IT';
      if (/B\.Tech\s+CSE/i.test(program)) program = 'B.Tech CSE';
      return { program, section: section || 'A', semester: semester || '' };
    };

    for (const entry of input as any[]) {
      const { program, section } = parseClass(entry.class_name || '');
      if (!program) continue;
      const prog = ensureProgram(program);
      const sec = ensureSection(prog, section);
      const timetable = entry.timetable || {};
      for (const [day, slots] of Object.entries(timetable)) {
        const dayStr = String(day);
        (Array.isArray(slots) ? slots : []).forEach((slot: any) => {
          const subject_name = String(slot.subject || '').trim();
          const base = {
            subject_code: String(slot.subject_code || '').trim(),
            subject_name,
            faculty: cleanFaculty(slot.faculty),
            faculty_code: '',
            day: dayStr,
            time: String(slot.time || '').trim(),
          };
          const isLab = /\bLAB\b/i.test(subject_name);
          if (isLab) {
            (sec.Labs as Lab[]).push({ ...base, group: String(slot.group || '').trim() } as Lab);
          } else {
            (sec.Courses as Course[]).push(base as Course);
          }
        });
      }
    }
    return out;
  }

  // Shape 2: rows array (flat)
  const rows: any[] = Array.isArray(input)
    ? input
    : Array.isArray(input?.classes)
    ? input.classes
    : [];

  if (!rows.length) return null;

  const out: Timetable = { Programs: {} };

  // Heuristic parser for class label -> program/semester/section
  const parseClass = (cls: string): { program: string; section: string; semester: string } => {
    const s = String(cls || '').trim();
    // Examples: "B.Tech (CSE) III A", "B.Tech IT V B"
    const semMap: Record<string, string> = {
      i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8',
    };
    const semMatch = s.match(/\b(I{1,3}|IV|V?I{0,3}|VIII)\b/ig);
    let semester = '';
    if (semMatch && semMatch.length) {
      const last = semMatch[semMatch.length - 1].toLowerCase();
      semester = semMap[last as keyof typeof semMap] || '';
    }
    const secMatch = s.match(/\b([A-Z])\b(?!.*\b[A-Z]\b)/);
    const section = secMatch ? secMatch[1] : '';
    // Program extraction: remove semester and section tokens
    let program = s
      .replace(/\bSection\b.*$/i, '')
      .replace(/\b(I{1,3}|IV|V?I{0,3}|VIII)\b/ig, '')
      .replace(/\b[A-Z]\b$/, '')
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    program = program
      .replace(/B\.?\s*Tech\.?/i, 'B.Tech')
      .replace(/CSE/i, 'CSE')
      .replace(/IT/i, 'IT');
    if (/B\.Tech\s+IT/i.test(program)) program = 'B.Tech IT';
    if (/B\.Tech\s+CSE/i.test(program)) program = 'B.Tech CSE';
    return { program, section: section || 'A', semester: semester || '' };
  };

  type Row = {
    class_name?: string;
    program?: string;
    section?: string;
    semester?: string | number;
    day?: string;
    time?: string;
    subject?: string;
    subject_name?: string;
    subject_code?: string;
    faculty?: string;
    type?: string; // "Course" or "Lab"
    group?: string;
  };

  const ensureProgram = (progName: string) => {
    if (!out.Programs[progName]) out.Programs[progName] = { Sections: {} } as Program;
    return out.Programs[progName];
  };
  const ensureSection = (prog: Program, secName: string) => {
    if (!prog.Sections[secName]) prog.Sections[secName] = { Courses: [], Labs: [] } as Section;
    return prog.Sections[secName];
  };

  const cleanFaculty = (f?: string) => {
    if (!f) return '';
    const m = String(f).match(/\(([^)]+)\)/);
    return m ? m[1].trim() : String(f).trim();
  };

  rows.forEach((r: Row) => {
    const cls = r.class_name || `${r.program || ''} ${r.semester || ''} ${r.section || ''}`.trim();
    const { program, section } = parseClass(cls);
    if (!program) return;
    const prog = ensureProgram(program);
    const sec = ensureSection(prog, section);

    const subject_name = String(r.subject_name || r.subject || '').trim();
    if (!subject_name) return;
    const entry = {
      subject_code: String(r.subject_code || '').trim(),
      subject_name,
      faculty: cleanFaculty(r.faculty),
      day: r.day || '',
      time: r.time || '',
    };

    const isLab = /\bLAB\b/i.test(subject_name) || /lab/i.test(String(r.type || ''));
    if (isLab) {
      (sec.Labs as Lab[]).push({ ...entry, faculty_code: '', group: r.group || '' } as Lab);
    } else {
      (sec.Courses as Course[]).push(entry as Course);
    }
  });

  return out;
}
