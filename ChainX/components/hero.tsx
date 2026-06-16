import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
                Connect with Local Contractors & Workers
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg text-balance">
                ChainX connects contractors with skilled workers for local projects. Find opportunities or build your
                team in your community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Trusted by local communities</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="font-bold text-foreground">10K+</p>
                  <p className="text-xs text-muted-foreground">Active Projects</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">25K+</p>
                  <p className="text-xs text-muted-foreground">Workers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl border border-border"></div>
            <div className="absolute inset-4 bg-card rounded-xl border border-border flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-md"></div>
                </div>
                <p className="text-sm text-muted-foreground">Job Marketplace Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
