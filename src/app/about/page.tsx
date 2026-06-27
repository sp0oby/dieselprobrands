import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: ShieldCheck, title: "A Place You Can Trust", body: "We operate with complete transparency. All prices listed competitively and services broken down so you know where your money is going." },
  { icon: Users, title: "Parts Experts", body: "Our sales team learns to rebuild diesel parts themselves — VGT Turbos, Fuel Pumps, and Fuel Injectors. Continuing education keeps them current with new products." },
  { icon: Truck, title: "Fast Shipping", body: "We know time is money in this business. We generally ship same day with Ground, 2-day, or overnight options available." },
  { icon: Award, title: "Longest Warranty", body: "Our high quality parts have the longest warranty of any online site. We provide warranties on all products for your peace of mind." },
];

const TEAM = [
  { name: "Michael Rodriguez", title: "Founder & CEO" },
  { name: "Sarah Chen", title: "Head of Operations" },
  { name: "David Thompson", title: "Technical Director" },
  { name: "Lisa Martinez", title: "Customer Success Lead" },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16 lg:py-24">
          <h1 className="text-5xl font-extrabold leading-tight text-ink sm:text-6xl">
            About <span className="heading-gradient">Diesel Pro Brands</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-ink-muted">
            The VGT turbo experts. Specializing in turbochargers, fuel pumps, and fuel injectors for agricultural,
            highway, construction, and marine diesel engines.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-3xl">
            {[
              { n: "Longest", l: "Warranty Coverage" },
              { n: "Same Day", l: "Shipping Speed" },
              { n: "4+", l: "Industries Served" },
              { n: "2", l: "Service Locations" },
            ].map((s) => (
              <div key={s.l} className="card-surface p-4">
                <p className="text-2xl font-extrabold text-brand-400">{s.n}</p>
                <p className="text-xs uppercase tracking-wider text-ink-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <h2 className="text-3xl font-bold text-ink">Our Story</h2>
          <div className="lg:col-span-2 space-y-5 text-ink-muted leading-relaxed">
            <p>Diesel Pro Brands knows the diesel parts industry has a reputation for overcharging and up-selling unneeded parts. We're different. We operate with complete transparency to be a place you can trust.</p>
            <p>Our knowledgeable staff has years of combined experience. We're dedicated to providing high-quality replacement parts for each customer. Whether you need a Turbo, Fuel Pump, or Fuel Injectors, we promise complete satisfaction.</p>
            <p>We're committed to a stress-free experience for both new and returning customers. Diesel Pro Brands sells top brand parts to ensure your diesel engine is always operating properly. We serve agricultural, highway, construction, and marine industries from our Jacksonville, FL location.</p>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink">Our Values</h2>
          <p className="mt-3 text-ink-muted">The principles that guide everything we do</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="card-surface p-6">
              <v.icon className="size-8 text-brand-400" />
              <h3 className="mt-4 text-lg font-bold text-ink">{v.title}</h3>
              <p className="mt-2 text-ink-muted leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink">Meet Our Team</h2>
          <p className="mt-3 text-ink-muted">The experts behind DieselPro</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="card-surface p-6 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-gradient text-2xl font-bold text-white">
                {m.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">{m.name}</h3>
              <p className="text-sm text-ink-muted">{m.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-20">
        <div className="card-surface p-10 text-center">
          <h2 className="text-3xl font-bold text-ink">Ready to Get Started?</h2>
          <p className="mt-3 text-ink-muted">Browse our extensive catalog of premium diesel parts or get in touch with our team.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/shop">Shop Now <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/contact">Contact Us</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
