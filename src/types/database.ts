import type { UserRole, JobStatus, ServiceType } from "./enums";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  suburb: string | null;
  created_at: string;
}

export interface CleanerProfile {
  id: string;
  bio: string | null;
  services: ServiceType[];
  hourly_rate: number;
  coverage_suburbs: string[];
  availability: Record<string, string[]>;
  is_verified: boolean;
  police_check_url: string | null;
  insurance_url: string | null;
  id_doc_url: string | null;
  abn: string | null;
  rating_avg: number;
  rating_count: number;
  slug: string;
}

export interface Job {
  id: string;
  client_id: string;
  cleaner_id: string | null;
  service_type: ServiceType;
  suburb: string;
  property_size: string;
  preferred_date: string;
  preferred_time: string;
  budget_min: number | null;
  budget_max: number | null;
  notes: string | null;
  photo_urls: string[];
  status: JobStatus;
  created_at: string;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  body: string | null;
  created_at: string;
}
