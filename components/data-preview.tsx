"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, Clock, GraduationCap } from "lucide-react"
import { useMemo } from "react"
import type { ParsedExcelData, StudentWithMissedLectures, MissedLecture } from "@/types/od"
import { toTitleCase } from "@/utils/normalizeData"

interface DataPreviewProps {
  eventData: ParsedExcelData
}

export function DataPreview({ eventData }: DataPreviewProps) {
  const studentsWith = eventData.students as unknown as StudentWithMissedLectures[]
  const eventDay = (eventData.metadata.day || '').toString()
  // Lightweight parser to extract event time slots like "09:15-10:10_10:15-11:10"
  // Parse and sort event time slots from the event time string
  const eventSlots = useMemo(() => {
    const raw = String(eventData?.metadata?.eventTime || '')
    if (!raw) return [] as { start: string; end: string; label: string, startTime: number }[]
    
    // Convert time string to minutes since midnight for sorting
    const timeToMinutes = (timeStr: string): number => {
      // Handle 12-hour format with AM/PM
      const timeLower = timeStr.toLowerCase().trim()
      const isPM = timeLower.includes('pm') || timeLower.includes('p.m.')
      const timeOnly = timeLower.replace(/[^0-9:]/g, '') // Remove non-numeric/colon chars
      
      let [hours, minutes] = timeOnly.split(':').map(Number)
      
      // Convert 12-hour to 24-hour format
      if (isPM && hours < 12) hours += 12
      if (!isPM && hours === 12) hours = 0 // 12:00 AM is 00:00
      
      return hours * 60 + (minutes || 0)
    }
    
    // Handle various time range formats
    const timeRangeRegex = /(\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?)(?:\s*[-–]\s*)(\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?)/gi
    const matches = [...raw.matchAll(timeRangeRegex)]
    
    // If no ranges found, try to extract individual time points
    const slots = []
    
    if (matches.length === 0) {
      const timePointRegex = /(\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?)/gi
      const points = [...raw.matchAll(timePointRegex)].map(m => m[0].trim())
      
      // Group into pairs if we have an even number of points
      for (let i = 0; i < points.length; i += 2) {
        if (i + 1 < points.length) {
          const start = points[i]
          const end = points[i + 1]
          slots.push({
            start,
            end,
            label: `${start}-${end}`,
            startTime: timeToMinutes(start)
          })
        }
      }
    } else {
      // Process matched time ranges
      for (const match of matches) {
        const start = match[1].trim()
        const end = match[2].trim()
        slots.push({
          start,
          end,
          label: `${start}-${end}`,
          startTime: timeToMinutes(start)
        })
      }
    }
    
    // Sort slots by start time in ascending order
    return slots.sort((a, b) => {
      // First try to sort by numeric hour value
      const aHour = parseInt(a.start.split(':')[0])
      const bHour = parseInt(b.start.split(':')[0])
      
      // If hours are different, sort by hour
      if (aHour !== bHour) {
        return aHour - bHour
      }
      
      // If same hour, sort by minutes
      const aMin = parseInt(a.start.split(':')[1]?.match(/\d+/)?.[0] || '0')
      const bMin = parseInt(b.start.split(':')[1]?.match(/\d+/)?.[0] || '0')
      return aMin - bMin
    })
  }, [eventData?.metadata?.eventTime])

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-yellow-400" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Event Details */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Event</span>
            </div>
            <p className="text-white font-semibold">{toTitleCase(eventData.metadata.eventName)}</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Coordinator</span>
            </div>
            <p className="text-white font-semibold">{toTitleCase(eventData.metadata.coordinator)}</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Date & Time</span>
            </div>
            <p className="text-white font-semibold">{eventData.metadata.eventDate}</p>
            <p className="text-slate-300 text-sm">{eventData.metadata.eventTime}</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Venue</span>
            </div>
            <p className="text-white font-semibold">{toTitleCase(String(eventData.metadata.eventVenue || eventData.metadata.place || ''))}</p>
          </div>
        </div>

        {/* Participants Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Participants ({studentsWith.length})</h3>
            <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30">
              {studentsWith.filter((p) => Array.isArray(p.missedLectures) && p.missedLectures.length > 0).length} with missed lectures
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Program</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Section</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Semester</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Group</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Missed Lectures</th>
                </tr>
              </thead>
              <tbody>
                {studentsWith.map((student, index) => (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 px-4 text-white font-medium">{student.name}</td>
                    <td className="py-3 px-4 text-slate-300">{String(student.program || '').toUpperCase()}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {(() => {
                        const raw = String(student.section || '').toUpperCase()
                        const m = raw.match(/([A-Z])$/)
                        return m ? m[1] : raw
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{student.semester}</td>
                    <td className="py-3 px-4 text-slate-300">{student.group || '-'}</td>
                    <td className="py-3 px-4">
                      {(() => {
                        const list = Array.isArray(student.missedLectures) ? (student.missedLectures as (MissedLecture | string)[]) : []
                        const rows: Array<{ time: string; content: MissedLecture }> = []
                        
                        // Function to parse time string to minutes since midnight
                        const parseTime = (timeStr: string): number => {
                          if (!timeStr) return 0
                          
                          // Handle different time formats (9:15, 9:15 AM, 09:15, 9-10, etc.)
                          const timeMatch = timeStr.match(/(\d{1,2})[:\-](\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i) || 
                                         timeStr.match(/(\d{1,2})\s*(am|pm|AM|PM)/i)
                          
                          if (!timeMatch) {
                            // Try to handle time range like '9-10'
                            const rangeMatch = timeStr.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/)
                            if (rangeMatch) {
                              return parseInt(rangeMatch[1], 10) * 60 // Return start hour in minutes
                            }
                            return 0
                          }
                          
                          let hour = parseInt(timeMatch[1], 10)
                          const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
                          const period = timeMatch[3] || timeMatch[2]
                          
                          // Convert to 24-hour format
                          if (period && period.toLowerCase() === 'pm' && hour < 12) hour += 12
                          if (period && period.toLowerCase() === 'am' && hour === 12) hour = 0
                          
                          return hour * 60 + minute
                        }

                        // Get all valid lectures (non-string entries with time)
                        const validLectures = list
                          .filter((lec): lec is MissedLecture => 
                            typeof lec === 'object' && lec !== null && 'time' in lec
                          )
                          .filter(lec => lec.time) // Ensure time exists

                        // If we have event slots, filter lectures to only show those within the slots
                        const filteredLectures = eventSlots.length > 0
                          ? validLectures.filter(lec => {
                              const lecTime = lec.time || ''
                              const lecMinutes = parseTime(lecTime)
                              
                              return eventSlots.some(slot => {
                                const slotStart = parseTime(slot.start)
                                const slotEnd = parseTime(slot.end)
                                
                                // If we can't parse the times, do a simple string comparison
                                if (slotStart === 0 || slotEnd === 0 || lecMinutes === 0) {
                                  return lecTime.includes(slot.start) || lecTime.includes(slot.end) ||
                                         lecTime.includes(slot.start.replace(':', '')) ||
                                         lecTime.includes(slot.end.replace(':', ''))
                                }
                                
                                // Check if lecture time is within the slot time range (with 30-minute buffer)
                                return lecMinutes >= (slotStart - 30) && lecMinutes <= (slotEnd + 30)
                              })
                            })
                          : validLectures
                        
                        // Remove duplicates and sort by time
                        const uniqueLectures = Array.from(new Map(
                          filteredLectures.map(lec => [
                            `${lec.time}-${lec.subject_name}-${lec.group}`,
                            lec
                          ])
                        ).values())
                        
                        // Sort by time
                        const sortedLectures = [...uniqueLectures]
                          .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                          .map(lec => ({
                            time: lec.time || 'Time not specified',
                            content: lec
                          }))
                        
                        // Add all sorted lectures to rows
                        rows.push(...sortedLectures)

                        if (rows.length === 0) {
                          return (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30">
                              No conflicts
                            </Badge>
                          )
                        }

                        return (
                          <div className="flex flex-col gap-1">
                            {rows.map((row, idx) => {
                              if (row.content) {
                                const lecture = row.content as MissedLecture
                                return (
                                  <div key={idx} className="text-xs">
                                    <span className="text-green-400">{lecture.time}</span>
                                    <span className="text-slate-400"> : </span>
                                    <span className="text-red-500">{lecture.subject_name}</span>
                                    {lecture.group ? (
                                      <span className="text-slate-400"> {` (G:${lecture.group})`}</span>
                                    ) : null}
                                  </div>
                                )
                              }
                              // Skip any rows without content (inferred classes)
                              return null
                            })}
                          </div>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

