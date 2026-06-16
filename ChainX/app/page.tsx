import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RealtimeDemo } from "@/components/realtime-demo"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">Connect Local Workers with Opportunities</h1>
          <p className="text-xl text-gray-600 mb-8">
            ChainX is the hyperlocal job marketplace connecting contractors with skilled workers in your area. Find work
            instantly or hire reliable talent today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/worker-app">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                ChainX Worker App
              </Button>
            </Link>
            <Link href="/contractor-app">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                ChainX Contractor App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose ChainX?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Instant Connections</h3>
              <p className="text-gray-600">
                Find jobs or workers in minutes, not days. Real-time notifications keep everyone updated.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Fair Pricing</h3>
              <p className="text-gray-600">
                Transparent rates with no hidden fees. Tatkal jobs offer premium pay for urgent work.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-2">Reliable & Safe</h3>
              <p className="text-gray-600">
                Verified profiles, ratings, and penalties ensure quality and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">For Workers</h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Sign Up & Create Profile</p>
                    <p className="text-gray-600 text-sm">Tell us about your skills and location</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Browse Available Jobs</p>
                    <p className="text-gray-600 text-sm">Find jobs that match your skills</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Apply or Grab Tatkal Jobs</p>
                    <p className="text-gray-600 text-sm">Apply for regular jobs or grab urgent ones instantly</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-semibold">Complete & Get Paid</p>
                    <p className="text-gray-600 text-sm">Show up on time and earn your money</p>
                  </div>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">For Contractors</h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Sign Up & Create Profile</p>
                    <p className="text-gray-600 text-sm">Set up your contractor account</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Post a Job</p>
                    <p className="text-gray-600 text-sm">Describe your job and set the rate</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Review & Hire Workers</p>
                    <p className="text-gray-600 text-sm">Accept applications from qualified workers</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-semibold">Manage & Complete</p>
                    <p className="text-gray-600 text-sm">Track job progress and mark as complete</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Communication Demo */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Real-time Cross-App Communication</h2>
          <p className="text-xl text-gray-600 text-center mb-8">
            See how contractors and workers communicate instantly across separate apps
          </p>
          <RealtimeDemo />
        </div>
      </section>

      {/* Tatkal Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Tatkal - Urgent Jobs</h2>
          <p className="text-xl text-gray-600 mb-8">
            Need workers urgently? Post a Tatkal job and grab workers instantly with premium pay!
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join thousands of workers and contractors on ChainX today</p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                Register Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-orange-700 bg-transparent"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ChainX</h3>
              <p className="text-gray-400">Connecting workers with opportunities</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Workers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/worker/jobs" className="hover:text-white">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/worker/tatkal-jobs" className="hover:text-white">
                    Tatkal Jobs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Contractors</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/contractor/post-job" className="hover:text-white">
                    Post Job
                  </Link>
                </li>
                <li>
                  <Link href="/contractor/applications" className="hover:text-white">
                    Find Workers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/#features" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ChainX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
