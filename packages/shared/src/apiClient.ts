import type {
  ActivityItem,
  AdminStats,
  Appeal,
  AppNotification,
  BroadcastResult,
  CertificateRequest,
  ChatChannelSummary,
  ChatMessage,
  ContactMessage,
  DormEvent,
  DormLeadershipOverview,
  ExplanatoryNote,
  Facility,
  FacilityBooking,
  FacilitySlot,
  GradeRecord,
  InvoiceRequest,
  InvoiceStatus,
  LeadershipReport,
  Listing,
  LoginRequest,
  LoginResponse,
  LostFoundItem,
  MaterialLog,
  MenuItem,
  PaymentMethod,
  PaymentPeriod,
  PaymentsSummary,
  PublicUser,
  RoomCheck,
  RoommateRequest,
  RoommateRequestStatus,
  RoommateRequestType,
  ScheduleEntry,
  SealType,
  Ticket,
  WeekParity,
} from "./types";
import type { DormWithDistance } from "./dorms";

export interface ApiClientOptions {
  baseUrl: string;
  getToken: () => string | null | Promise<string | null>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(res.status, body.error || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    login: (body: LoginRequest) =>
      request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request<PublicUser>("/api/me"),
    updateMe: (patch: Partial<PublicUser>) =>
      request<PublicUser>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),

    // Accepts either a browser/RN FormData (for real multipart file upload) or a
    // pre-fetched Blob/File array wrapped by the caller; returns absolute-path URLs
    // under /uploads that every photo-bearing endpoint below accepts as `photos`.
    uploadPhotos: (form: FormData) =>
      request<{ urls: string[] }>("/api/uploads", { method: "POST", body: form }),

    listings: (params?: { dormId?: number; sort?: string; q?: string; status?: string; residentId?: string; floor?: string }) => {
      const qs = new URLSearchParams();
      if (params?.dormId) qs.set("dormId", String(params.dormId));
      if (params?.sort) qs.set("sort", params.sort);
      if (params?.q) qs.set("q", params.q);
      if (params?.status) qs.set("status", params.status);
      if (params?.residentId) qs.set("residentId", params.residentId);
      if (params?.floor) qs.set("floor", params.floor);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<Listing[]>(`/api/listings${suffix}`);
    },
    myListings: () => request<Listing[]>("/api/listings/mine"),
    favoriteListings: () => request<Listing[]>("/api/listings/favorites"),
    listing: (id: string) => request<Listing>(`/api/listings/${id}`),
    createListing: (
      body: Pick<Listing, "title" | "description" | "price" | "negotiable" | "category" | "photos" | "dormId" | "room">
    ) => request<Listing>("/api/listings", { method: "POST", body: JSON.stringify(body) }),
    updateListing: (
      id: string,
      patch: { status?: Listing["status"]; title?: string; description?: string; price?: number }
    ) => request<Listing>(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    toggleFavorite: (id: string) => request<Listing>(`/api/listings/${id}/favorite`, { method: "POST" }),

    dorms: (lang?: "ru" | "en") => request<DormWithDistance[]>(`/api/dorms${lang ? `?lang=${lang}` : ""}`),

    tickets: (params?: { dormId?: number; status?: string; q?: string; floor?: string; residentId?: string }) => {
      const qs = new URLSearchParams();
      if (params?.dormId) qs.set("dormId", String(params.dormId));
      if (params?.status) qs.set("status", params.status);
      if (params?.q) qs.set("q", params.q);
      if (params?.floor) qs.set("floor", params.floor);
      if (params?.residentId) qs.set("residentId", params.residentId);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<Ticket[]>(`/api/tickets${suffix}`);
    },
    createTicket: (body: { category: string; description: string; photos?: string[] }) =>
      request<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(body) }),
    updateTicket: (id: string, patch: { status?: string; comment?: string }) =>
      request<Ticket>(`/api/tickets/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    appeals: (params?: { dormId?: number; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.dormId) qs.set("dormId", String(params.dormId));
      if (params?.status) qs.set("status", params.status);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<Appeal[]>(`/api/appeals${suffix}`);
    },
    createAppeal: (body: { topic: string; text: string; anonymous: boolean; photos?: string[] }) =>
      request<Appeal>("/api/appeals", { method: "POST", body: JSON.stringify(body) }),
    respondAppeal: (id: string, patch: { status: string; response?: string }) =>
      request<Appeal>(`/api/appeals/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    payments: () => request<PaymentsSummary>("/api/payments"),
    pay: (body: { period: PaymentPeriod; method: PaymentMethod; amount?: number }) =>
      request<PaymentsSummary>("/api/payments", { method: "POST", body: JSON.stringify(body) }),

    events: (params?: { dormId?: number; includePast?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.dormId) qs.set("dormId", String(params.dormId));
      if (params?.includePast) qs.set("includePast", "1");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<DormEvent[]>(`/api/events${suffix}`);
    },
    createEvent: (body: { title: string; description: string; date: string; photos?: string[]; isSfu?: boolean }) =>
      request<DormEvent & { deliveredCount: number }>("/api/events", { method: "POST", body: JSON.stringify(body) }),

    notifications: () => request<AppNotification[]>("/api/notifications"),
    markNotificationRead: (id: string) =>
      request<AppNotification>(`/api/notifications/${id}/read`, { method: "PATCH" }),
    markAllNotificationsRead: () =>
      request<{ ok: true }>("/api/notifications/read-all", { method: "PATCH" }),

    chatChannels: () => request<ChatChannelSummary[]>("/api/chat/channels"),
    searchUsers: (q: string) => request<PublicUser[]>(`/api/chat/users/search?q=${encodeURIComponent(q)}`),
    chatMessages: (channelId: string) => request<ChatMessage[]>(`/api/chat/channels/${channelId}/messages`),
    sendChatMessage: (channelId: string, body: { text: string; photos?: string[]; eventId?: string }) =>
      request<ChatMessage>(`/api/chat/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify(body) }),
    startDM: (userId: string) => request<ChatChannelSummary>(`/api/chat/dm/${userId}`, { method: "POST" }),

    adminStats: () => request<AdminStats>("/api/admin/stats"),
    adminResidents: (q?: string) => request<PublicUser[]>(`/api/admin/residents${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    adminStaff: () => request<PublicUser[]>("/api/admin/staff"),
    adminUpdateResident: (id: string, patch: Partial<PublicUser>) =>
      request<PublicUser>(`/api/admin/residents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    adminCreateResident: (body: {
      login: string;
      fullName: string;
      room: string;
      section?: string;
      password: string;
    }) =>
      request<PublicUser & { replaced?: boolean }>("/api/admin/residents", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    broadcast: (body: { title: string; text: string; audience?: string; photos?: string[]; eventId?: string }) =>
      request<BroadcastResult>("/api/broadcasts", { method: "POST", body: JSON.stringify(body) }),

    lostFoundItems: () => request<LostFoundItem[]>("/api/lostfound"),
    createLostFoundItem: (body: { kind: "LOST" | "FOUND"; title: string; location?: string; photo?: string }) =>
      request<LostFoundItem & { notifiedCount: number }>("/api/lostfound", { method: "POST", body: JSON.stringify(body) }),

    contactMessages: () => request<ContactMessage[]>("/api/contact"),
    sendContactMessage: (body: { text: string; photo?: string }) =>
      request<ContactMessage>("/api/contact", { method: "POST", body: JSON.stringify(body) }),
    markContactMessageRead: (id: string, read = true) =>
      request<ContactMessage>(`/api/contact/${id}`, { method: "PATCH", body: JSON.stringify({ read }) }),

    roomChecks: (params?: { floor?: string; room?: string }) => {
      const qs = new URLSearchParams();
      if (params?.floor) qs.set("floor", params.floor);
      if (params?.room) qs.set("room", params.room);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<RoomCheck[]>(`/api/roomchecks${suffix}`);
    },
    createRoomCheck: (body: { room: string; result: "OK" | "ISSUES"; notes?: string }) =>
      request<RoomCheck>("/api/roomchecks", { method: "POST", body: JSON.stringify(body) }),

    adminCheckouts: () => request<PublicUser[]>("/api/admin/checkouts"),
    sendCheckoutReminder: (residentId: string) =>
      request<{ ok: true }>(`/api/admin/checkouts/${residentId}/remind`, { method: "POST" }),
    adminActivity: () => request<ActivityItem[]>("/api/admin/activity"),
    adminSearch: (q: string) =>
      request<{ residents: PublicUser[]; listings: Listing[]; tickets: Ticket[] }>(
        `/api/admin/search?q=${encodeURIComponent(q)}`
      ),

    createLeadershipReport: (body: { title: string; text: string }) =>
      request<LeadershipReport>("/api/leadership/reports", { method: "POST", body: JSON.stringify(body) }),
    leadershipReportsMine: () => request<LeadershipReport[]>("/api/leadership/reports/mine"),
    leadershipReports: () => request<LeadershipReport[]>("/api/leadership/reports"),
    markLeadershipReportRead: (id: string) =>
      request<LeadershipReport>(`/api/leadership/reports/${id}/read`, { method: "PATCH" }),
    leadershipDormsOverview: () => request<DormLeadershipOverview[]>("/api/leadership/dorms-overview"),
    explanatoryNotes: (dormId?: number) =>
      request<ExplanatoryNote[]>(`/api/leadership/explanatory-notes${dormId ? `?dormId=${dormId}` : ""}`),
    createExplanatoryNote: (body: { room: string; residentName: string; reason: string; text: string }) =>
      request<ExplanatoryNote>("/api/leadership/explanatory-notes", { method: "POST", body: JSON.stringify(body) }),
    leadershipContacts: (dormId?: number) =>
      request<PublicUser[]>(`/api/leadership/contacts${dormId ? `?dormId=${dormId}` : ""}`),

    grades: () => request<GradeRecord[]>("/api/academics/grades"),
    schedule: () => request<{ entries: ScheduleEntry[]; currentParity: WeekParity }>("/api/academics/schedule"),
    certificates: () => request<CertificateRequest[]>("/api/academics/certificates"),
    createCertificateRequest: (body: { type: string; comment?: string; sealType?: SealType }) =>
      request<CertificateRequest>("/api/academics/certificates", { method: "POST", body: JSON.stringify(body) }),

    invoices: () => request<InvoiceRequest[]>("/api/academics/invoices"),
    createInvoiceRequest: (body: { purpose: string; comment?: string }) =>
      request<InvoiceRequest>("/api/academics/invoices", { method: "POST", body: JSON.stringify(body) }),
    updateInvoiceRequest: (id: string, body: { status: InvoiceStatus; amount?: number }) =>
      request<InvoiceRequest>(`/api/academics/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    facilities: () => request<Facility[]>("/api/facilities"),
    facilitySlots: (facilityId: string, date: string) =>
      request<FacilitySlot[]>(`/api/facilities/${facilityId}/slots?date=${date}`),
    myFacilityBookings: () => request<FacilityBooking[]>("/api/facilities/bookings/mine"),
    bookFacilitySlot: (facilityId: string, body: { date: string; startTime: string }) =>
      request<FacilityBooking>(`/api/facilities/${facilityId}/bookings`, { method: "POST", body: JSON.stringify(body) }),
    cancelFacilityBooking: (id: string) => request<{ ok: true }>(`/api/facilities/bookings/${id}`, { method: "DELETE" }),

    canteenMenu: () => request<MenuItem[]>("/api/canteen/menu"),
    addMenuItem: (body: { dayOfWeek: number; mealType: string; name: string; price: number }) =>
      request<MenuItem>("/api/canteen/menu", { method: "POST", body: JSON.stringify(body) }),
    deleteMenuItem: (id: string) => request<{ ok: true }>(`/api/canteen/menu/${id}`, { method: "DELETE" }),

    roommateRequests: () => request<RoommateRequest[]>("/api/roommate-requests"),
    myRoommateRequests: () => request<RoommateRequest[]>("/api/roommate-requests/mine"),
    createRoommateRequest: (body: { type: RoommateRequestType; desiredRoom?: string; description: string }) =>
      request<RoommateRequest>("/api/roommate-requests", { method: "POST", body: JSON.stringify(body) }),
    updateRoommateRequestStatus: (id: string, status: RoommateRequestStatus) =>
      request<RoommateRequest>(`/api/roommate-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

    materialLogs: () => request<MaterialLog[]>("/api/material-logs"),
    createMaterialLog: (body: { title: string; description?: string; photos?: string[] }) =>
      request<MaterialLog>("/api/material-logs", { method: "POST", body: JSON.stringify(body) }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
