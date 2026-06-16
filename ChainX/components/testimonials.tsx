import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Contractor from Austin, TX",
    content:
      "ChainX helped me find reliable workers for my renovation projects. The platform is intuitive and the workers are professional. Game changer!",
    rating: 5,
  },
  {
    name: "Marcus Williams",
    role: "Skilled Worker, Seattle",
    content:
      "I've landed consistent work through ChainX. The contractors are fair, the pay is reliable, and I love supporting my local community.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Small Business Owner, Denver",
    content:
      "Finding quality contractors used to be a nightmare. ChainX made it simple and transparent. Highly recommend to any business owner!",
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from contractors and workers who've found success on ChainX
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 flex flex-col">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-6 flex-grow italic">"{testimonial.content}"</p>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
