export const SITE = {
  name: "Diesel Pro Brands",
  tagline: "America's Parts Professionals",
  description:
    "America's Parts Professionals. Specializing in turbochargers, fuel pumps, fuel injectors, engine parts & more; for agricultural, highway, construction, and marine industries.",
  phone: "(866) 999-4361",
  phoneHref: "tel:+18669994361",
  emailSupport: "support@dieselprobrands.com",
  emailInfo: "info@dieselprobrands.com",
  address: {
    street: "4850 Collins Rd, Suite 103",
    city: "Jacksonville",
    state: "FL",
    zip: "32244",
  },
  hours: "Mon-Fri: 8AM-6PM EST",
} as const;

export type Category = {
  slug: string;
  name: string;
  icon: string;
  count: number;
  group?: "fuel" | "engine" | "turbo" | "electrical" | "cooling";
};

export const CATEGORIES: Category[] = [
  { slug: "turbochargers", name: "Turbochargers", icon: "⚡", count: 342 },
  { slug: "fuel-injectors", name: "Fuel Injectors", icon: "💧", count: 412 },
  { slug: "fuel-pumps", name: "Fuel Pumps", icon: "⛽", count: 289 },
  { slug: "injection-pumps", name: "Injection Pumps", icon: "🔧", count: 156 },
  { slug: "engine-parts", name: "Engine Parts", icon: "⚙️", count: 534 },
  { slug: "alternators", name: "Alternators", icon: "🔋", count: 178 },
  { slug: "starter-motors", name: "Starter Motors", icon: "🔑", count: 203 },
  { slug: "oil-pumps", name: "Oil Pumps", icon: "🛢️", count: 145 },
  { slug: "water-pumps", name: "Water Pumps", icon: "💦", count: 267 },
  { slug: "solenoid-valves", name: "Solenoid Valves", icon: "🎛️", count: 189 },
  { slug: "gaskets-seals", name: "Gaskets & Seals", icon: "🔩", count: 456 },
  { slug: "belts-hoses", name: "Belts & Hoses", icon: "➰", count: 298 },
  { slug: "filters", name: "Filters", icon: "🌬️", count: 0 },
  { slug: "cooling", name: "Cooling Systems", icon: "❄️", count: 0 },
  { slug: "electrical", name: "Electrical", icon: "🔌", count: 0 },
  { slug: "hydraulics", name: "Hydraulics", icon: "💧", count: 0 },
  { slug: "ac-systems", name: "A/C & Climate", icon: "🌬️", count: 0 },
  { slug: "drivetrain", name: "Drivetrain", icon: "⚙️", count: 0 },
];

export type Brand = {
  slug: string;
  name: string;        // short / all-caps display on brand grid
  displayName: string; // proper-case display on product cards (matches Figma)
  category: "Engine Manufacturer" | "Fuel Systems" | "Turbochargers" | "Filters" | "Electrical" | "Cooling" | "Engine Components" | "House Brand";
  country: string;
  founded: number;
  description: string;
  count: number;
  featured: boolean;
  /** Signature brand color used for the fallback wordmark card. */
  color: string;
  /** Officially-recommended domain — used by drop-in logo helpers like /scripts/fetch-brand-logos.mjs. */
  domain?: string;
  /** Override path for the brand logo image. Defaults to /brands/{slug}.png. */
  logoSrc?: string;
};

export const BRANDS: Brand[] = [
  { slug: "dpb",            name: "DPB",         displayName: "Diesel Pro Brands", category: "House Brand",       country: "USA",         founded: 2020, description: "Our in-house line — VGT turbochargers, fuel pumps, fuel injectors, and engine parts engineered to OEM-spec and backed by our 2-year warranty.", count: 0,    featured: true,  color: "#C8102E", domain: "dieselprobrands.com", logoSrc: "/dpb-logo.png" },
  { slug: "cummins",        name: "CUMMINS",     displayName: "Cummins",         category: "Engine Manufacturer", country: "USA",         founded: 1919, description: "World leader in diesel engines and power generation equipment. Known for reliability and innovation in heavy-duty applications.", count: 1247, featured: true,  color: "#C8102E", domain: "cummins.com" },
  { slug: "detroit-diesel", name: "DETROIT",     displayName: "Detroit Diesel",  category: "Engine Manufacturer", country: "USA",         founded: 1938, description: "Premium diesel engines for heavy-duty trucks and industrial applications. Part of Daimler Trucks North America.",          count: 892,  featured: true,  color: "#1F3864", domain: "demanddetroit.com" },
  { slug: "caterpillar",    name: "CAT",         displayName: "Caterpillar",     category: "Engine Manufacturer", country: "USA",         founded: 1925, description: "Global leader in construction and mining equipment, diesel engines, and industrial gas turbines.",                          count: 1456, featured: true,  color: "#FFCD11", domain: "cat.com" },
  { slug: "perkins",        name: "PERKINS",     displayName: "Perkins",         category: "Engine Manufacturer", country: "UK",          founded: 1932, description: "World-renowned diesel engine manufacturer, now part of Caterpillar. Specializes in compact and industrial engines.",          count: 678,  featured: true,  color: "#003B71", domain: "perkins.com" },
  { slug: "volvo-penta",    name: "VOLVO",       displayName: "Volvo Penta",     category: "Engine Manufacturer", country: "Sweden",      founded: 1907, description: "Premium marine and industrial diesel engines known for fuel efficiency and low emissions.",                                  count: 534,  featured: true,  color: "#003057", domain: "volvopenta.com" },
  { slug: "isuzu",          name: "ISUZU",       displayName: "Isuzu",           category: "Engine Manufacturer", country: "Japan",       founded: 1916, description: "Japanese manufacturer specializing in commercial diesel engines and trucks.",                                                count: 445,  featured: false, color: "#D2192C", domain: "isuzu.com" },
  { slug: "yanmar",         name: "YANMAR",      displayName: "Yanmar",          category: "Engine Manufacturer", country: "Japan",       founded: 1912, description: "Compact diesel engines for agricultural, marine, and industrial applications.",                                              count: 389,  featured: false, color: "#E60012", domain: "yanmar.com" },
  { slug: "john-deere",     name: "DEERE",       displayName: "John Deere",      category: "Engine Manufacturer", country: "USA",         founded: 1837, description: "Agricultural and construction equipment with proprietary diesel engines.",                                                    count: 567,  featured: true,  color: "#367C2B", domain: "deere.com" },
  // Additional engine manufacturers we carry parts for — logos shipped, product
  // counts will populate as inventory lands. Kept featured: false so the
  // homepage "Trusted Brands" top-12 grid stays anchored on well-stocked
  // brands; they all still show on /brands.
  { slug: "cnh",            name: "CNH",         displayName: "CNH Industrial", category: "Engine Manufacturer", country: "UK",          founded: 2013, description: "Case IH, New Holland, and STEYR — agricultural and construction equipment with FPT Industrial diesel engines.",              count: 0,    featured: false, color: "#E2231A", domain: "cnhindustrial.com" },
  { slug: "deutz",          name: "DEUTZ",       displayName: "Deutz",          category: "Engine Manufacturer", country: "Germany",     founded: 1864, description: "One of the world's oldest internal-combustion engine makers — industrial diesel and gas engines for construction, agriculture, and stationary power.", count: 0, featured: false, color: "#0F6AB4", domain: "deutz.com" },
  { slug: "doosan",         name: "DOOSAN",      displayName: "Doosan",         category: "Engine Manufacturer", country: "South Korea", founded: 1937, description: "Doosan Infracore diesel engines and construction equipment — excavators, wheel loaders, and industrial powertrains.",         count: 0,    featured: false, color: "#FFC72C", domain: "doosanequipment.com" },
  { slug: "fuso",           name: "FUSO",        displayName: "Mitsubishi Fuso", category: "Engine Manufacturer", country: "Japan",       founded: 1932, description: "Medium- and heavy-duty commercial trucks and buses, part of the Daimler Truck group.",                                       count: 0,    featured: false, color: "#E50012", domain: "mitfuso.com" },
  { slug: "gm",             name: "GM",          displayName: "General Motors", category: "Engine Manufacturer", country: "USA",         founded: 1908, description: "Duramax diesel engines and GM heavy-duty powertrains.",                                                                       count: 0,    featured: false, color: "#005DAA", domain: "gm.com" },
  { slug: "iveco",          name: "IVECO",       displayName: "Iveco",          category: "Engine Manufacturer", country: "Italy",       founded: 1975, description: "Italian commercial vehicle manufacturer producing trucks, buses, and FPT diesel engines.",                                   count: 0,    featured: false, color: "#003E7E", domain: "iveco.com" },
  { slug: "kobelco",        name: "KOBELCO",     displayName: "Kobelco",        category: "Engine Manufacturer", country: "Japan",       founded: 1959, description: "Construction machinery — excavators and cranes with high-efficiency diesel engines.",                                        count: 0,    featured: false, color: "#FFC72C", domain: "kobelco-kenki.co.jp" },
  { slug: "komatsu",        name: "KOMATSU",     displayName: "Komatsu",        category: "Engine Manufacturer", country: "Japan",       founded: 1921, description: "Global construction, mining, and forestry equipment with proprietary diesel powertrains.",                                  count: 0,    featured: false, color: "#FFB81C", domain: "komatsu.com" },
  { slug: "kubota",         name: "KUBOTA",      displayName: "Kubota",         category: "Engine Manufacturer", country: "Japan",       founded: 1890, description: "Compact tractors, construction equipment, and one of the world's largest builders of under-100-hp diesel engines.",         count: 0,    featured: false, color: "#FF7900", domain: "kubota.com" },
  { slug: "mack-volvo",     name: "MACK / VOLVO", displayName: "Mack / Volvo Trucks", category: "Engine Manufacturer", country: "USA / Sweden", founded: 1900, description: "Volvo Group heavy-duty truck brands — MP and D-series diesel engines for Class 8 highway and vocational work.",          count: 0,    featured: false, color: "#003057", domain: "macktrucks.com" },
  { slug: "mercedes-benz",  name: "MERCEDES",    displayName: "Mercedes-Benz",  category: "Engine Manufacturer", country: "Germany",     founded: 1926, description: "Daimler commercial diesel engines for trucks, buses, and industrial power.",                                                 count: 0,    featured: false, color: "#00ADEF", domain: "mercedes-benz.com" },
  { slug: "navistar",       name: "NAVISTAR",    displayName: "Navistar International", category: "Engine Manufacturer", country: "USA", founded: 1986, description: "International-brand heavy- and medium-duty trucks and diesel engines.",                                                  count: 0,    featured: false, color: "#0033A0", domain: "internationaltrucks.com" },
  { slug: "nissan",         name: "NISSAN",      displayName: "Nissan",         category: "Engine Manufacturer", country: "Japan",       founded: 1933, description: "Nissan UD and industrial diesel engines for commercial and stationary applications.",                                      count: 0,    featured: false, color: "#C3002F", domain: "nissan-global.com" },
  { slug: "paccar",         name: "PACCAR",      displayName: "PACCAR",         category: "Engine Manufacturer", country: "USA",         founded: 1905, description: "Parent of Peterbilt, Kenworth, and DAF — MX-series heavy-duty diesel engines.",                                               count: 0,    featured: false, color: "#003876", domain: "paccar.com" },
  { slug: "scania",         name: "SCANIA",      displayName: "Scania",         category: "Engine Manufacturer", country: "Sweden",      founded: 1891, description: "Heavy-truck, bus, and industrial diesel engines known for modular design and durability.",                                  count: 0,    featured: false, color: "#003B6F", domain: "scania.com" },
  { slug: "toyota",         name: "TOYOTA",      displayName: "Toyota",         category: "Engine Manufacturer", country: "Japan",       founded: 1937, description: "Toyota industrial diesel — forklifts, generators, and commercial powertrains.",                                              count: 0,    featured: false, color: "#EB0A1E", domain: "toyota.com" },
  { slug: "bosch",          name: "BOSCH",       displayName: "Bosch",           category: "Fuel Systems",        country: "Germany",     founded: 1886, description: "Global leader in diesel fuel injection systems, pumps, and automotive technology.",                                          count: 2134, featured: true,  color: "#ED1C24", domain: "bosch.com" },
  { slug: "delphi",         name: "DELPHI",      displayName: "Delphi",          category: "Fuel Systems",        country: "UK",          founded: 1994, description: "Advanced fuel injection systems and diesel aftertreatment solutions.",                                                       count: 1567, featured: true,  color: "#FBB034", domain: "delphi.com" },
  { slug: "denso",          name: "DENSO",       displayName: "Denso",           category: "Fuel Systems",        country: "Japan",       founded: 1949, description: "Japanese manufacturer of advanced automotive technology and diesel systems.",                                                count: 1234, featured: true,  color: "#E60012", domain: "denso.com" },
  { slug: "stanadyne",      name: "STANADYNE",   displayName: "Stanadyne",       category: "Fuel Systems",        country: "USA",         founded: 1989, description: "Precision fuel injection systems and diesel performance products.",                                                          count: 876,  featured: false, color: "#0F2C5C", domain: "stanadyne.com" },
  { slug: "garrett",        name: "GARRETT",     displayName: "Garrett Motion",  category: "Turbochargers",       country: "Switzerland", founded: 1954, description: "World leader in turbocharger technology for diesel and gasoline engines.",                                                  count: 1789, featured: true,  color: "#0033A0", domain: "garrettmotion.com" },
  { slug: "borgwarner",     name: "BORGWARNER",  displayName: "BorgWarner",      category: "Turbochargers",       country: "USA",         founded: 1928, description: "Advanced turbocharging systems and engine performance technologies.",                                                        count: 1456, featured: true,  color: "#005DAA", domain: "borgwarner.com" },
  { slug: "holset",         name: "HOLSET",      displayName: "Holset",          category: "Turbochargers",       country: "UK",          founded: 1952, description: "Heavy-duty turbochargers for commercial vehicles, now part of Cummins.",                                                     count: 945,  featured: true,  color: "#C8102E", domain: "holset.co.uk" },
  { slug: "ihi",            name: "IHI",         displayName: "IHI",             category: "Turbochargers",       country: "Japan",       founded: 1853, description: "Japanese turbocharger manufacturer known for quality and performance.",                                                      count: 678,  featured: false, color: "#003F7F", domain: "ihi.co.jp" },
  { slug: "donaldson",      name: "DONALDSON",   displayName: "Donaldson",       category: "Filters",             country: "USA",         founded: 1915, description: "Premier filtration solutions for diesel engines and industrial applications.",                                               count: 2345, featured: true,  color: "#00529B", domain: "donaldson.com" },
  { slug: "fleetguard",     name: "FLEETGUARD",  displayName: "Fleetguard",      category: "Filters",             country: "USA",         founded: 1958, description: "Cummins filtration brand offering premium filters for heavy-duty applications.",                                             count: 1987, featured: true,  color: "#C8102E", domain: "fleetguard.com" },
  { slug: "baldwin",        name: "BALDWIN",     displayName: "Baldwin",         category: "Filters",             country: "USA",         founded: 1936, description: "Heavy-duty filtration products for diesel engines and equipment.",                                                            count: 1678, featured: true,  color: "#003876", domain: "baldwinfilters.com" },
  { slug: "mann-hummel",    name: "MANN+HUMMEL", displayName: "Mann+Hummel",     category: "Filters",             country: "Germany",     founded: 1941, description: "German filtration specialist with advanced air and fuel filter technology.",                                                 count: 1543, featured: false, color: "#FFCC00", domain: "mann-hummel.com" },
  { slug: "wix",            name: "WIX",         displayName: "WIX",             category: "Filters",             country: "USA",         founded: 1939, description: "Comprehensive filtration solutions for automotive and industrial applications.",                                            count: 1432, featured: false, color: "#E03C31", domain: "wixfilters.com" },
  { slug: "delco-remy",     name: "DELCO REMY",  displayName: "Delco Remy",      category: "Electrical",          country: "USA",         founded: 1896, description: "Heavy-duty starters, alternators, and electrical components.",                                                               count: 1234, featured: true,  color: "#003876", domain: "delcoremy.com" },
  { slug: "prestolite",     name: "PRESTOLITE",  displayName: "Prestolite",      category: "Electrical",          country: "USA",         founded: 1911, description: "Premium electrical components for heavy-duty vehicles and equipment.",                                                       count: 987,  featured: false, color: "#FFB81C", domain: "prestolite.com" },
  { slug: "modine",         name: "MODINE",      displayName: "Modine",          category: "Cooling",             country: "USA",         founded: 1916, description: "Thermal management solutions including radiators and charge air coolers.",                                                   count: 876,  featured: true,  color: "#00B5E2", domain: "modine.com" },
  { slug: "behr",           name: "BEHR",        displayName: "Behr",            category: "Cooling",             country: "Germany",     founded: 1905, description: "Engine cooling and air conditioning systems for commercial vehicles.",                                                       count: 765,  featured: false, color: "#0099CC", domain: "mahle.com" },
  { slug: "dayco",          name: "DAYCO",       displayName: "Dayco",           category: "Engine Components",   country: "USA",         founded: 1905, description: "Belt drive systems, timing belts, and engine components.",                                                                   count: 1345, featured: true,  color: "#1A1A1A", domain: "dayco.com" },
  { slug: "gates",          name: "GATES",       displayName: "Gates",           category: "Engine Components",   country: "USA",         founded: 1911, description: "Power transmission and fluid power products for diesel engines.",                                                           count: 1278, featured: true,  color: "#FFC107", domain: "gates.com" },
  { slug: "mahle",          name: "MAHLE",       displayName: "MAHLE",           category: "Engine Components",   country: "Germany",     founded: 1920, description: "Pistons, engine bearings, and filtration systems for diesel engines.",                                                       count: 2156, featured: true,  color: "#E2001A", domain: "mahle.com" },
  { slug: "federal-mogul",  name: "FEDERAL-MOGUL", displayName: "Federal-Mogul", category: "Engine Components",   country: "USA",         founded: 1899, description: "Engine bearings, pistons, and sealing systems.",                                                                             count: 1876, featured: false, color: "#003876", domain: "tenneco.com" },
];

/**
 * Slugs whose real logo art lives at /public/brands/{slug}.png (plus DPB which
 * uses its own logoSrc). Used by the homepage Trusted Brands grid so it only
 * surfaces brands with real logos — the text-wordmark fallback isn't great to
 * mix in alongside real marks.
 *
 * Keep in sync with the files in /public/brands/. The convert-brand-logos.mjs
 * script writes the files; update this set when you add or remove logos.
 */
const BRANDS_WITH_LOGO = new Set<string>([
  "dpb",
  "bosch", "caterpillar", "cummins", "denso", "detroit-diesel", "isuzu",
  "john-deere", "perkins", "yanmar",
  "cnh", "deutz", "doosan", "fuso", "gm", "iveco", "kobelco", "komatsu",
  "kubota", "mack-volvo", "mercedes-benz", "navistar", "nissan", "paccar",
  "scania", "toyota",
]);

export function hasBrandLogo(brand: Pick<Brand, "slug" | "logoSrc">): boolean {
  return Boolean(brand.logoSrc) || BRANDS_WITH_LOGO.has(brand.slug);
}

export const BRAND_CATEGORY_FILTERS = [
  "All Brands",
  "House Brand",
  "Engine Manufacturer",
  "Fuel Systems",
  "Turbochargers",
  "Filters",
  "Electrical",
  "Cooling",
  "Engine Components",
] as const;

export const FOOTER_LINKS = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "All Brands", href: "/brands" },
    { label: "Turbochargers", href: "/shop?category=turbochargers" },
    { label: "Fuel Injectors", href: "/shop?category=fuel-injectors" },
    { label: "Fuel Pumps", href: "/shop?category=fuel-pumps" },
    { label: "Injection Pumps", href: "/shop?category=injection-pumps" },
    { label: "Engine Parts", href: "/shop?category=engine-parts" },
    { label: "Alternators", href: "/shop?category=alternators" },
    { label: "Starter Motors", href: "/shop?category=starter-motors" },
  ],
  support: [
    { label: "Help & Support", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Returns & Warranty", href: "/returns-warranty" },
    { label: "Track Order", href: "/track-order" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};
