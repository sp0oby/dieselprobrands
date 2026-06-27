export type Job = {
  id: string;
  title: string;
  department: "Sales" | "Operations" | "Engineering" | "Support" | "Warehouse";
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  salary: string;
  remote: boolean;
  blurb: string;
  responsibilities: string[];
  qualifications: string[];
  postedAt: string;
};

export const JOBS: Job[] = [
  {
    id: "diesel-parts-specialist",
    title: "Diesel Parts Specialist",
    department: "Sales",
    location: "Jacksonville, FL",
    type: "Full-time",
    salary: "$55,000 - $75,000 + commission",
    remote: false,
    blurb: "Be the go-to expert for our customers. Help mechanics and fleet operators pick the right turbo, pump, or injector for their engine — and rebuild some of them yourself so you actually know the parts you sell.",
    responsibilities: [
      "Field inbound calls and chats from mechanics, fleet managers, and DIY owners",
      "Cross-reference OEM part numbers and recommend compatible alternatives",
      "Rebuild VGT turbos, fuel pumps, and injectors as part of ongoing training",
      "Quote large fleet orders and coordinate with the warehouse on availability",
      "Build long-term relationships with repeat customers and shops",
    ],
    qualifications: [
      "2+ years working with diesel engines (agricultural, highway, marine, or construction)",
      "Comfortable cross-referencing OEM part numbers across brands",
      "Customer-first attitude — patient on the phone, sharp on follow-up",
      "Familiarity with Cummins, CAT, Detroit, Bosch, or Garrett product lines",
      "Bilingual (English/Spanish) a plus",
    ],
    postedAt: "2026-06-12",
  },
  {
    id: "warehouse-lead",
    title: "Warehouse Lead",
    department: "Warehouse",
    location: "Jacksonville, FL",
    type: "Full-time",
    salary: "$60,000 - $80,000",
    remote: false,
    blurb: "Run our Jacksonville fulfillment floor. Own pick, pack, and same-day ship cutoffs. Lead a small team that takes pride in shipping perfect orders fast.",
    responsibilities: [
      "Manage daily pick/pack/ship workflow to hit the 2pm same-day cutoff",
      "Coordinate inbound receiving from suppliers and core returns",
      "Maintain inventory accuracy across our WMS and Zoho Inventory",
      "Implement and enforce safety standards on the warehouse floor",
      "Hire, train, and mentor warehouse associates",
    ],
    qualifications: [
      "3+ years of warehouse or distribution-center supervision",
      "Hands-on experience with WMS software and inventory cycle counts",
      "Forklift certified",
      "Strong organizational and team-leadership skills",
      "Diesel parts knowledge a plus (we'll teach the rest)",
    ],
    postedAt: "2026-06-18",
  },
  {
    id: "ecommerce-engineer",
    title: "E-commerce Engineer",
    department: "Engineering",
    location: "Remote (US)",
    type: "Full-time",
    salary: "$120,000 - $160,000",
    remote: true,
    blurb: "Help us build the systems behind dieselprobrands.com — from the storefront to the integrations to the catalog ingestion that keeps 12,000+ SKUs fresh.",
    responsibilities: [
      "Build customer-facing features in our modern web stack",
      "Maintain integrations with our ERP and payment processor",
      "Improve the catalog ingestion pipeline (multiple supplier sources)",
      "Own performance, observability, and incident response for production",
      "Collaborate directly with the founder on roadmap",
    ],
    qualifications: [
      "4+ years building production web applications",
      "Strong TypeScript, React, and PostgreSQL skills",
      "Experience with payment processing and external API integrations",
      "Comfortable owning a feature end-to-end (DB → UI → ops)",
      "Bonus: e-commerce or ERP integration background",
    ],
    postedAt: "2026-06-20",
  },
  {
    id: "customer-success",
    title: "Customer Success Associate",
    department: "Support",
    location: "Jacksonville, FL (hybrid)",
    type: "Full-time",
    salary: "$48,000 - $62,000",
    remote: false,
    blurb: "Be the human voice for customers after they place an order. Track packages, resolve returns, and turn one-time buyers into repeat customers.",
    responsibilities: [
      "Respond to support tickets, calls, and chats within posted SLAs",
      "Process RMAs, return shipments, and refunds",
      "Coordinate with the warehouse on delayed or damaged shipments",
      "Maintain customer records",
      "Surface recurring issues to engineering and operations",
    ],
    qualifications: [
      "1+ years in customer support, ideally for a parts or e-commerce business",
      "Excellent written communication",
      "Patient and clear on the phone",
      "Experience with help-desk tools",
      "Bonus: prior automotive or diesel-parts experience",
    ],
    postedAt: "2026-06-25",
  },
  {
    id: "fleet-account-manager",
    title: "Fleet Account Manager",
    department: "Sales",
    location: "Remote (US)",
    type: "Full-time",
    salary: "$70,000 - $95,000 + commission",
    remote: true,
    blurb: "Own a book of fleet customers and grow it. You'll be the single point of contact for trucking companies, ag co-ops, and marine operators who buy from us in volume.",
    responsibilities: [
      "Manage an existing book of B2B fleet accounts",
      "Negotiate net-terms pricing and volume discounts",
      "Conduct quarterly business reviews with top accounts",
      "Source new fleet customers through outbound and referrals",
      "Coordinate with operations on dedicated stock for key accounts",
    ],
    qualifications: [
      "3+ years in B2B account management — diesel, parts, or industrial supply preferred",
      "Track record of growing account revenue year-over-year",
      "Comfortable with CRM tooling",
      "Self-directed; thrives without daily supervision",
      "Willing to travel ~20% to visit key accounts",
    ],
    postedAt: "2026-06-26",
  },
];
