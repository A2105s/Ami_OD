import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Mail, Users, ArrowRight, Upload } from "lucide-react"
import Image from "next/image"
import dynamic from 'next/dynamic'
import EnhancedCard from "@/components/ui/EnhancedCard"

const AnimatedHeading = dynamic(
  () => import('@/components/ui/AnimatedHeading'),
  { ssr: false }
)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/30 bg-slate-900/70 backdrop-blur-lg shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <Image 
                  src="/amity-coding-club-logo.png" 
                  alt="Amity University Logo"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div className="text-white">
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">Amity University</h1>
                <p className="text-xs text-slate-300 font-medium">OD Automation Portal</p>
              </div>
            </div>
            <nav>
              <Link href="/od-generator">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold px-5 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-amber-500/30 hover:scale-[1.03] active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Generate OD
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-16">
            <AnimatedHeading textSize="xl" className="justify-center" />
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Streamline your official duty management with automated mail generation and attendance tracking for student participants.
            </p>
            
            <div className="flex justify-center">
              <Link href="/od-generator">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-bold px-10 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Mark OD
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-24">
            {/* Feature Card 1 */}
            <EnhancedCard 
              hoverEffect
              glowEffect
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 animate-delay-100"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Smart Excel Parsing</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Automatically extract and validate event details from Excel sheets with intelligent data processing.
              </p>
            </EnhancedCard>

            {/* Feature Card 2 */}
            <EnhancedCard 
              hoverEffect
              glowEffect
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 animate-delay-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110">
                <Mail className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Instant Mail Generation</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Generate professional, pre-formatted OD mails ready to send to faculty members with a single click.
              </p>
            </EnhancedCard>

            {/* Feature Card 3 */}
            <EnhancedCard 
              hoverEffect
              glowEffect
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 animate-delay-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Attendance Tracking</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Automatically track and report missed lectures by cross-referencing event schedules with timetables.
              </p>
            </EnhancedCard>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-700/30 bg-slate-900/70 backdrop-blur-lg py-6 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image 
                  src="/amity-coding-club-logo.png" 
                  alt="Amity University"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-300">Amity University</span>
                <p className="text-xs text-slate-500">Official Duty Automation</p>
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
