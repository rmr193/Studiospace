export type StudioCategory =
  | "Photo Studio"
  | "Sound Stage"
  | "Podcast Room"
  | "Music Suite"
  | "Art Workshop";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "user" | "host";
  wishlist: string[];
  createdAt?: string;
}

export interface Studio {
  _id: string;
  title: string;
  category: StudioCategory;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  imageUrl: string;
  gallery: string[];
  amenities: string[];
  overview: string;
  rating: number;
  ownerEmail: string;
  ownerName: string;
  ownerPhoto: string;
  createdAt: string;
}

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface Booking {
  _id: string;
  studioId: string;
  studioTitle: string;
  studioImage: string;
  hourlyRate: number;
  securityDeposit?: number;
  userEmail: string;
  userName: string;
  bookingDate: string;
  startTime: number;
  endTime: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export interface BookedSlot {
  _id: string;
  studioId: string;
  bookingDate: string;
  startTime: number;
  endTime: number;
  status: BookingStatus;
}

