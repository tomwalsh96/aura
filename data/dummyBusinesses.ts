import { Business } from '../types/business';
import { db } from '../firebase-config';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  workingDays: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  staffIds: string[];
}

interface Booking {
  id: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  duration: number;
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

export async function loadDummyDataToFirestore() {
  try {
    const businesses = dummyBusinesses;
    const batch = writeBatch(db);
    
    // First, delete all existing businesses and their subcollections
    const businessesRef = collection(db, 'businesses');
    const existingBusinesses = await getDocs(businessesRef);
    
    for (const doc of existingBusinesses.docs) {
      // Delete all subcollections
      const staffRef = collection(doc.ref, 'staff');
      const servicesRef = collection(doc.ref, 'services');
      const bookingsRef = collection(doc.ref, 'bookings');
      
      const [staffDocs, servicesDocs, bookingsDocs] = await Promise.all([
        getDocs(staffRef),
        getDocs(servicesRef),
        getDocs(bookingsRef)
      ]);
      
      // Delete all documents in subcollections
      staffDocs.docs.forEach(doc => batch.delete(doc.ref));
      servicesDocs.docs.forEach(doc => batch.delete(doc.ref));
      bookingsDocs.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete the business document
      batch.delete(doc.ref);
    }
    
    // Commit the deletions
    await batch.commit();
    
    // Start a new batch for adding data
    const newBatch = writeBatch(db);
    
    for (const business of businesses) {
      if (!business.id) {
        console.error('Business missing ID:', business.name);
        continue;
      }
      
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
      newBatch.set(businessRef, businessData);
      
      // Create staff subcollection
      for (const staff of business.staff) {
        if (!staff.id) {
          console.error('Staff missing ID:', staff.name);
          continue;
        }
        const staffRef = doc(collection(businessRef, 'staff'), staff.id);
        newBatch.set(staffRef, {
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
        if (!service.id) {
          console.error('Service missing ID:', service.name);
          continue;
        }
        const serviceRef = doc(collection(businessRef, 'services'), service.id);
        newBatch.set(serviceRef, {
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
        if (!booking.id) {
          console.error('Booking missing ID for business:', business.name);
          continue;
        }
        const bookingRef = doc(collection(businessRef, 'bookings'), booking.id);
        newBatch.set(bookingRef, {
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
    await newBatch.commit();
    return { success: true, message: 'Successfully loaded dummy data to Firestore' };
  } catch (error) {
    console.error('Error loading dummy data to Firestore:', error);
    throw new Error('Failed to load dummy data to Firestore');
  }
}