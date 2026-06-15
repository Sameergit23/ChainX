import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Worker",
    price: "Free",
    period: "forever",
    description: "Start finding local work today",
    features: [
      "Browse all projects",
      "Save favorites",
      "Apply instantly",
      "Job alerts",
      "Community access",
      "Profile building",
    ],
    highlighted: false,
  },
  {
    name: "Contractor",
    price: "$29",
    period: "/month",
    description: "Perfect for small to medium contractors",
    features: [
      "Post unlimited projects",
      "Featured listings",
      "Worker screening tools",
      "Priority support",
      "Analytics dashboard",
      "Team collaboration",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large contractors and agencies",
    features: [
      "Unlimited everything",
      "Dedicated account manager",
      "Custom integrations",
      "24/7 support",
      "Advanced analytics",
      "White-label options",
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking for work or hiring talent, we have a plan for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 flex flex-col transition-all ${
                plan.highlighted ? "ring-2 ring-primary shadow-lg scale-105 md:scale-100" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4">
                  <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>

              <Link href="/login" className="w-full">
                <Button
                  className={`w-full mb-8 ${
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  Get Started
                </Button>
              </Link>

              <div className="space-y-4 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">Workers always get free access. No credit card required.</p>
        </div>
      </div>
    </section>
  )
}
