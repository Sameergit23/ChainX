import { Card } from "@/components/ui/card"
import { MapPin, Briefcase, TrendingUp, Users } from "lucide-react"

const features = [
  {
    icon: MapPin,
    title: "Local Connections",
    description:
      "Find contractors and workers in your neighborhood. Support local talent and build stronger communities.",
  },
  {
    icon: Briefcase,
    title: "Diverse Projects",
    description:
      "From construction and repairs to tech and professional services, discover opportunities across all industries.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Build meaningful relationships with reliable contractors and skilled workers in your area.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Join a platform dedicated to strengthening local economies and creating real professional connections.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Why Choose ChainX?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're building the future of local contractor and worker connections, one community at a time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
