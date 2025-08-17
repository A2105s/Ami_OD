import { EventMetadata, GroupedStudentData } from '@/types/od';
import { toTitleCase } from '@/utils/normalizeData';

interface MissedLecture {
  subject: string;
  faculty: string;
  faculty_code: string;
  time: string;
  students: string[];
}

interface EmailContent {
  subject: string;
  body: string;
  mailtoUrl: string;
}

export function generateEmail(
  metadata: EventMetadata,
  groupedData: GroupedStudentData[]
): EmailContent {
  // Generate subject
  const subject = `On Duty (OD) Approval for ${metadata.eventName || 'Event'} - ${formatDateForSubject(metadata.eventDate || '')}`;
  
  // Generate HTML body for preview
  const body = generateEmailBody(metadata, groupedData);
  
  // Generate plain text body for mailto URL
  const plainTextBody = generateEmailPlaintext(metadata, groupedData);
  
  // Generate mailto URL with plain text body
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;
  
  return { subject, body, mailtoUrl };
}

function generateEmailBody(metadata: EventMetadata, groupedData: GroupedStudentData[]): string {
  const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const exclude = (s: string) => /\b(library|lunch)\b/i.test(s || '');
  
  let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
      <p><b>Dear Faculty,</b></p>
      <p>I hope this email finds you well.</p>
      
      <p>Please grant <b>On Duty (OD) approval</b> for the following students, who participated in 
      <b>${esc(metadata.eventName || 'the event')}</b> organized on 
      <b>${esc(metadata.eventDate || '')}${metadata.day ? ` (${esc(metadata.day)})` : ''}</b> 
      at <b>${esc(metadata.eventVenue || metadata.place || 'the venue')}</b>.</p>
      
      <p><b>Coordinator:</b> ${esc(metadata.coordinator || '')}<br>
      <b>Event Time:</b> ${esc(metadata.eventTime || '')}</p>
  `;

  // Participants Section
  if (groupedData.length > 0) {
    html += '<p><b>Participants:</b></p>';
    groupedData.forEach(group => {
      if (!group.students?.length) return;
      const sample = group.students[0];
      const names = group.students.map(s => esc(toTitleCase(s.name))).join(', ');
      html += `
        <p>
          <b>${esc(sample.program || '')} - Section ${esc(sample.section || '')} 
          (Semester ${sample.semester || ''}):</b><br>
          ${names}
        </p>
      `;
    });
  }

  // Missed Lectures Section
  const hasMissedLectures = groupedData.some(g => 
    g.students?.some(s => s.missedLectures?.length > 0)
  );

  if (hasMissedLectures) {
    html += '<div style="margin-top: 30px;">';
    
    groupedData.forEach(group => {
      if (!group.students?.length) return;
      
      const sample = group.students[0];
      const lectures = group.students.flatMap(s => 
        (s.missedLectures || [])
          .filter(lec => !exclude(lec.subject_name || ''))
          .map(lec => ({
            ...lec,
            studentName: s.name
          }))
      );
      
      if (lectures.length === 0) return;
      
      // Group lectures by subject, faculty, and time
      const lectureMap = new Map<string, MissedLecture & { group?: string }>();
      
      lectures.forEach(lec => {
        const groupKey = lec.group || '';
        const key = `${lec.subject_name}|${lec.faculty}|${lec.time}|${groupKey}`;
        if (!lectureMap.has(key)) {
          lectureMap.set(key, {
            subject: lec.subject_name || 'Unknown Subject',
            faculty: lec.faculty || 'TBA',
            faculty_code: lec.faculty_code || '',
            time: lec.time || 'Timing not specified',
            group: groupKey || undefined,
            students: []
          });
        }
        lectureMap.get(key)?.students.push(toTitleCase(lec.studentName));
      });
      
      // Add section header
      html += `
        <p style="margin: 25px 0 10px 0; font-size: 1.1em;">
          <b>${esc(sample.program || '')} - Section ${esc(sample.section || '')} 
          (Semester ${sample.semester || ''})</b>
        </p>
        <p><b>Missed Lectures:</b></p>
      `;
      
      // Add each lecture
      lectureMap.forEach((lecture) => {
        html += `
          <div style="margin: 15px 0 20px 15px;">
            <p style="margin: 5px 0;">
              <b>Subject:</b> <span style="font-weight: bold;">${esc(lecture.subject)}</span><br>
              <b>Faculty:</b> ${esc(lecture.faculty)}<br>
              <b>Timing:</b> ${esc(lecture.time)}${lecture.group ? `<br><b>Group:</b> ${esc(lecture.group)}` : ''}
            </p>
            <ul style="margin: 5px 0 0 20px; padding: 0;">
              ${lecture.students
                .sort()
                .map(s => `<li>${esc(s)}</li>`)
                .join('')}
            </ul>
          </div>
        `;
      });
    });
    
    html += '</div>'; // Close missed lectures section
  }
  
  // Closing
  html += `
    <div style="margin-top: 30px;">
      <p>I kindly request OD approval for the mentioned students.</p>
      <p>Thank you for your consideration.</p>
      <p style="margin-top: 20px;">
        Best regards,<br>
        <span style="color: #1a365d; font-weight: 500;">${esc(metadata.coordinator || '')}</span><br>
        <span style="font-size: 0.9em; color: #4a5568;">
          Event Coordinator
        </span>
      </p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; 
                font-size: 0.8em; color: #718096;">
      <p>This is an auto-generated email. Please do not reply directly to this message.</p>
    </div>
  `;
  
  return html + '</div>'; // Close main container
}

/**
 * Generates mailto URL with encoded subject and body
 * @param subject - Email subject
 * @param body - Email body
 * @returns Mailto URL
 * Plaintext fallback version of the email body
 */
export function generateEmailPlaintext(metadata: EventMetadata, groupedData: GroupedStudentData[]): string {
  const coordinator = toTitleCase(metadata.coordinator || '')
  const venue = metadata.eventVenue || metadata.place || ''

  const lines: string[] = []
  const push = (s = '') => lines.push(s)
  const bullet = '•' // Using bullet point character

  // Email header
  push('Dear Faculty,')
  push('')
  push('I hope this email finds you well.')
  push('')
  push(`Please grant On Duty (OD) approval for the following students who participated in ${metadata.eventName || 'the event'} organized on ${metadata.eventDate || 'TBD'}${metadata.day ? ` (${metadata.day})` : ''} at ${venue}.`)
  push('')
  push(`Coordinator: ${coordinator}`)
  push(`Event Time: ${metadata.eventTime || 'N/A'}`)
  push('')
  push('-----------------------------')
  push('')

  // Process groups with missed lectures
  const sorted = sortGroups(groupedData)
  const groupsWithMissed = sorted.filter(g => g.students.some(s => (s.missedLectures || []).length > 0))
  
  groupsWithMissed.forEach((group) => {
    if (!group.students.length) return
    
    const s0 = group.students[0]
    push(`${s0.program.toUpperCase()} - ${s0.section.toUpperCase()} (Semester ${s0.semester})`)
    push('Missed Lectures:')
    push('')

    // Group lectures by subject, faculty, and time
    const bucket = new Map<string, { 
      subject: string; 
      faculty: string; 
      time: string; 
      group?: string; 
      students: string[] 
    }>()
    
    group.students.forEach((stu) => {
      (stu.missedLectures || []).forEach((lec) => {
        const subj = lec.subject_name || ''
        if (/\b(library|lunch)\b/i.test(subj)) return
        const groupKey = lec.group || ''
        const bucketKey = `${subj}|${lec.time || ''}|${lec.faculty || ''}|${groupKey}`
        if (!bucket.has(bucketKey)) {
          bucket.set(bucketKey, { 
            subject: subj, 
            faculty: lec.faculty || '', 
            time: lec.time || '', 
            group: groupKey || undefined, 
            students: [] 
          })
        }
        const entry = bucket.get(bucketKey)!
        const studentName = toTitleCase(stu.name)
        if (!entry.students.includes(studentName)) entry.students.push(studentName)
      })
    })

    // Sort lectures by time and subject
    Array.from(bucket.values())
      .sort((a, b) => (a.time || '').localeCompare(b.time || '') || (a.subject || '').localeCompare(b.subject || ''))
      .forEach((e) => {
        push(`Subject: ${e.subject}`)
        push(`Faculty: ${e.faculty}`)
        push(`Timing: ${e.time}`)
        if (e.group) push(`Group: ${e.group}`)
        e.students.sort().forEach((n) => push(`${bullet} ${n}`))
        push('')
      })
      
    push('-----------------------------')
    push('')
  })

  // Email closing
  push('I kindly request OD approval for the mentioned students.')
  push('')
  push('Thank you for your consideration.')
  push('')
  push('Best regards,')
  push(coordinator)
  push('Event Coordinator')

  return lines.join('\n')
}

// Helpers
function sortGroups(groups: GroupedStudentData[]): GroupedStudentData[] {
  return [...groups].sort((a, b) => {
    const sa = a.students[0]
    const sb = b.students[0]
    const pa = (sa?.program || '').toUpperCase()
    const pb = (sb?.program || '').toUpperCase()
    if (pa !== pb) return pa.localeCompare(pb)
    const seA = (sa?.section || '').toUpperCase()
    const seB = (sb?.section || '').toUpperCase()
    if (seA !== seB) return seA.localeCompare(seB)
    const semA = Number(sa?.semester) || 0
    const semB = Number(sb?.semester) || 0
    return semA - semB
  })
}

// Mailto URL generation is handled inline in the generateEmail function

/**
 * Formats date string for email subject
 * @param dateStr - Raw date string
 * @returns Formatted date string (DD-MM-YYYY)
 */
function formatDateForSubject(dateStr: string): string {
  if (!dateStr) return 'TBD';
  
  try {
    // Try to parse various date formats
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // If parsing fails, return original string
      return dateStr;
    }
    
    // Format as DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
    
  } catch (error) {
    console.warn(`⚠️ Could not format date "${dateStr}":`, error);
    return dateStr;
  }
}

/**
 * Validates email content before generation
 * @param metadata - Event metadata
 * @param groupedData - Students grouped by program-section
 * @returns Validation result with any warnings
 */
export function validateEmailContent(
  metadata: EventMetadata,
  groupedData: GroupedStudentData[]
): { isValid: boolean; warnings: string[] } {
  console.log('🔍 Validating email content...');
  
  const warnings: string[] = [];
  
  // Check required metadata
  if (!metadata.eventName) {
    warnings.push('Event name is missing - email subject may be generic');
  }
  
  if (!metadata.eventDate) {
    warnings.push('Event date is missing - email subject will show "TBD"');
  }
  
  if (!metadata.eventTime) {
    warnings.push('Event time is missing - email body will show "N/A"');
  }
  
  if (!metadata.eventVenue) {
    warnings.push('Event venue is missing - email body will show "N/A"');
  }
  
  // Check student data
  if (groupedData.length === 0) {
    warnings.push('No students found - email will have empty student list');
  }
  
  const totalStudents = groupedData.reduce((sum, group) => sum + group.students.length, 0);
  if (totalStudents === 0) {
    warnings.push('No students in any group - email will have empty student list');
  }
  
  // Check for students with no missed lectures
  const studentsWithNoMissedLectures = groupedData.reduce((count, group) => {
    return count + group.students.filter(student => student.missedLectures.length === 0).length;
  }, 0);
  
  if (studentsWithNoMissedLectures > 0) {
    warnings.push(`${studentsWithNoMissedLectures} students have no missed lectures`);
  }
  
  const isValid = warnings.length === 0;
  
  console.log(`✅ Email validation complete: ${isValid ? 'Valid' : 'Has warnings'}`);
  if (warnings.length > 0) {
    console.log('⚠️ Warnings:', warnings);
  }
  
  return { isValid, warnings };
}

/**
 * Generates a summary of the email content for preview
 * @param metadata - Event metadata
 * @param groupedData - Students grouped by program-section
 * @returns Email summary object
 */
export function generateEmailSummary(
  metadata: EventMetadata,
  groupedData: GroupedStudentData[]
): {
  totalStudents: number;
  totalGroups: number;
  totalMissedLectures: number;
  eventName: string;
  eventDate: string;
} {
  const totalStudents = groupedData.reduce((sum, group) => sum + group.students.length, 0);
  const totalGroups = groupedData.length;
  const totalMissedLectures = groupedData.reduce((sum, group) => {
    return sum + group.students.reduce((lectureSum, student) => {
      return lectureSum + student.missedLectures.length;
    }, 0);
  }, 0);
  
  return {
    totalStudents,
    totalGroups,
    totalMissedLectures,
    eventName: metadata.eventName || 'N/A',
    eventDate: metadata.eventDate || 'N/A'
  };
}
