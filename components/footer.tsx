import { Mail, Linkedin, Twitter, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl">ChainX</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Connecting contractors and workers through meaningful local opportunities.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Workers</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Browse Projects
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Career Tips
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Contractors</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Post a Project
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Hiring Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Contact Sales
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-primary-foreground/70">© 2025 ChainX. All rights reserved.</p>

          {/* Social Links */}
          <div className="flex gap-6">
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
