export interface Contact {
  name: string;
  email: string;
  note: string;
}

export interface Lead {
  id: string; // Internal ID
  name: string;
  address: string;
  phone: string;
  email: string;
  website_url: string;
  has_website: string;
  linkedin_company_url: string;
  linkedin_dm_search: string;
  linkedin_ceo_search: string;
  linkedin_ops_search: string;
  linkedin_finance_search: string;
  apollo_company_search: string;
  apollo_ceo_search: string;
  hunter_domain_search: string;
  google_search: string;
  linkedin_google_search: string;
  outsource_signals: string;
  outsource_score: string;
  rating: string;
  review_count: string;
  category: string;
  size_hint: string;
  query: string;
  location: string;
  maps_url: string;
  score: string;
  bpo_notes: string;
  status: string;
  date_scraped: string;
  
  // Custom fields added by the app
  contact1: Contact;
  contact2: Contact;
  tags: string[];
  activities: {
    id: string;
    type: 'status_change' | 'note_update' | 'email_sent' | 'manual_log';
    description: string;
    timestamp: number;
  }[];
  lastUpdated: number;
}
