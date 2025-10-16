"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EnhancedCard from "@/components/ui/EnhancedCard"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Download, FileSpreadsheet, CheckCircle, AlertCircle, XCircle, ClipboardCopy, Send, Home } from "lucide-react"
import Image from "next/image"
import { FileUpload } from "@/components/file-upload"
import { DataPreview } from "@/components/data-preview"
import { parseExcel } from "@/utils/parseExcel"
/**
 * Existing imports
 */
// import { generateODMail } from "@/lib/excel-utils"
import { buildGmailComposeUrl } from "@/lib/gmail-url-builder"
import { exportODReport } from "@/lib/report-exporter"
import type { ParsedExcelData, GroupedStudentData, StudentWithMissedLectures } from "@/types/od"
import { generateEmail, generateEmailPlaintext } from "@/utils/generateEmail"
import { loadTimetable, calculateMissedLectures } from "@/utils/calculateOverlaps"
import { normalizeProgram, normalizeSection, normalizeSemester } from "@/utils/normalizeData"

// Convert event date string to weekday. Supports formats:
// - DD-MM-YYYY, DD/MM/YYYY, and native Date-parsable strings.
function getWeekdayFromDate(input?: string): string {
  if (!input) return "";
  const raw = String(input).trim();
  // Try DD-MM-YYYY or DD/MM/YYYY
  const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  let d: Date | null = null;
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1; // JS months 0-11
    const yyyy = parseInt(m[3], 10);
    d = new Date(yyyy, mm, dd);
  } else {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) d = parsed; else d = null;
  }
  if (!d) return "";
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

import AnimatedHeading from "@/components/ui/AnimatedHeading";

export default function ODGeneratorPage() {
  const [eventData, setEventData] = useState<ParsedExcelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [gmailWarning, setGmailWarning] = useState<string | null>(null)
  // Modal state
  const [showMailModal, setShowMailModal] = useState(false)
  const [mailSubject, setMailSubject] = useState("")
  const [mailBody, setMailBody] = useState("")
  const [copyButtonText, setCopyButtonText] = useState("Copy to Clipboard")

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const data = await parseExcel(file)
      // Try to compute missed lectures immediately using timetable
      try {
        const timetable = await loadTimetable()
        // Determine event day: prefer explicit day; else derive from date if possible
        let day = (data.metadata.day || "").toString()
        if (!day && data.metadata.eventDate) {
          day = getWeekdayFromDate(data.metadata.eventDate)
        }
        if (day && data.metadata.eventTime) {
          // Normalize students for robust timetable matching
          const normalizedStudents = data.students.map((s) => ({
            ...s,
            section: normalizeSection(String(s.section || '')),
            semester: normalizeSemester(String(s.semester || '')),
            normalizedProgram: normalizeProgram(String(s.program || '')),
          }))

          const studentsWithMissed = calculateMissedLectures(
            normalizedStudents as unknown as StudentWithMissedLectures[],
            data.metadata.eventTime,
            day,
            timetable
          )
          setEventData({ ...data, students: studentsWithMissed } as ParsedExcelData)
        } else {
          // Missing day or time; set raw data
          setEventData(data)
        }
      } catch (calcErr) {
        console.error('Failed to compute missed lectures on upload:', calcErr)
        setEventData(data)
      }
      setSuccess("File uploaded and parsed successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file")
    } finally {
      setIsLoading(false)
    }
  }

  // Group students by Program > Section > Semester for email rendering
  function groupForEmail(students: StudentWithMissedLectures[]): GroupedStudentData[] {
    const map = new Map<string, StudentWithMissedLectures[]>();
    students.forEach((s) => {
      const key = `${(s.program || '').toUpperCase()}|${(s.section || '').toUpperCase()}|${s.semester}`;
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    const groups: GroupedStudentData[] = [];
    map.forEach((arr, key) => {
      groups.push({ programSection: key, students: arr });
    });
    return groups;
  }

  const handleGenerateMail = () => {
    if (!eventData) return
    const grouped = groupForEmail(eventData.students as unknown as StudentWithMissedLectures[])
    const { subject } = generateEmail(eventData.metadata, grouped)
    const body = generateEmailPlaintext(eventData.metadata, grouped)
    setMailSubject(subject)
    setMailBody(body) // Plaintext body
    setShowMailModal(true)
  }

  const handleGmailDraft = () => {
    if (!eventData) return
    setGmailWarning(null)
    const grouped = groupForEmail(eventData.students as unknown as StudentWithMissedLectures[])
    const { subject } = generateEmail(eventData.metadata, grouped)
    // Generate plain text body for Gmail
    const plainTextBody = generateEmailPlaintext(eventData.metadata, grouped)
    // Use plain text for Gmail compose URL
    const { url, tooLong } = buildGmailComposeUrl({ subject, body: plainTextBody })
    if (tooLong) {
      setGmailWarning("Mail body too long for web draft. Please copy-paste manually.")
    }
    window.open(url, '_blank')
  }

  const handleCopyMail = () => {
    navigator.clipboard.writeText(`Subject: ${mailSubject}\n\n${mailBody}`)
    setCopyButtonText("Copied!")
    setSuccess("Mail content copied to clipboard!")
    
    // Reset button text after 2 seconds
    setTimeout(() => {
      setCopyButtonText("Copy to Clipboard")
    }, 2000)
  }

  const handleSendMail = () => {
    if (!eventData) return
    // Generate plain text body for Gmail
    const grouped = groupForEmail(eventData.students as unknown as StudentWithMissedLectures[])
    const plainTextBody = generateEmailPlaintext(eventData.metadata, grouped)
    // Use buildGmailComposeUrl for Gmail with plain text body
    const { url, tooLong } = buildGmailComposeUrl({ subject: mailSubject, body: plainTextBody })
    if (tooLong) {
      setGmailWarning("Mail body too long for web draft. Please copy-paste manually.")
    }
    window.open(url, '_blank')
    setShowMailModal(false)
  }

  const handleDownloadReport = () => {
    if (!eventData) return
    const result = exportODReport(eventData)
    if (!result.success) {
      setError(result.error || "Failed to generate report")
    } else {
      setSuccess("OD report downloaded successfully!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900">
      {/* Mail Preview Modal */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl max-w-4xl w-full p-8 relative backdrop-blur-xl">
            <button
              className="absolute top-6 right-6 text-slate-400 hover:text-rose-400 transition-colors"
              onClick={() => setShowMailModal(false)}
              aria-label="Close"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Mail className="w-6 h-6 text-amber-400" /> OD Mail Preview
            </h2>
            <div className="mb-6">
              <label className="block text-slate-300 font-medium mb-2 text-sm uppercase tracking-wider">Subject</label>
              <input
                className="w-full border border-slate-600/50 bg-slate-700/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent text-base placeholder-slate-500 transition-all duration-200"
                value={mailSubject}
                onChange={e => setMailSubject(e.target.value)}
                placeholder="OD Mail Subject"
                aria-label="Mail Subject"
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-300 font-medium mb-2 text-sm uppercase tracking-wider">Body (Plain Text)</label>
              <textarea
                className="w-full border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg px-4 py-3 min-h-[350px] focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent text-base placeholder-slate-500 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 transition-all duration-200"
                value={mailBody}
                onChange={e => setMailBody(e.target.value)}
                placeholder="OD Mail Body (Plain Text)"
                aria-label="Mail Body"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <Button
                onClick={handleCopyMail}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
              >
                <ClipboardCopy className="w-4 h-4" /> {copyButtonText}
              </Button>
              <Button
                onClick={handleSendMail}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
              >
                <Send className="w-4 h-4" /> Send Mail
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="border-b border-slate-700/30 bg-slate-900/70 backdrop-blur-lg shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white font-medium px-5 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm shadow-lg hover:shadow-blue-500/30 hover:scale-[1.03] active:scale-95"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <Image
                  src="/icon-192.png"
                  alt="Amity University Logo"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">OD Generator</h1>
                <p className="text-xs text-slate-300 font-medium">Upload & Process</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="mb-6">
              <AnimatedHeading textSize="xl" className="justify-center" />
            </div>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed">
              Upload your Excel file to automatically generate OD mails and attendance reports
            </p>
          </div>

          {/* Alerts */}
          <div className="max-w-3xl mx-auto mb-10">
            {error && (
              <Alert className="border-red-500/30 bg-red-500/10 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300 text-sm">{success}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <EnhancedCard 
        hoverEffect
        className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm animate-delay-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
      >
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            Upload Excel File
          </CardTitle>
          <p className="text-sm text-slate-400">
            Upload an Excel file containing student data to generate OD mails
          </p>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          
          <div className="flex justify-center">
            <a 
              href="/templates/Standard_OD_Template.xlsx" 
              download="Standard_OD_Template.xlsx"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-all gap-2 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <Download className="w-4 h-4" />
              Download Excel Template
            </a>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700/50">
            <h4 className="text-sm font-semibold text-white mb-2">Expected Excel Format:</h4>
            <ul className="text-sm text-slate-300 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                <span>Event Name, Coordinator, Date, Time, Place</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                <span>Student columns: Name, Program, Section, Semester</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                <span>Supports .xlsx format only</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </EnhancedCard>

            {/* Actions Section */}
            <EnhancedCard
        hoverEffect
        className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm animate-delay-200"
      >
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
                <Button
                  onClick={handleGenerateMail}
                  disabled={!eventData}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold py-4 text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl hover:shadow-amber-500/20"
                >
                  <Mail className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>OD Mail Preview</span>
                </Button>

                <Button
                  onClick={handleGmailDraft}
                  disabled={!eventData}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-4 text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl hover:shadow-rose-500/20"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h20.728A1.636 1.636 0 0 1 24 5.457zM12 14.182L21.818 6.545H2.182L12 14.182z"/>
                  </svg>
                  <span>Open in Gmail</span>
                </Button>

                <Button
                  onClick={handleDownloadReport}
                  disabled={!eventData}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-4 text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl hover:shadow-emerald-500/20"
                >
                  <Download className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>Download OD Report</span>
                </Button>

                {gmailWarning && (
                  <Alert className="border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-300 text-sm">{gmailWarning}</AlertDescription>
                  </Alert>
                )}

                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-white mb-2">What happens next:</h4>
                  <ul className="text-sm text-slate-300 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Mail opens in your default email client</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Review and send the email</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Report downloads as Excel file</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">•</span>
                      <span>All data processed locally</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </EnhancedCard>
          </div>

          {/* Data Preview */}
          {eventData && (
            <div className="mt-10 bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Preview Data
                </h3>
                <DataPreview eventData={eventData} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 bg-slate-900/70 backdrop-blur-lg py-6 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image 
                  src="/icon-192.png" 
                  alt="Amity University"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-300">Amity University</span>
                <p className="text-xs text-slate-500">OD Generator</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} OD Automation Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
