import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ContractorApp() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Contractor Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-orange-600">ChainX Contractor</div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
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
          <h1 className="text-5xl font-bold mb-6 text-gray-900">Find Reliable Workers Instantly</h1>
          <p className="text-xl text-gray-600 mb-8">
            ChainX Contractor connects you with skilled local workers. Post jobs, manage applications, 
            and get work done with real-time notifications and instant hiring.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contractor/post-job">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Post Your First Job
              </Button>
            </Link>
            <Link href="/contractor/dashboard">
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
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose ChainX Contractor?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Instant Hiring</h3>
              <p className="text-gray-600">
                Post jobs and get applications in minutes. Real-time notifications keep you updated on every application.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Tatkal Jobs</h3>
              <p className="text-gray-600">
                Need workers urgently? Post Tatkal jobs with premium pay and grab workers instantly.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Smart Management</h3>
              <p className="text-gray-600">
                Track job progress, manage applications, and monitor worker performance all in one place.
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
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Post Job</h3>
              <p className="text-gray-600">Describe your job, set the rate, and choose regular or Tatkal urgency.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Applications</h3>
              <p className="text-gray-600">Workers apply instantly. You get real-time notifications for each application.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Review & Hire</h3>
              <p className="text-gray-600">Check worker profiles, ratings, and accept the best candidates.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Manage & Complete</h3>
              <p className="text-gray-600">Track job progress, mark completion, and rate workers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Real-time Cross-App Communication</h2>
          <p className="text-xl text-gray-600 mb-8">
            When you post a job, workers see it instantly on their devices. When they apply, 
            you get notified immediately. Everything happens in real-time across both apps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border-2 border-orange-500 rounded-lg bg-orange-50">
              <h3 className="text-2xl font-bold mb-2">Contractor App</h3>
              <p className="text-gray-600">Post jobs, manage applications, track progress</p>
            </div>
            <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-50">
              <h3 className="text-2xl font-bold mb-2">Worker App</h3>
              <p className="text-gray-600">Browse jobs, apply instantly, get notifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Hiring?</h2>
          <p className="text-xl mb-8">Join thousands of contractors using ChainX to find reliable workers</p>
          <div className="flex gap-4 justify-center">
            <Link href="/contractor/post-job">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                Post Your First Job
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-orange-700 bg-transparent"
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
              <h3 className="text-xl font-bold mb-4">ChainX Contractor</h3>
              <p className="text-gray-400">Find reliable workers instantly</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Contractors</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white">Tatkal Jobs</a></li>
                <li><a href="#" className="hover:text-white">Manage Applications</a></li>
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
            <p>&copy; 2025 ChainX Contractor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
