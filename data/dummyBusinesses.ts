import { Business } from '../types/business';
import { db } from '../firebase-config';
import { collection, doc, writeBatch } from 'firebase/firestore';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  workingDays: string[]; // Array of days they work (e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffId: string;
}

interface Booking {
  id: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  duration: number; // in minutes
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes (30 or 60)
  description: string;
  staffIds: string[];
}

interface BusinessWithDetails extends Business {
  staff: StaffMember[];
  services: Service[];
  bookings: Booking[];
  type: string;
  city: string;
}

export const dummyBusinesses: BusinessWithDetails[] = [
  {
    id: 'e8f7d9c2-3a1b-4e5f-8c9d-2b3a4f5e6d7c',
    name: "Shear Madness",
    description: "Traditional salon where we promise not to talk about your receding hairline... unless you bring it up first",
    address: "15 Grafton Street",
    city: "Dublin",
    rating: 4.8,
    reviews: 156,
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    type: "salon",
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Smith",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        bio: "10 years of experience in modern and classic cuts",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Mike Johnson",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
        bio: "Specializing in kids cuts and modern styles",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"]
      }
    ],
    services: [
      {
        id: "550e8400-e29b-41d4-a716-446655440025",
        name: "Classic Haircut",
        price: 30,
        duration: 30,
        description: "Traditional haircut with modern techniques",
        staffIds: ["550e8400-e29b-41d4-a716-446655440000"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440026",
        name: "Beard Trim",
        price: 20,
        duration: 30,
        description: "Professional beard shaping and grooming",
        staffIds: ["550e8400-e29b-41d4-a716-446655440001"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440027",
        name: "Kids Cut",
        price: 25,
        duration: 30,
        description: "Fun and quick haircut for children",
        staffIds: ["550e8400-e29b-41d4-a716-446655440001"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        staffId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440025",
        date: "2025-04-02",
        startTime: "10:00",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        staffId: "550e8400-e29b-41d4-a716-446655440001",
        serviceId: "550e8400-e29b-41d4-a716-446655440026",
        date: "2025-04-02",
        startTime: "14:30",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        staffId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440027",
        date: "2025-04-03",
        startTime: "11:00",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        staffId: "550e8400-e29b-41d4-a716-446655440001",
        serviceId: "550e8400-e29b-41d4-a716-446655440025",
        date: "2025-04-03",
        startTime: "15:00",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440006",
        staffId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440026",
        date: "2025-04-02",
        startTime: "16:30",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        staffId: "550e8400-e29b-41d4-a716-446655440001",
        serviceId: "550e8400-e29b-41d4-a716-446655440027",
        date: "2025-04-02",
        startTime: "13:00",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440008",
        staffId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440025",
        date: "2025-04-03",
        startTime: "09:30",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        staffId: "550e8400-e29b-41d4-a716-446655440001",
        serviceId: "550e8400-e29b-41d4-a716-446655440026",
        date: "2025-04-03",
        startTime: "12:30",
        duration: 30
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        staffId: "550e8400-e29b-41d4-a716-446655440000",
        serviceId: "550e8400-e29b-41d4-a716-446655440027",
        date: "2025-04-03",
        startTime: "16:00",
        duration: 30
      }
    ],
    openingHours: {
      "Monday": "9:00 AM - 6:00 PM",
      "Tuesday": "9:00 AM - 6:00 PM",
      "Wednesday": "9:00 AM - 6:00 PM",
      "Thursday": "9:00 AM - 6:00 PM",
      "Friday": "9:00 AM - 7:00 PM",
      "Saturday": "10:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
    name: "Style & Grace",
    description: "Upscale salon where your hair transformation costs less than a therapy session (but works just as well)",
    address: "42 Henry Street",
    city: "Dublin",
    rating: 4.9,
    reviews: 203,
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035",
    type: "salon",
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Sarah Wilson",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        bio: "15 years of experience in curly hair and perming",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Emma Davis",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        bio: "Specialist in hair treatments and styling",
        workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      }
    ],
    services: [
      {
        id: "550e8400-e29b-41d4-a716-446655440028",
        name: "Haircut & Style",
        price: 45,
        duration: 30,
        description: "Professional haircut with wash and style",
        staffIds: ["550e8400-e29b-41d4-a716-446655440002"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440029",
        name: "Colour",
        price: 80,
        duration: 60,
        description: "Full hair colouring service with premium products",
        staffIds: ["550e8400-e29b-41d4-a716-446655440003"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440030",
        name: "Treatment",
        price: 60,
        duration: 30,
        description: "Deep conditioning and treatment",
        staffIds: ["550e8400-e29b-41d4-a716-446655440002"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        staffId: "550e8400-e29b-41d4-a716-446655440002",
        serviceId: "550e8400-e29b-41d4-a716-446655440028",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 60
      }
    ],
    openingHours: {
      "Monday": "10:00 AM - 7:00 PM",
      "Tuesday": "10:00 AM - 7:00 PM",
      "Wednesday": "10:00 AM - 7:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7',
    name: "Transform & Tress",
    description: "Where we turn 'I just want a trim' into 'Who's that model in the mirror?'",
    address: "28 South William Street",
    city: "Dublin",
    rating: 4.7,
    reviews: 128,
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    type: "barber",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440031",
        name: "Full Makeover", 
        price: 200, 
        duration: 180,
        description: "Complete hair transformation service",
        staffIds: ["550e8400-e29b-41d4-a716-446655440004"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440032",
        name: "Extensions", 
        price: 300, 
        duration: 240,
        description: "Professional hair extension application",
        staffIds: ["550e8400-e29b-41d4-a716-446655440005"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440033",
        name: "Wedding Style", 
        price: 150, 
        duration: 120,
        description: "Special occasion styling service",
        staffIds: ["550e8400-e29b-41d4-a716-446655440006"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "Lisa Anderson",
        role: "Master Stylist",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        bio: "20 years of experience in transformations and extensions",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Rachel Brown",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in wedding and special occasion styling",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        staffId: "550e8400-e29b-41d4-a716-446655440004",
        serviceId: "550e8400-e29b-41d4-a716-446655440031",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 120
      }
    ],
    openingHours: {
      "Monday": "11:00 AM - 8:00 PM",
      "Tuesday": "11:00 AM - 8:00 PM",
      "Wednesday": "11:00 AM - 8:00 PM",
      "Thursday": "11:00 AM - 8:00 PM",
      "Friday": "11:00 AM - 9:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "12:00 PM - 5:00 PM"
    }
  },
  {
    id: 'c3d4e5f6-7g8h-9i0j-1k2l-m3n4o5p6q7r8',
    name: "Curl Up & Dye",
    description: "The only place where 'I want something different' doesn't end in tears",
    address: "12 Patrick Street",
    city: "Cork",
    rating: 4.6,
    reviews: 189,
    imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
    type: "salon",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440034",
        name: "Curly Cut", 
        price: 75, 
        duration: 60,
        description: "Specialized cut for curly hair types",
        staffIds: ["550e8400-e29b-41d4-a716-446655440007"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440035",
        name: "Perm", 
        price: 150, 
        duration: 150,
        description: "Professional perming service with aftercare",
        staffIds: ["550e8400-e29b-41d4-a716-446655440008"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440036",
        name: "Hair Therapy", 
        price: 90, 
        duration: 90,
        description: "Deep conditioning and treatment",
        staffIds: ["550e8400-e29b-41d4-a716-446655440007"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440007",
        name: "Emma Wilson",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        bio: "15 years of experience in curly hair and perming",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440008",
        name: "Sophie Davis",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        bio: "Specialist in hair treatments and styling",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        staffId: "550e8400-e29b-41d4-a716-446655440007",
        serviceId: "550e8400-e29b-41d4-a716-446655440034",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 60
      }
    ],
    openingHours: {
      "Monday": "9:00 AM - 7:00 PM",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 8:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'd4e5f6g7-8h9i-0j1k-2l3m-n4o5p6q7r8s9',
    name: "The Mane Event",
    description: "Making bad hair days extinct since 2010 (except during hurricanes, we're not magicians)",
    address: "8 Shop Street",
    city: "Galway",
    rating: 4.9,
    reviews: 245,
    imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1",
    type: "salon",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440037",
        name: "Full Makeover", 
        price: 200, 
        duration: 180,
        description: "Complete hair transformation service",
        staffIds: ["550e8400-e29b-41d4-a716-446655440009"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440038",
        name: "Extensions", 
        price: 300, 
        duration: 240,
        description: "Professional hair extension application",
        staffIds: ["550e8400-e29b-41d4-a716-446655440010"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440039",
        name: "Wedding Style", 
        price: 150, 
        duration: 120,
        description: "Special occasion styling service",
        staffIds: ["550e8400-e29b-41d4-a716-446655440011"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440009",
        name: "Lisa Anderson",
        role: "Master Stylist",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        bio: "20 years of experience in transformations and extensions",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        name: "Rachel Brown",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in wedding and special occasion styling",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        staffId: "550e8400-e29b-41d4-a716-446655440009",
        serviceId: "550e8400-e29b-41d4-a716-446655440037",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 120
      }
    ],
    openingHours: {
      "Monday": "10:00 AM - 8:00 PM",
      "Tuesday": "10:00 AM - 8:00 PM",
      "Wednesday": "10:00 AM - 8:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 9:00 PM",
      "Saturday": "9:00 AM - 7:00 PM",
      "Sunday": "10:00 AM - 4:00 PM"
    }
  },
  {
    id: 'e5f6g7h8-9i0j-1k2l-3m4n-o5p6q7r8s9t0',
    name: "Shear Genius",
    description: "We're not saying we're better than Einstein, but have you seen his hair?",
    address: "24 O'Connell Street",
    city: "Limerick",
    rating: 4.8,
    reviews: 167,
    imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6",
    type: "barber",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440040",
        name: "Smart Cut", 
        price: 40,
        duration: 45,
        description: "Precision haircut with modern techniques",
        staffIds: ["550e8400-e29b-41d4-a716-446655440012"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440041",
        name: "Beard Sculpting", 
        price: 30,
        duration: 30,
        description: "Detailed beard shaping and grooming",
        staffIds: ["550e8400-e29b-41d4-a716-446655440013"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440042",
        name: "Head Shave", 
        price: 35, 
        duration: 30,
        description: "Complete head shave with hot towel",
        staffIds: ["550e8400-e29b-41d4-a716-446655440014"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        name: "Michael Brown",
        role: "Master Barber",
        imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6",
        bio: "15 years of experience in modern barbering",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440015",
        staffId: "550e8400-e29b-41d4-a716-446655440012",
        serviceId: "550e8400-e29b-41d4-a716-446655440040",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 45
      }
    ],
    openingHours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 7:00 PM",
      "Friday": "8:00 AM - 7:00 PM",
      "Saturday": "9:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'f6g7h8i9-0j1k-2l3m-4n5o-p6q7r8s9t0u1',
    name: "Mullet Over",
    description: "Business in the front, party in the back, laughs all around",
    address: "16 Quay Street",
    city: "Waterford",
    rating: 4.5,
    reviews: 142,
    imageUrl: "https://images.unsplash.com/photo-1584316712724-f5d4b188fee2",
    type: "barber",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440043",
        name: "The Mullet", 
        price: 45, 
        duration: 45,
        description: "Classic mullet style with modern touch",
        staffIds: ["550e8400-e29b-41d4-a716-446655440015"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440044",
        name: "The Billy Ray", 
        price: 50, 
        duration: 60,
        description: "Signature mullet style with extra flair",
        staffIds: ["550e8400-e29b-41d4-a716-446655440016"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440045",
        name: "Modern Mullet", 
        price: 55, 
        duration: 60,
        description: "Contemporary take on the classic mullet",
        staffIds: ["550e8400-e29b-41d4-a716-446655440017"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440015",
        name: "Billy Ray Cyrus",
        role: "Master Mullet Specialist",
        imageUrl: "https://images.unsplash.com/photo-1584316712724-f5d4b188fee2",
        bio: "30 years of mullet expertise and innovation",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440016",
        name: "Miley Cyrus",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Bringing modern twists to classic styles",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440018",
        staffId: "550e8400-e29b-41d4-a716-446655440015",
        serviceId: "550e8400-e29b-41d4-a716-446655440043",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 60
      }
    ],
    openingHours: {
      "Monday": "11:00 AM - 7:00 PM",
      "Tuesday": "11:00 AM - 7:00 PM",
      "Wednesday": "11:00 AM - 7:00 PM",
      "Thursday": "11:00 AM - 7:00 PM",
      "Friday": "11:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'g7h8i9j0-1k2l-3m4n-5o6p-q7r8s9t0u1v2',
    name: "Scissors of Oz",
    description: "Follow the highlighted road to fabulous hair (No ruby slippers required)",
    address: "33 Shop Street",
    city: "Galway",
    rating: 4.7,
    reviews: 198,
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
    type: "salon",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440046",
        name: "Rainbow Color", 
        price: 180, 
        duration: 180,
        description: "Vibrant rainbow hair coloring service",
        staffIds: ["550e8400-e29b-41d4-a716-446655440018"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440047",
        name: "Fantasy Cut", 
        price: 70, 
        duration: 60,
        description: "Creative fantasy-inspired haircut",
        staffIds: ["550e8400-e29b-41d4-a716-446655440019"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440048",
        name: "Emerald Treatment", 
        price: 90, 
        duration: 90,
        description: "Specialized green hair treatment",
        staffIds: ["550e8400-e29b-41d4-a716-446655440020"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440018",
        name: "Rainbow Bright",
        role: "Master Colourist",
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
        bio: "15 years of experience in fantasy hair colouring",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440019",
        name: "Pixie Dust",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in fantasy cuts and styling",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440021",
        staffId: "550e8400-e29b-41d4-a716-446655440018",
        serviceId: "550e8400-e29b-41d4-a716-446655440046",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 120
      }
    ],
    openingHours: {
      "Monday": "10:00 AM - 7:00 PM",
      "Tuesday": "10:00 AM - 7:00 PM",
      "Wednesday": "10:00 AM - 7:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'h8i9j0k1-2l3m-4n5o-6p7q-r8s9t0u1v2w3',
    name: "The Buzz Lightyear",
    description: "To infinity and beyond... but first, let's fix that bedhead",
    address: "5 William Street",
    city: "Cork",
    rating: 4.6,
    reviews: 176,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    type: "barber",
    services: [
      { 
        id: "550e8400-e29b-41d4-a716-446655440049",
        name: "Space Fade", 
        price: 40, 
        duration: 45,
        description: "Cosmic-inspired fade haircut",
        staffIds: ["550e8400-e29b-41d4-a716-446655440021"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440050",
        name: "Meteor Mohawk", 
        price: 50, 
        duration: 60,
        description: "Space-themed mohawk style",
        staffIds: ["550e8400-e29b-41d4-a716-446655440022"]
      },
      { 
        id: "550e8400-e29b-41d4-a716-446655440051",
        name: "Buzz Cut", 
        price: 30, 
        duration: 30,
        description: "Classic buzz cut with precision",
        staffIds: ["550e8400-e29b-41d4-a716-446655440023"]
      }
    ],
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440021",
        name: "Neil Armstrong",
        role: "Space Barber",
        imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
        bio: "20 years of experience in cosmic hair styling",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440022",
        name: "Buzz Aldrin",
        role: "Senior Space Barber",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        bio: "Specialist in space-themed cuts and styles",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440024",
        staffId: "550e8400-e29b-41d4-a716-446655440021",
        serviceId: "550e8400-e29b-41d4-a716-446655440049",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 60
      }
    ],
    openingHours: {
      "Monday": "9:00 AM - 7:00 PM",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 7:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'i9j0k1l2-3m4n-5o6p-7q8r-s9t0u1v2w3x4',
    name: "Serenity Wellness Centre",
    description: "Your sanctuary for relaxation and rejuvenation in the heart of Dublin",
    address: "45 Merrion Square",
    city: "Dublin",
    rating: 4.9,
    reviews: 312,
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
    type: "wellness",
    staff: [
      {
        id: "550e8400-e29b-41d4-a716-446655440025",
        name: "Dr. Sarah O'Connor",
        role: "Senior Wellness Practitioner",
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
        bio: "15 years of experience in therapeutic treatments",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440026",
        name: "Michael Murphy",
        role: "Wellness Specialist",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        bio: "Specialist in sports therapy and deep tissue treatments",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440027",
        name: "Emma Walsh",
        role: "Aromatherapy Expert",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        bio: "Certified aromatherapist with expertise in holistic treatments",
        workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      }
    ],
    services: [
      {
        id: "550e8400-e29b-41d4-a716-446655440052",
        name: "Therapeutic Treatment",
        price: 90,
        duration: 60,
        description: "Professional therapeutic treatment with aromatherapy oils",
        staffIds: ["550e8400-e29b-41d4-a716-446655440025"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440053",
        name: "Sports Therapy",
        price: 85,
        duration: 60,
        description: "Specialized treatment for sports-related muscle tension",
        staffIds: ["550e8400-e29b-41d4-a716-446655440026"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440054",
        name: "Aromatherapy Treatment",
        price: 95,
        duration: 60,
        description: "Holistic treatment using essential oils and gentle techniques",
        staffIds: ["550e8400-e29b-41d4-a716-446655440027"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440055",
        name: "Deep Tissue Treatment",
        price: 100,
        duration: 60,
        description: "Intensive treatment for chronic muscle tension",
        staffIds: ["550e8400-e29b-41d4-a716-446655440026"]
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440056",
        name: "Wellness Consultation",
        price: 75,
        duration: 45,
        description: "Personalized wellness assessment and treatment plan",
        staffIds: ["550e8400-e29b-41d4-a716-446655440025"]
      }
    ],
    bookings: [
      {
        id: "550e8400-e29b-41d4-a716-446655440028",
        staffId: "550e8400-e29b-41d4-a716-446655440025",
        serviceId: "550e8400-e29b-41d4-a716-446655440052",
        date: "2024-03-30",
        startTime: "14:00",
        duration: 60
      }
    ],
    openingHours: {
      "Monday": "9:00 AM - 8:00 PM",
      "Tuesday": "9:00 AM - 8:00 PM",
      "Wednesday": "9:00 AM - 8:00 PM",
      "Thursday": "9:00 AM - 8:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  }
];

export async function getAllBusinesses(): Promise<BusinessWithDetails[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dummyBusinesses;
}

export async function getBusinessData(businessId: string): Promise<BusinessWithDetails | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dummyBusinesses.find(b => b.id === businessId) || null;
}

export async function getAvailableTimeSlots(businessId: string, date: string): Promise<{ staffId: string, startTime: string, endTime: string }[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) return [];
  
  const availableSlots: { staffId: string, startTime: string, endTime: string }[] = [];
  
  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-IE', { weekday: 'long' });
  
  // Get all bookings for the date
  const dateBookings = business.bookings.filter(booking => booking.date === date);
  
  // For each staff member
  business.staff.forEach(staff => {
    // Check if staff member works on this day
    if (!staff.workingDays.includes(dayOfWeek)) return;
    
    // Get business opening hours for this day
    const openingHours = business.openingHours[dayOfWeek];
    if (!openingHours) return;
    
    // Parse opening hours
    const [openTime] = openingHours.split(' - ');
    const [time, period] = openTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let startHour = hours;
    
    // Convert to 24-hour format
    if (period === 'PM' && startHour !== 12) {
      startHour += 12;
    } else if (period === 'AM' && startHour === 12) {
      startHour = 0;
    }
    
    // Create 30-minute slots from opening time until closing time
    let currentTime = new Date();
    currentTime.setHours(startHour, minutes, 0, 0);
    
    // Default closing time (can be adjusted based on business hours)
    const endTime = new Date();
    endTime.setHours(18, 0, 0, 0); // 6 PM default
    
    while (currentTime < endTime) {
      const slotStartTime = currentTime.toLocaleTimeString('en-IE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      // Check if this slot overlaps with any existing bookings
      const isOverlapping = dateBookings.some(booking => {
        if (booking.staffId !== staff.id) return false;
        
        // Create date objects for booking times
        const [bookingHour, bookingMinute] = booking.startTime.split(':').map(Number);
        const bookingStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bookingHour, bookingMinute, 0, 0);
        const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60000));
        
        // Check for overlap
        return (
          (currentTime >= bookingStart && currentTime < bookingEnd) ||
          (new Date(currentTime.getTime() + 30 * 60000) > bookingStart && new Date(currentTime.getTime() + 30 * 60000) <= bookingEnd) ||
          (currentTime <= bookingStart && new Date(currentTime.getTime() + 30 * 60000) >= bookingEnd)
        );
      });
      
      if (!isOverlapping) {
        availableSlots.push({
          staffId: staff.id,
          startTime: slotStartTime,
          endTime: new Date(currentTime.getTime() + 30 * 60000).toLocaleTimeString('en-IE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  });
  
  return availableSlots;
}

export async function getStaffMembers(businessId: string): Promise<StaffMember[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  return business?.staff || [];
}

export async function getServices(businessId: string): Promise<Service[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  return business?.services || [];
}

export async function createBooking(
  businessId: string,
  staffId: string,
  serviceId: string,
  date: string,
  startTime: string
): Promise<Booking> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) throw new Error("Business not found");
  
  const service = business.services.find(s => s.id === serviceId);
  if (!service) throw new Error("Service not found");
  
  // Check if the slot is available
  const availableSlots = await getAvailableTimeSlots(businessId, date);
  const isSlotAvailable = availableSlots.some(slot => 
    slot.staffId === staffId && 
    slot.startTime === startTime
  );
  
  if (!isSlotAvailable) {
    throw new Error("Time slot is not available");
  }
  
  const newBooking: Booking = {
    id: `550e8400-e29b-41d4-a716-446655440${business.bookings.length + 1}`,
    staffId,
    serviceId,
    date,
    startTime,
    duration: service.duration
  };
  
  business.bookings.push(newBooking);
  return newBooking;
}

export async function cancelBooking(businessId: string, bookingId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) return false;
  
  const bookingIndex = business.bookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) return false;
  
  business.bookings.splice(bookingIndex, 1);
  return true;
}

export async function findAvailableSlotsForService(
  businessName: string,
  serviceName: string,
  date: string,
  staffName?: string
): Promise<{ staffName: string, startTime: string, endTime: string }[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.name === businessName);
  if (!business) return [];
  
  const service = business.services.find(s => s.name === serviceName);
  if (!service) return [];
  
  // Get the day of the week from the date
  const dayOfWeek = new Date(date).toLocaleDateString('en-IE', { weekday: 'long' });
  
  // Get all bookings for the date
  const dateBookings = business.bookings.filter(booking => booking.date === date);
  
  // Get relevant staff members
  const relevantStaff = staffName 
    ? business.staff.filter(s => s.name === staffName)
    : business.staff.filter(s => service.staffIds.includes(s.id));
  
  const availableSlots: { staffName: string, startTime: string, endTime: string }[] = [];
  
  // For each staff member
  relevantStaff.forEach(staff => {
    // Check if staff member works on this day
    if (!staff.workingDays.includes(dayOfWeek)) return;
    
    // Get business opening hours for this day
    const openingHours = business.openingHours[dayOfWeek];
    if (!openingHours) return;
    
    // Parse opening hours
    const [openTime, closeTime] = openingHours.split(' - ');
    const [openHour, openMinute] = openTime.split(' ')[0].split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(' ')[0].split(':').map(Number);
    
    // Convert to 24-hour format
    let startHour = openHour;
    let endHour = closeHour;
    
    if (openTime.includes('PM') && startHour !== 12) startHour += 12;
    if (openTime.includes('AM') && startHour === 12) startHour = 0;
    if (closeTime.includes('PM') && endHour !== 12) endHour += 12;
    if (closeTime.includes('AM') && endHour === 12) endHour = 0;
    
    // Create slots from opening time until closing time
    let currentTime = new Date();
    currentTime.setFullYear(new Date(date).getFullYear());
    currentTime.setMonth(new Date(date).getMonth());
    currentTime.setDate(new Date(date).getDate());
    currentTime.setHours(startHour, openMinute, 0, 0);
    
    const endTime = new Date(currentTime);
    endTime.setHours(endHour, closeMinute, 0, 0);
    
    while (currentTime < endTime) {
      const slotStartTime = currentTime.toLocaleTimeString('en-IE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      // Calculate slot end time based on service duration
      const slotEndTime = new Date(currentTime.getTime() + (service.duration * 60000));
      
      // Check if this slot overlaps with any existing bookings
      const isOverlapping = dateBookings.some(booking => {
        if (booking.staffId !== staff.id) return false;
        
        // Create date objects for booking times
        const [bookingHour, bookingMinute] = booking.startTime.split(':').map(Number);
        const bookingStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bookingHour, bookingMinute, 0, 0);
        const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60000));
        
        // Check for overlap
        return (
          (currentTime >= bookingStart && currentTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (currentTime <= bookingStart && slotEndTime >= bookingEnd)
        );
      });
      
      // Check if the slot would extend past closing time
      const wouldExtendPastClosing = slotEndTime > endTime;
      
      if (!isOverlapping && !wouldExtendPastClosing) {
        availableSlots.push({
          staffName: staff.name,
          startTime: slotStartTime,
          endTime: slotEndTime.toLocaleTimeString('en-IE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  });
  
  return availableSlots;
}

export async function loadDummyDataToFirestore() {
  try {
    const businesses = await getAllBusinesses();
    const batch = writeBatch(db);
    
    for (const business of businesses) {
      // Create business document
      const businessRef = doc(collection(db, 'businesses'), business.id);
      
      // Create business data without nested arrays
      const businessData = {
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        city: business.city,
        rating: business.rating,
        reviews: business.reviews,
        imageUrl: business.imageUrl,
        type: business.type,
        openingHours: business.openingHours
      };
      
      // Set business document
      batch.set(businessRef, businessData);
      
      // Create staff subcollection
      for (const staff of business.staff) {
        const staffRef = doc(collection(businessRef, 'staff'), staff.id);
        batch.set(staffRef, {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          imageUrl: staff.imageUrl,
          bio: staff.bio,
          workingDays: staff.workingDays
        });
      }
      
      // Create services subcollection
      for (const service of business.services) {
        const serviceRef = doc(collection(businessRef, 'services'), service.id);
        batch.set(serviceRef, {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          staffIds: service.staffIds
        });
      }
      
      // Create bookings subcollection
      for (const booking of business.bookings) {
        const bookingRef = doc(collection(businessRef, 'bookings'), booking.id);
        batch.set(bookingRef, {
          id: booking.id,
          staffId: booking.staffId,
          serviceId: booking.serviceId,
          date: booking.date,
          startTime: booking.startTime,
          duration: booking.duration
        });
      }
    }
    
    // Commit all writes
    await batch.commit();
    return { success: true, message: 'Successfully loaded dummy data to Firestore' };
  } catch (error) {
    console.error('Error loading dummy data to Firestore:', error);
    throw new Error('Failed to load dummy data to Firestore');
  }
}