export type TicketStatus = "OPEN" | "RESPONDED" | "CLOSED";

export type TicketUser = {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
};

export type TicketCompany = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

export type CompanyTicket = {
  id: string;
  title: string;
  status: TicketStatus;
  company: TicketCompany;
  applicant: TicketUser;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name?: string | null;
      email: string;
    };
  };
  applicantLastViewedAt?: string | null;
  companyLastViewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: TicketUser;
};

export type TicketListResponse = {
  tickets: CompanyTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  scope: "applicant" | "company";
};

export type TicketMessagesResponse = {
  ticket: CompanyTicket;
  accessRole: string;
  messages: TicketMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

