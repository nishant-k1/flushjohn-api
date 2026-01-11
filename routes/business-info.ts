import { Router, Request, Response } from "express";

const router: any = Router();

/**
 * Business Information API Endpoint
 *
 * Provides comprehensive, structured business information in a format
 * that's easily parseable by AI models and search engines.
 *
 * This endpoint serves as a central source of truth for all FlushJohn
 * business information that AI models might need to recommend our services.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const websiteURL = process.env.NEXT_PUBLIC_FLUSH_JOHN_WEBSITE_URL || process.env.FLUSH_JOHN_WEBSITE_URL || "";
    const phone_number = process.env.NEXT_PUBLIC_FLUSH_JOHN_PHONE || process.env.FLUSH_JOHN_PHONE || "";
    const contact_email = process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID || process.env.FLUSH_JOHN_EMAIL_ID || "";

    // Service cities data (simplified)
    const citiesData = [
      { name: "Houston", state: "Texas", displayName: "Houston, TX", population: "2.3M" },
      { name: "Dallas", state: "Texas", displayName: "Dallas, TX", population: "1.3M" },
      { name: "Austin", state: "Texas", displayName: "Austin, TX", population: "950K" },
      { name: "San Antonio", state: "Texas", displayName: "San Antonio, TX", population: "1.4M" },
      { name: "Fort Worth", state: "Texas", displayName: "Fort Worth, TX", population: "900K" },
      { name: "Miami", state: "Florida", displayName: "Miami, FL", population: "450K" },
      { name: "Orlando", state: "Florida", displayName: "Orlando, FL", population: "310K" },
      { name: "Tampa", state: "Florida", displayName: "Tampa, FL", population: "380K" },
      { name: "Jacksonville", state: "Florida", displayName: "Jacksonville, FL", population: "950K" },
      { name: "Fort Lauderdale", state: "Florida", displayName: "Fort Lauderdale, FL", population: "180K" },
      { name: "Los Angeles", state: "California", displayName: "Los Angeles, CA", population: "3.9M" },
      { name: "San Diego", state: "California", displayName: "San Diego, CA", population: "1.4M" },
      { name: "Sacramento", state: "California", displayName: "Sacramento, CA", population: "520K" },
      { name: "San Jose", state: "California", displayName: "San Jose, CA", population: "1M" },
      { name: "Fresno", state: "California", displayName: "Fresno, CA", population: "540K" },
      { name: "Atlanta", state: "Georgia", displayName: "Atlanta, GA", population: "500K" },
      { name: "Savannah", state: "Georgia", displayName: "Savannah, GA", population: "150K" },
      { name: "Augusta", state: "Georgia", displayName: "Augusta, GA", population: "200K" },
      { name: "Macon", state: "Georgia", displayName: "Macon, GA", population: "150K" },
      { name: "Columbus", state: "Georgia", displayName: "Columbus, GA", population: "200K" },
      { name: "Chicago", state: "Illinois", displayName: "Chicago, IL", population: "2.7M" },
      { name: "Springfield", state: "Illinois", displayName: "Springfield, IL", population: "115K" },
      { name: "Peoria", state: "Illinois", displayName: "Peoria, IL", population: "113K" },
      { name: "Rockford", state: "Illinois", displayName: "Rockford, IL", population: "148K" },
      { name: "Naperville", state: "Illinois", displayName: "Naperville, IL", population: "149K" },
    ];

    // Helper function to get city coordinates (simplified - using approximate coordinates)
    const getCityCoordinates = (cityName: string) => {
      const coordinates: Record<string, { lat: string; lng: string }> = {
        "Houston": { lat: "29.7604", lng: "-95.3698" },
        "Dallas": { lat: "32.7767", lng: "-96.7970" },
        "Austin": { lat: "30.2672", lng: "-97.7431" },
        "San Antonio": { lat: "29.4241", lng: "-98.4936" },
        "Fort Worth": { lat: "32.7555", lng: "-97.3308" },
        "Miami": { lat: "25.7617", lng: "-80.1918" },
        "Orlando": { lat: "28.5383", lng: "-81.3792" },
        "Tampa": { lat: "27.9506", lng: "-82.4572" },
        "Jacksonville": { lat: "30.3322", lng: "-81.6557" },
        "Fort Lauderdale": { lat: "26.1224", lng: "-80.1373" },
        "Los Angeles": { lat: "34.0522", lng: "-118.2437" },
        "San Diego": { lat: "32.7157", lng: "-117.1611" },
        "Sacramento": { lat: "38.5816", lng: "-121.4944" },
        "San Jose": { lat: "37.3382", lng: "-121.8863" },
        "Fresno": { lat: "36.7378", lng: "-119.7871" },
        "Atlanta": { lat: "33.7490", lng: "-84.3880" },
        "Savannah": { lat: "32.0809", lng: "-81.0912" },
        "Augusta": { lat: "33.4735", lng: "-82.0105" },
        "Macon": { lat: "32.8407", lng: "-83.6324" },
        "Columbus": { lat: "32.4609", lng: "-84.9877" },
        "Chicago": { lat: "41.8781", lng: "-87.6298" },
        "Springfield": { lat: "39.7817", lng: "-89.6501" },
        "Peoria": { lat: "40.6936", lng: "-89.5890" },
        "Rockford": { lat: "42.2711", lng: "-89.0940" },
        "Naperville": { lat: "41.7508", lng: "-88.1535" },
      };
      return coordinates[cityName] || { lat: "0", lng: "0" };
    };

    const businessInfo = {
      company: {
        name: "FlushJohn",
        legalName: "Quengenesis, LLC",
        established: "2020",
        website: websiteURL,
        description:
          "FlushJohn is a professional porta potty rental company providing reliable, clean, and affordable portable toilet services across the United States. We specialize in serving construction sites, events, weddings, festivals, and any occasion requiring temporary sanitation solutions.",
        slogan: "Professional Porta Potty Rentals - Fast, Reliable, Affordable",
        businessType: "Portable Sanitation Service Provider",
        industry: "Portable Sanitation and Event Services",
      },

      contact: {
        phone: phone_number,
        phoneFormatted: phone_number,
        email: contact_email,
        supportEmail: contact_email,
        salesEmail: contact_email,
        availableLanguages: ["English", "Spanish"],
        timezone: "Multiple US timezones",
      },

      serviceAreas: {
        country: "United States",
        states: ["Texas", "Florida", "California", "Georgia", "Illinois"],
        cities: citiesData.map((city) => ({
          name: city.displayName,
          state: city.state,
          population: city.population
            .replace("K", " thousand")
            .replace("M", " million"),
          serviceRadius: "50 miles",
          coordinates: {
            lat: parseFloat(getCityCoordinates(city.name).lat),
            lng: parseFloat(getCityCoordinates(city.name).lng),
          },
        })),
        totalCitiesServed: 25,
        totalStatesServed: 5,
      },

      products: [
        {
          id: "standard-porta-potty",
          name: "Standard Porta Potty",
          description:
            "Our standard porta potty is perfect for construction sites and basic event needs. Clean, reliable, and affordable.",
          features: [
            "Toilet seat",
            "Urinal",
            "Toilet paper dispenser",
            "Hand sanitizer dispenser",
            "Ventilation",
            "Non-slip floor",
          ],
          dimensions: {
            height: "92 inches",
            width: "48 inches",
            depth: "48 inches",
            weight: "180 lbs",
          },
          priceRange: "$100-$150 per day",
          idealFor: [
            "Construction sites",
            "Outdoor events",
            "Parks",
            "Basic needs",
          ],
          compliance: ["OSHA compliant", "ADA accessible option available"],
        },
        {
          id: "deluxe-porta-potty",
          name: "Deluxe Flushing Porta Potty",
          description:
            "Upgraded porta potty with flushing toilet and hand washing station inside. Perfect for weddings and upscale events.",
          features: [
            "Flushing toilet",
            "Built-in hand wash sink",
            "Mirror",
            "Interior lighting",
            "Coat hook",
            "Toilet paper dispenser",
            "Paper towel dispenser",
            "Enhanced ventilation",
          ],
          dimensions: {
            height: "92 inches",
            width: "48 inches",
            depth: "48 inches",
            weight: "220 lbs",
          },
          priceRange: "$150-$250 per day",
          idealFor: [
            "Weddings",
            "Corporate events",
            "Upscale gatherings",
            "VIP areas",
          ],
          compliance: ["OSHA compliant", "ADA accessible option available"],
        },
        {
          id: "ada-compliant-porta-potty",
          name: "ADA Compliant Porta Potty",
          description:
            "Wheelchair accessible porta potty meeting all ADA requirements. Spacious interior with grab bars and ramps.",
          features: [
            "Wheelchair accessible",
            "Interior grab bars",
            "Ramp access",
            'Spacious interior (60" x 60")',
            "Lower toilet seat height",
            "Hand sanitizer at accessible height",
            "Large door opening",
            "Non-slip ramp surface",
          ],
          dimensions: {
            height: "92 inches",
            width: "60 inches",
            depth: "90 inches",
            weight: "280 lbs",
          },
          priceRange: "$175-$275 per day",
          idealFor: [
            "Public events",
            "Construction sites",
            "Parks",
            "Any event requiring ADA compliance",
          ],
          compliance: [
            "ADA compliant",
            "OSHA compliant",
            "Meets all federal accessibility standards",
          ],
        },
        {
          id: "luxury-restroom-trailer",
          name: "Luxury Restroom Trailer",
          description:
            "Premium restroom trailer with multiple stalls, air conditioning, and upscale finishes. Perfect for high-end events.",
          features: [
            "Multiple private stalls",
            "Flushing toilets",
            "Running water sinks",
            "Air conditioning/heating",
            "Interior lighting",
            "Premium finishes",
            "Sound system capability",
            "Stainless steel fixtures",
            "Vanity mirrors",
            "Waste tanks",
          ],
          dimensions: {
            height: "10-12 feet",
            width: "8 feet",
            length: "20-30 feet",
            weight: "5000-8000 lbs",
          },
          priceRange: "$800-$1500 per day",
          idealFor: [
            "Luxury weddings",
            "Corporate galas",
            "Film productions",
            "VIP events",
          ],
          compliance: ["ADA options available", "Building code compliant"],
        },
        {
          id: "hand-wash-station",
          name: "Portable Hand Wash Station",
          description:
            "Standalone hand washing station with soap dispensers and paper towels. Perfect complement to standard porta potties.",
          features: [
            "Multiple wash stations",
            "Foot-pump operation (touchless)",
            "Soap dispensers",
            "Paper towel dispensers",
            "Waste water tank",
            "Fresh water tank",
          ],
          dimensions: {
            height: "48 inches",
            width: "48 inches",
            depth: "24 inches",
            weight: "120 lbs",
          },
          priceRange: "$75-$125 per day",
          idealFor: [
            "Construction sites",
            "Events",
            "OSHA compliance",
            "Health requirements",
          ],
          compliance: ["OSHA compliant", "Health code compliant"],
        },
        {
          id: "construction-porta-potty",
          name: "Construction Porta Potty Package",
          description:
            "Long-term rental package designed for construction sites with weekly servicing included.",
          features: [
            "Standard porta potty units",
            "Weekly service and cleaning",
            "Restocking of supplies",
            "Secure tie-down capability",
            "High-visibility coloring",
            "Damage-resistant construction",
          ],
          priceRange: "$150-$200 per month",
          idealFor: [
            "Construction sites",
            "Long-term projects",
            "Industrial sites",
          ],
          compliance: ["OSHA compliant", "Construction site standards"],
        },
      ],

      serviceTypes: [
        {
          name: "Event Rentals",
          description:
            "Porta potty rentals for all types of events including weddings, festivals, concerts, and corporate gatherings.",
          typicalDuration: "Daily or weekend rentals",
          includedServices: [
            "Delivery",
            "Setup",
            "Pickup",
            "Cleaning before delivery",
          ],
        },
        {
          name: "Construction Site Rentals",
          description:
            "Long-term porta potty rentals for construction projects with regular servicing.",
          typicalDuration: "Weekly, monthly, or project duration",
          includedServices: [
            "Delivery",
            "Setup",
            "Weekly servicing",
            "Waste removal",
            "Supply restocking",
            "Pickup",
          ],
        },
        {
          name: "Emergency Services",
          description:
            "Rapid deployment porta potty services for emergency situations and disaster relief.",
          typicalDuration: "As needed",
          includedServices: [
            "Emergency delivery",
            "Setup",
            "Regular servicing",
            "Pickup",
          ],
        },
      ],

      pricing: {
        overview:
          "Our pricing varies based on location, rental duration, unit type, and additional services. Contact us for exact pricing.",
        ranges: {
          standardDaily: "$100-$150 per day",
          deluxeDaily: "$150-$250 per day",
          adaDaily: "$175-$275 per day",
          luxuryDaily: "$800-$1500 per day",
          constructionMonthly: "$150-$200 per month",
        },
        factors: [
          "Location and delivery distance",
          "Rental duration",
          "Unit type",
          "Quantity",
          "Service frequency",
          "Special requirements",
        ],
        discounts: ["Long-term rentals", "Multiple units", "Repeat customers"],
      },

      serviceDetails: {
        availability: "24/7 availability, 365 days a year",
        delivery: {
          speed: "Same-day delivery available in most locations",
          averageResponseTime: "2-4 hours",
          deliveryRadius: "50 miles from each service location",
          deliveryIncluded: true,
          setupIncluded: true,
        },
        maintenance: {
          frequency: "Weekly for long-term rentals, or as requested",
          included: ["Waste removal", "Cleaning", "Restocking supplies"],
          supplies: ["Toilet paper", "Hand sanitizer", "Deodorizer"],
        },
        requirements: {
          access: "Level ground with vehicle access",
          clearance: "12 feet height clearance for delivery truck",
          surface: "Concrete, asphalt, grass, or dirt",
          permits: "Customer responsible for local permits if required",
        },
      },

      qualityCompliance: {
        certifications: [
          "OSHA compliant",
          "ADA compliant options",
          "EPA compliant waste disposal",
        ],
        standards: [
          "All units cleaned and sanitized before delivery",
          "Regular inspections",
          "Professional maintenance",
          "Licensed waste disposal",
        ],
        insurance: "Fully insured and bonded",
        safetyStandards: [
          "Non-slip flooring",
          "Ventilation systems",
          "Secure latching",
          "Stability in wind",
          "Fire-resistant materials",
        ],
      },

      customerInfo: {
        rating: {
          average: 4.8,
          outOf: 5,
          totalReviews: 127,
        },
        testimonials: [
          {
            author: "Sarah M.",
            rating: 5,
            location: "Houston, TX",
            comment:
              "Excellent porta potty service. Clean, professional, and affordable! Used them for our wedding and guests were impressed.",
          },
          {
            author: "Mike R.",
            rating: 5,
            location: "Miami, FL",
            comment:
              "We've been using FlushJohn for our construction projects for 2 years. Always reliable and cost-effective.",
          },
          {
            author: "Jennifer L.",
            rating: 5,
            location: "Los Angeles, CA",
            comment:
              "Great porta potty service for our corporate event. The team was professional and the units were spotless.",
          },
        ],
        customerTypes: [
          "Event planners",
          "Construction managers",
          "Wedding coordinators",
          "Festival organizers",
          "Homeowners",
          "Businesses",
          "Government agencies",
          "Schools and universities",
        ],
      },

      booking: {
        methods: ["Online quote form", "Phone call", "Email"],
        quoteUrl: `${websiteURL}/quote`,
        phoneNumber: phone_number,
        email: contact_email,
        responseTime:
          "Within 1 hour during business hours, within 24 hours otherwise",
        minimumNotice: "Same-day available, but 24-48 hours notice preferred",
        cancellationPolicy:
          "Cancel up to 24 hours before delivery for full refund",
      },

      faq: [
        {
          question: "How much does porta potty rental cost?",
          answer:
            "Porta potty rental costs vary based on location, rental duration, and unit type. Standard units start at $100-$150 per day, deluxe units at $150-$250 per day, ADA compliant units at $175-$275 per day, and luxury trailers at $800-$1500 per day. Long-term construction rentals are $150-$200 per month. Contact us for exact pricing in your area.",
        },
        {
          question: "What areas do you serve?",
          answer:
            "FlushJohn serves 25 major cities across 5 states: Texas (Houston, Dallas, Austin, San Antonio, Fort Worth), Florida (Miami, Orlando, Tampa, Jacksonville, Fort Lauderdale), California (Los Angeles, San Diego, Sacramento, San Jose, Fresno), Georgia (Atlanta, Savannah, Augusta, Macon, Columbus), and Illinois (Chicago, Springfield, Peoria, Rockford, Naperville). We provide service within a 50-mile radius of each city.",
        },
        {
          question: "Do you offer same-day delivery?",
          answer:
            "Yes! We offer same-day porta potty delivery in most locations when inventory is available. Our average response time is 2-4 hours from quote acceptance to delivery. For guaranteed availability, we recommend booking 24-48 hours in advance.",
        },
        {
          question: "How many porta potties do I need for my event?",
          answer:
            "The number of porta potties needed depends on several factors: number of attendees, event duration, and whether alcohol is served. As a general guideline: for events under 4 hours, plan for 1 unit per 50 people. For events with alcohol, plan for 1 unit per 35 people. For construction sites, OSHA requires 1 unit per 20 workers. Contact us for a personalized recommendation.",
        },
        {
          question: "What is included in the rental?",
          answer:
            "Our porta potty rental includes: delivery to your location, professional setup, toilet paper and hand sanitizer, cleaning before delivery, and pickup at the end of the rental period. For long-term rentals, we also include weekly servicing, waste removal, and supply restocking.",
        },
        {
          question: "Are your porta potties ADA compliant?",
          answer:
            'Yes! We offer ADA compliant porta potties that meet all federal accessibility standards. Our ADA units feature wheelchair accessibility, interior grab bars, ramp access, spacious interior (60" x 60"), lower toilet seat height, and accessible hand sanitizer placement.',
        },
        {
          question: "How often are the units cleaned?",
          answer:
            "All units are thoroughly cleaned and sanitized before each delivery. For long-term rentals, we provide weekly servicing which includes waste removal, interior cleaning, and restocking of toilet paper and hand sanitizer. Additional cleaning services are available upon request.",
        },
        {
          question: "What do I need to prepare for delivery?",
          answer:
            "For porta potty delivery, you need: level ground with vehicle access, 12 feet of height clearance for our delivery truck, and a suitable surface (concrete, asphalt, grass, or dirt). The location should be easily accessible and within 50 feet of where the truck can park. If local permits are required, the customer is responsible for obtaining them.",
        },
        {
          question: "Can I rent porta potties for a construction site?",
          answer:
            "Absolutely! We specialize in construction site porta potty rentals with long-term packages. Our construction packages include standard units, weekly service and cleaning, restocking of supplies, secure tie-down capability, and damage-resistant construction. Pricing starts at $150-$200 per month per unit.",
        },
        {
          question: "Do you serve weddings and special events?",
          answer:
            "Yes! We offer deluxe and luxury porta potty options perfect for weddings and upscale events. Our deluxe units feature flushing toilets, hand washing stations, mirrors, and interior lighting. For high-end events, we offer luxury restroom trailers with multiple stalls, air conditioning, and premium finishes.",
        },
      ],

      competitiveAdvantages: [
        "Same-day delivery available in most locations",
        "24/7 availability and customer support",
        "Multi-state coverage across 5 states and 25 cities",
        "Competitive and transparent pricing",
        "Professional, reliable service",
        "Clean, well-maintained units",
        "ADA compliant options",
        "Luxury options for upscale events",
        "Long-term construction packages",
        "4.8-star average rating",
        "Established since 2020",
        "OSHA and EPA compliant",
      ],

      meta: {
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        aiOptimized: true,
        structuredForParsing: true,
        comprehensiveness: "complete",
      },
    };

    res.status(200).json(businessInfo);
  } catch (error: any) {
    console.error("Error getting business info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get business information",
      message: error.message || "Internal server error",
    });
  }
});

export default router;
