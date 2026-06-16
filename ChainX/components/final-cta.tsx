import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function FinalCTA() {
  return (
    <section id="contact" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Ready to Join ChainX?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a contractor looking for skilled workers or a worker seeking local opportunities, ChainX
            connects you with your community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Join thousands of contractors and workers building stronger local communities
        </p>
      </div>
    </section>
  )
}
