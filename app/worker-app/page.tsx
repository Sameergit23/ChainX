import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WorkerApp() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Worker Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">ChainX Worker</div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              How It Works
            </a>
            <a href="#tatkal" className="text-gray-600 hover:text-gray-900">
              Tatkal Jobs
            </a>
          </nav>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">Find Work Opportunities Instantly</h1>
          <p className="text-xl text-gray-600 mb-8">
            ChainX Worker connects you with local job opportunities. Browse jobs, apply instantly, 
            and earn money with real-time notifications and instant job updates.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/worker/jobs">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Browse Available Jobs
              </Button>
            </Link>
            <Link href="/worker/dashboard">
              <Button size="lg" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose ChainX Worker?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Instant Applications</h3>
              <p className="text-gray-600">
                See new jobs as soon as contractors post them. Apply instantly and get notified of responses in real-time.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Fair Pay</h3>
              <p className="text-gray-600">
                Transparent rates with no hidden fees. Tatkal jobs offer premium pay for urgent work.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Get instant notifications when contractors accept your applications or post new jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Sign Up & Profile</h3>
              <p className="text-gray-600">Create your profile, add skills, and set your location.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Browse Jobs</h3>
              <p className="text-gray-600">See available jobs in real-time as contractors post them.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Apply Instantly</h3>
              <p className="text-gray-600">Apply for regular jobs or grab Tatkal jobs with premium pay.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Work & Earn</h3>
              <p className="text-gray-600">Complete jobs, get paid, and build your rating.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tatkal Section */}
      <section id="tatkal" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Tatkal - Urgent Jobs</h2>
          <p className="text-xl text-gray-600 mb-8">
            Grab urgent jobs instantly with premium pay! These jobs are posted by contractors who need workers immediately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border-2 border-orange-500 rounded-lg bg-orange-50">
              <h3 className="text-2xl font-bold mb-2">High Urgency</h3>
              <p className="text-4xl font-bold text-orange-600 mb-2">1.5x Pay</p>
              <p className="text-gray-600">2 hours to grab • Perfect for same-day needs</p>
            </div>
            <div className="p-6 border-2 border-red-500 rounded-lg bg-red-50">
              <h3 className="text-2xl font-bold mb-2">Critical Urgency</h3>
              <p className="text-4xl font-bold text-red-600 mb-2">2x Pay</p>
              <p className="text-gray-600">1 hour to grab • For immediate needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Real-time Cross-App Communication</h2>
          <p className="text-xl text-gray-600 mb-8">
            When contractors post jobs, you see them instantly on your device. When you apply, 
            they get notified immediately. Everything happens in real-time across both apps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border-2 border-orange-500 rounded-lg bg-orange-50">
              <h3 className="text-2xl font-bold mb-2">Contractor App</h3>
              <p className="text-gray-600">Posts jobs, manages applications, tracks progress</p>
            </div>
            <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-50">
              <h3 className="text-2xl font-bold mb-2">Worker App</h3>
              <p className="text-gray-600">Sees jobs instantly, applies immediately, gets notifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-8">Join thousands of workers using ChainX to find job opportunities</p>
          <div className="flex gap-4 justify-center">
            <Link href="/worker/jobs">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Browse Jobs Now
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-blue-700 bg-transparent"
              >
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ChainX Worker</h3>
              <p className="text-gray-400">Find work opportunities instantly</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Workers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white">Tatkal Jobs</a></li>
                <li><a href="#" className="hover:text-white">My Applications</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ChainX Worker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
