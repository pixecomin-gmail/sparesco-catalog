export type FeaturedCollection = {
  title: string;
  description: string;
  href: string;
  svg: string;
};

export type SidebarGroup = {
  title: string;
  items: { name: string; count: string; href: string }[];
};

export type CollectionItem = {
  name: string;
  meta: string;
  href: string;
  svg: string;
};

export type CollectionSection = {
  slug: string;
  title: string;
  count: number;
  collections: CollectionItem[];
};

export const featuredCollections: FeaturedCollection[] = [
  {
    "title": "Complete Filter Solutions",
    "description": "Hydraulic, oil, air and process filters for all major equipment brands. OEM and aftermarket options.",
    "href": "#",
    "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"28\" rx=\"3\" width=\"24\" x=\"8\" y=\"6\"></rect> <line x1=\"8\" x2=\"32\" y1=\"14\" y2=\"14\"></line> <line x1=\"14\" x2=\"26\" y1=\"20\" y2=\"20\"></line> <line x1=\"14\" x2=\"22\" y1=\"24\" y2=\"24\"></line> <path d=\"M28 30 L32 30 M30 28 L32 30 L30 32\"></path> </svg>"
  },
  {
    "title": "Hydraulic Systems",
    "description": "Pumps, motors, cylinders, valves and hose assemblies for construction and mining equipment.",
    "href": "#",
    "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M20 6 L20 14\"></path> <path d=\"M12 10 L28 10\"></path> <rect height=\"20\" rx=\"3\" width=\"20\" x=\"10\" y=\"14\"></rect> <line x1=\"10\" x2=\"30\" y1=\"20\" y2=\"20\"></line> <line x1=\"16\" x2=\"24\" y1=\"24\" y2=\"24\"></line> <line x1=\"16\" x2=\"20\" y1=\"28\" y2=\"28\"></line> </svg>"
  }
];

export const sidebarGroups: SidebarGroup[] = [
  {
    "title": "By Equipment",
    "items": [
      {
        "name": "Excavators",
        "count": "8",
        "href": "#"
      },
      {
        "name": "Bulldozers",
        "count": "6",
        "href": "#"
      },
      {
        "name": "Loaders",
        "count": "5",
        "href": "#"
      },
      {
        "name": "Cranes",
        "count": "4",
        "href": "#"
      },
      {
        "name": "Dump Trucks",
        "count": "4",
        "href": "#"
      },
      {
        "name": "Graders",
        "count": "3",
        "href": "#"
      },
      {
        "name": "Rollers",
        "count": "3",
        "href": "#"
      },
      {
        "name": "Drilling Rigs",
        "count": "2",
        "href": "#"
      }
    ]
  },
  {
    "title": "By Brand",
    "items": [
      {
        "name": "Caterpillar",
        "count": "12",
        "href": "#"
      },
      {
        "name": "Komatsu",
        "count": "9",
        "href": "#"
      },
      {
        "name": "Volvo",
        "count": "7",
        "href": "#"
      },
      {
        "name": "Hitachi",
        "count": "5",
        "href": "#"
      },
      {
        "name": "JCB",
        "count": "4",
        "href": "#"
      },
      {
        "name": "XCMG",
        "count": "3",
        "href": "#"
      }
    ]
  },
  {
    "title": "By Part Type",
    "items": [
      {
        "name": "Filters",
        "count": "12",
        "href": "#"
      },
      {
        "name": "Hydraulic",
        "count": "8",
        "href": "#"
      },
      {
        "name": "Electrical",
        "count": "7",
        "href": "#"
      },
      {
        "name": "Engine",
        "count": "6",
        "href": "#"
      },
      {
        "name": "Undercarriage",
        "count": "5",
        "href": "#"
      }
    ]
  }
];

export const collectionSections: CollectionSection[] = [
  {
    "slug": "filters",
    "title": "Filters",
    "count": 12,
    "collections": [
      {
        "name": "Hydraulic Filters",
        "meta": "1,240 parts",
        "href": "/collections/hydraulic-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"3\" width=\"16\" x=\"12\" y=\"8\"></rect> <rect height=\"4\" rx=\"1\" width=\"20\" x=\"10\" y=\"6\"></rect> <rect height=\"4\" rx=\"1\" width=\"20\" x=\"10\" y=\"30\"></rect> <path d=\"M18 16 L22 16 M20 14 L22 16 L20 18\"></path> <path d=\"M18 22 L22 22 M20 20 L22 22 L20 24\"></path> </svg>"
      },
      {
        "name": "Oil Filters",
        "meta": "856 parts",
        "href": "/collections/oil-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"4\" width=\"16\" x=\"12\" y=\"8\"></rect> <path d=\"M12 12 Q20 4 28 12\"></path> <path d=\"M20 18 Q24 22 24 26 Q24 32 20 32 Q16 32 16 26 Q16 22 20 18\"></path> <line x1=\"14\" x2=\"26\" y1=\"30\" y2=\"30\"></line> </svg>"
      },
      {
        "name": "Compressed Air Filters",
        "meta": "432 parts",
        "href": "/collections/compressed-air-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"3\" width=\"12\" x=\"14\" y=\"8\"></rect> <rect height=\"5\" rx=\"1\" width=\"8\" x=\"8\" y=\"12\"></rect> <rect height=\"5\" rx=\"1\" width=\"8\" x=\"24\" y=\"12\"></rect> <circle cx=\"20\" cy=\"22\" r=\"5\"></circle> <line x1=\"20\" x2=\"23\" y1=\"22\" y2=\"19\"></line> </svg>"
      },
      {
        "name": "Process Filters",
        "meta": "328 parts",
        "href": "/collections/process-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"2\" width=\"20\" x=\"10\" y=\"8\"></rect> <rect height=\"6\" rx=\"1\" width=\"6\" x=\"6\" y=\"12\"></rect> <rect height=\"6\" rx=\"1\" width=\"6\" x=\"28\" y=\"12\"></rect> <rect height=\"10\" rx=\"1\" width=\"12\" x=\"14\" y=\"18\"></rect> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"28\"></line> <line x1=\"20\" x2=\"20\" y1=\"18\" y2=\"28\"></line> <line x1=\"24\" x2=\"24\" y1=\"18\" y2=\"28\"></line> </svg>"
      },
      {
        "name": "Air Filters",
        "meta": "1,156 parts",
        "href": "/collections/air-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"2\" width=\"24\" x=\"8\" y=\"8\"></rect> <rect height=\"16\" rx=\"1\" width=\"16\" x=\"12\" y=\"12\"></rect> <path d=\"M12 12 L16 20 L12 28\"></path> <path d=\"M18 12 L22 20 L18 28\"></path> <path d=\"M24 12 L28 20 L24 28\"></path> </svg>"
      },
      {
        "name": "Argo Hytos",
        "meta": "Premium brand",
        "href": "/collections/argo-hytos",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"4\" width=\"16\" x=\"12\" y=\"8\"></rect> <rect height=\"6\" rx=\"2\" width=\"12\" x=\"14\" y=\"4\"></rect> <rect height=\"6\" rx=\"2\" width=\"12\" x=\"14\" y=\"30\"></rect> <circle cx=\"20\" cy=\"20\" r=\"6\"></circle> <path d=\"M20 15 L21.5 18.5 L25 18.5 L22.5 21 L23.5 24.5 L20 22.5 L16.5 24.5 L17.5 21 L15 18.5 L18.5 18.5 Z\"></path> </svg>"
      },
      {
        "name": "SF Filter",
        "meta": "OEM quality",
        "href": "/collections/sf-filter",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"4\" width=\"16\" x=\"12\" y=\"8\"></rect> <rect height=\"6\" rx=\"1\" width=\"8\" x=\"16\" y=\"4\"></rect> <rect height=\"6\" rx=\"2\" width=\"20\" x=\"10\" y=\"30\"></rect> <circle cx=\"15\" cy=\"33\" fill=\"white\" r=\"1.5\"></circle> <circle cx=\"20\" cy=\"33\" fill=\"white\" r=\"1.5\"></circle> <circle cx=\"25\" cy=\"33\" fill=\"white\" r=\"1.5\"></circle> <path d=\"M14 16 L18 16 M14 16 L14 20 M14 18 L17 18\"></path> <path d=\"M22 16 L26 16 M22 16 L22 20 M22 18 L25 18 M22 20 L26 20\"></path> </svg>"
      },
      {
        "name": "Hypro",
        "meta": "High pressure",
        "href": "/collections/hypro",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"3\" width=\"16\" x=\"12\" y=\"8\"></rect> <rect height=\"5\" rx=\"1\" width=\"8\" x=\"6\" y=\"12\"></rect> <rect height=\"5\" rx=\"1\" width=\"8\" x=\"26\" y=\"12\"></rect> <rect height=\"6\" rx=\"1\" width=\"8\" x=\"16\" y=\"20\"></rect> <line x1=\"18\" x2=\"22\" y1=\"23\" y2=\"23\"></line> <rect height=\"4\" rx=\"1\" width=\"12\" x=\"14\" y=\"28\"></rect> </svg>"
      },
      {
        "name": "Fuel Filters",
        "meta": "684 parts",
        "href": "/collections/fuel-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"2\" width=\"20\" x=\"10\" y=\"8\"></rect> <circle cx=\"14\" cy=\"14\" r=\"2\"></circle> <circle cx=\"20\" cy=\"14\" r=\"2\"></circle> <circle cx=\"26\" cy=\"14\" r=\"2\"></circle> <line x1=\"10\" x2=\"30\" y1=\"20\" y2=\"20\"></line> <line x1=\"14\" x2=\"26\" y1=\"24\" y2=\"24\"></line> <line x1=\"14\" x2=\"22\" y1=\"28\" y2=\"28\"></line> </svg>"
      },
      {
        "name": "Coolant Filters",
        "meta": "312 parts",
        "href": "/collections/coolant-filters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"28\" rx=\"3\" width=\"16\" x=\"12\" y=\"6\"></rect> <line x1=\"12\" x2=\"28\" y1=\"12\" y2=\"12\"></line> <line x1=\"12\" x2=\"28\" y1=\"28\" y2=\"28\"></line> <path d=\"M16 16 L20 20 L16 24\"></path> <path d=\"M22 16 L22 24\"></path> </svg>"
      },
      {
        "name": "Filter Housings",
        "meta": "156 parts",
        "href": "/collections/filter-housings",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <circle cx=\"20\" cy=\"20\" r=\"12\"></circle> <circle cx=\"20\" cy=\"20\" r=\"6\"></circle> <line x1=\"20\" x2=\"20\" y1=\"8\" y2=\"12\"></line> <line x1=\"20\" x2=\"20\" y1=\"28\" y2=\"32\"></line> <line x1=\"8\" x2=\"12\" y1=\"20\" y2=\"20\"></line> <line x1=\"28\" x2=\"32\" y1=\"20\" y2=\"20\"></line> </svg>"
      },
      {
        "name": "Filter Kits",
        "meta": "89 sets",
        "href": "/collections/filter-kits",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"20\" rx=\"2\" width=\"24\" x=\"8\" y=\"10\"></rect> <line x1=\"8\" x2=\"32\" y1=\"16\" y2=\"16\"></line> <line x1=\"8\" x2=\"32\" y1=\"24\" y2=\"24\"></line> <circle cx=\"14\" cy=\"20\" r=\"2\"></circle> <circle cx=\"20\" cy=\"20\" r=\"2\"></circle> <circle cx=\"26\" cy=\"20\" r=\"2\"></circle> </svg>"
      }
    ]
  },
  {
    "slug": "hydraulics",
    "title": "Hydraulics",
    "count": 8,
    "collections": [
      {
        "name": "Hydraulic Pumps",
        "meta": "2,340 parts",
        "href": "/collections/hydraulic-pumps",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"3\" width=\"20\" x=\"10\" y=\"8\"></rect> <circle cx=\"20\" cy=\"14\" r=\"3\"></circle> <path d=\"M20 17 L20 24\"></path> <path d=\"M16 24 L24 24\"></path> <path d=\"M14 28 L26 28\"></path> </svg>"
      },
      {
        "name": "Hydraulic Motors",
        "meta": "1,128 parts",
        "href": "/collections/hydraulic-motors",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"20\" rx=\"3\" width=\"16\" x=\"12\" y=\"10\"></rect> <circle cx=\"20\" cy=\"16\" r=\"3\"></circle> <path d=\"M16 22 L24 22\"></path> <path d=\"M18 26 L22 26\"></path> </svg>"
      },
      {
        "name": "Hydraulic Cylinders",
        "meta": "856 parts",
        "href": "/collections/hydraulic-cylinders",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"28\" rx=\"2\" width=\"12\" x=\"14\" y=\"6\"></rect> <rect height=\"8\" rx=\"1\" width=\"4\" x=\"10\" y=\"10\"></rect> <rect height=\"8\" rx=\"1\" width=\"4\" x=\"26\" y=\"10\"></rect> <line x1=\"20\" x2=\"20\" y1=\"6\" y2=\"2\"></line> <line x1=\"20\" x2=\"20\" y1=\"34\" y2=\"38\"></line> </svg>"
      },
      {
        "name": "Control Valves",
        "meta": "1,432 parts",
        "href": "/collections/control-valves",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"16\" rx=\"2\" width=\"20\" x=\"10\" y=\"12\"></rect> <rect height=\"6\" rx=\"1\" width=\"12\" x=\"14\" y=\"8\"></rect> <rect height=\"6\" rx=\"1\" width=\"12\" x=\"14\" y=\"26\"></rect> <circle cx=\"16\" cy=\"20\" r=\"2\"></circle> <circle cx=\"24\" cy=\"20\" r=\"2\"></circle> <line x1=\"16\" x2=\"24\" y1=\"20\" y2=\"20\"></line> </svg>"
      },
      {
        "name": "Hose Assemblies",
        "meta": "3,240 parts",
        "href": "/collections/hose-assemblies",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M8 20 Q8 12 14 12 L26 12 Q32 12 32 20 Q32 28 26 28 L14 28 Q8 28 8 20\"></path> <path d=\"M14 20 L26 20\"></path> <circle cx=\"14\" cy=\"20\" r=\"2\"></circle> <circle cx=\"26\" cy=\"20\" r=\"2\"></circle> </svg>"
      },
      {
        "name": "Quick Couplings",
        "meta": "567 parts",
        "href": "/collections/quick-couplings",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <circle cx=\"20\" cy=\"14\" r=\"6\"></circle> <path d=\"M14 20 L14 32 Q14 36 20 36 Q26 36 26 32 L26 20\"></path> <line x1=\"18\" x2=\"22\" y1=\"28\" y2=\"28\"></line> </svg>"
      },
      {
        "name": "Seal Kits",
        "meta": "1,890 parts",
        "href": "/collections/seal-kits",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"2\" width=\"16\" x=\"12\" y=\"8\"></rect> <line x1=\"12\" x2=\"28\" y1=\"14\" y2=\"14\"></line> <line x1=\"12\" x2=\"28\" y1=\"26\" y2=\"26\"></line> <path d=\"M16 18 L16 22\"></path> <path d=\"M20 18 L20 22\"></path> <path d=\"M24 18 L24 22\"></path> </svg>"
      },
      {
        "name": "Hydraulic Tanks",
        "meta": "234 parts",
        "href": "/collections/hydraulic-tanks",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"20\" rx=\"2\" width=\"20\" x=\"10\" y=\"10\"></rect> <circle cx=\"20\" cy=\"20\" r=\"4\"></circle> <path d=\"M20 16 L20 10\"></path> <path d=\"M20 24 L20 30\"></path> <path d=\"M16 20 L10 20\"></path> <path d=\"M24 20 L30 20\"></path> </svg>"
      }
    ]
  },
  {
    "slug": "electrical",
    "title": "Electrical",
    "count": 7,
    "collections": [
      {
        "name": "Sensors",
        "meta": "2,156 parts",
        "href": "/collections/sensors",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M22 8 L16 20 L22 20 L18 32\"></path> <path d=\"M12 14 L8 14\"></path> <path d=\"M12 20 L8 20\"></path> <path d=\"M12 26 L8 26\"></path> </svg>"
      },
      {
        "name": "Controllers",
        "meta": "876 parts",
        "href": "/collections/controllers",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"20\" rx=\"2\" width=\"16\" x=\"12\" y=\"8\"></rect> <line x1=\"16\" x2=\"24\" y1=\"14\" y2=\"14\"></line> <line x1=\"16\" x2=\"22\" y1=\"18\" y2=\"18\"></line> <line x1=\"16\" x2=\"20\" y1=\"22\" y2=\"22\"></line> <path d=\"M16 28 L16 34 M20 28 L20 34 M24 28 L24 34\"></path> </svg>"
      },
      {
        "name": "Switches",
        "meta": "1,432 parts",
        "href": "/collections/switches",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <circle cx=\"20\" cy=\"12\" r=\"4\"></circle> <path d=\"M20 16 L20 24\"></path> <path d=\"M14 24 L26 24\"></path> <path d=\"M12 28 L14 24 L16 28\"></path> <path d=\"M24 28 L26 24 L28 28\"></path> </svg>"
      },
      {
        "name": "Alternators",
        "meta": "534 parts",
        "href": "/collections/alternators",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"16\" rx=\"2\" width=\"20\" x=\"10\" y=\"12\"></rect> <line x1=\"10\" x2=\"30\" y1=\"18\" y2=\"18\"></line> <line x1=\"14\" x2=\"18\" y1=\"22\" y2=\"22\"></line> <circle cx=\"22\" cy=\"22\" r=\"1.5\"></circle> <circle cx=\"26\" cy=\"22\" r=\"1.5\"></circle> </svg>"
      },
      {
        "name": "Starters",
        "meta": "678 parts",
        "href": "/collections/starters",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"20\" rx=\"2\" width=\"12\" x=\"14\" y=\"8\"></rect> <line x1=\"14\" x2=\"26\" y1=\"14\" y2=\"14\"></line> <line x1=\"14\" x2=\"26\" y1=\"22\" y2=\"22\"></line> <path d=\"M18 28 L18 34\"></path> <path d=\"M22 28 L22 34\"></path> </svg>"
      },
      {
        "name": "Wiring Harnesses",
        "meta": "1,234 parts",
        "href": "/collections/wiring-harnesses",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M10 14 L30 14 L30 26 L10 26 Z\"></path> <path d=\"M14 18 L18 22 L14 26\"></path> <path d=\"M22 18 L26 22 L22 26\"></path> </svg>"
      },
      {
        "name": "Gauges & Monitors",
        "meta": "445 parts",
        "href": "/collections/gauges-and-monitors",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <circle cx=\"20\" cy=\"20\" r=\"10\"></circle> <circle cx=\"20\" cy=\"20\" r=\"4\"></circle> <path d=\"M20 10 L20 14\"></path> <path d=\"M20 26 L20 30\"></path> <path d=\"M10 20 L14 20\"></path> <path d=\"M26 20 L30 20\"></path> </svg>"
      }
    ]
  },
  {
    "slug": "engine",
    "title": "Engine",
    "count": 5,
    "collections": [
      {
        "name": "Pistons & Rings",
        "meta": "1,876 parts",
        "href": "/collections/pistons-and-rings",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"16\" rx=\"2\" width=\"20\" x=\"10\" y=\"10\"></rect> <circle cx=\"16\" cy=\"18\" r=\"3\"></circle> <circle cx=\"24\" cy=\"18\" r=\"3\"></circle> <line x1=\"16\" x2=\"16\" y1=\"26\" y2=\"32\"></line> <line x1=\"24\" x2=\"24\" y1=\"26\" y2=\"32\"></line> <line x1=\"12\" x2=\"28\" y1=\"32\" y2=\"32\"></line> </svg>"
      },
      {
        "name": "Gaskets & Seals",
        "meta": "3,240 parts",
        "href": "/collections/gaskets-and-seals",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M12 12 L28 12 L28 28 L12 28 Z\"></path> <path d=\"M12 16 L28 16\"></path> <path d=\"M12 24 L28 24\"></path> <circle cx=\"16\" cy=\"20\" r=\"2\"></circle> <circle cx=\"24\" cy=\"20\" r=\"2\"></circle> </svg>"
      },
      {
        "name": "Bearings",
        "meta": "2,567 parts",
        "href": "/collections/bearings",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <circle cx=\"20\" cy=\"20\" r=\"12\"></circle> <path d=\"M20 8 L20 12\"></path> <path d=\"M20 28 L20 32\"></path> <path d=\"M8 20 L12 20\"></path> <path d=\"M28 20 L32 20\"></path> <path d=\"M12 12 L15 15\"></path> <path d=\"M28 28 L25 25\"></path> <path d=\"M12 28 L15 25\"></path> <path d=\"M28 12 L25 15\"></path> </svg>"
      },
      {
        "name": "Belts & Pulleys",
        "meta": "1,098 parts",
        "href": "/collections/belts-and-pulleys",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M10 20 Q10 10 20 10 Q30 10 30 20 Q30 30 20 30 Q10 30 10 20\"></path> <path d=\"M14 20 Q14 14 20 14 Q26 14 26 20 Q26 26 20 26 Q14 26 14 20\"></path> <path d=\"M18 20 L22 20\"></path> </svg>"
      },
      {
        "name": "Radiators",
        "meta": "456 parts",
        "href": "/collections/radiators",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"24\" rx=\"3\" width=\"16\" x=\"12\" y=\"8\"></rect> <line x1=\"12\" x2=\"28\" y1=\"14\" y2=\"14\"></line> <line x1=\"12\" x2=\"28\" y1=\"26\" y2=\"26\"></line> <path d=\"M16 18 L16 22\"></path> <path d=\"M20 18 L20 22\"></path> <path d=\"M24 18 L24 22\"></path> </svg>"
      }
    ]
  },
  {
    "slug": "undercarriage",
    "title": "Undercarriage",
    "count": 3,
    "collections": [
      {
        "name": "Track Chains",
        "meta": "1,234 parts",
        "href": "/collections/track-chains",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <ellipse cx=\"20\" cy=\"20\" rx=\"14\" ry=\"10\"></ellipse> <ellipse cx=\"20\" cy=\"20\" rx=\"8\" ry=\"5\"></ellipse> <circle cx=\"12\" cy=\"20\" r=\"2\"></circle> <circle cx=\"28\" cy=\"20\" r=\"2\"></circle> </svg>"
      },
      {
        "name": "Rollers & Idlers",
        "meta": "876 parts",
        "href": "/collections/rollers-and-idlers",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <rect height=\"12\" rx=\"2\" width=\"20\" x=\"10\" y=\"14\"></rect> <circle cx=\"16\" cy=\"20\" r=\"3\"></circle> <circle cx=\"24\" cy=\"20\" r=\"3\"></circle> <line x1=\"16\" x2=\"16\" y1=\"14\" y2=\"10\"></line> <line x1=\"24\" x2=\"24\" y1=\"14\" y2=\"10\"></line> </svg>"
      },
      {
        "name": "Sprockets",
        "meta": "567 parts",
        "href": "/collections/sprockets",
        "svg": "<svg fill=\"none\" stroke=\"white\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 40 40\"> <path d=\"M10 20 L14 14 L20 14 L24 20 L20 26 L14 26 Z\"></path> <path d=\"M24 20 L30 20\"></path> <path d=\"M10 20 L6 20\"></path> </svg>"
      }
    ]
  }
];
