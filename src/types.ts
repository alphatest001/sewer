export interface WorkEntry {
  id: string;
  city: string;
  date: string;
  zone: string;
  ward: string;
  location: string;
  landMark: string;
  landMarkLat?: number;
  landMarkLng?: number;
  shmr: number;
  chmr: number;
  noOfHrs: number;
  supervisor: string;
  remarks: string;
  photos: MediaFile[];
  videos: MediaFile[];
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  caption?: string;
  size?: string;
  duration?: string;
}

export interface MasterData {
  cities: string[];
  zones: { city: string; zones: string[] }[];
  wards: { city: string; zone: string; wards: string[] }[];
  locations: string[];
  supervisors: string[];
}
