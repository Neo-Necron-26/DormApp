export type Role = "STUDENT" | "ADMIN" | "LEADERSHIP";
export type ResidentRole = "FLOOR_MONITOR" | "INSPECTOR" | "NEWS_EDITOR" | "REGISTRAR";
export type FundingType = "BUDGET" | "PAID";

export interface PublicUser {
  id: string;
  login: string;
  role: Role;
  residentRole: ResidentRole | null;
  fullName: string;
  initials: string;
  dormId: number;
  room: string;
  section: string | null;
  phone: string | null;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  medicalNotes: string | null;
  maxId: string | null;
  maxVisible: boolean;
  verified: boolean;
  dealsCount: number;
  balance: number;
  checkoutDate: string | null;
  loggedIntoApp: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  fundingType: FundingType;
  institute: string | null;
  studyGroup: string | null;
  studyStatus: string | null;
  programName: string | null;
  programLevel: string | null;
  studyForm: string | null;
  admissionYear: number | null;
  carPlate: string | null;
  inn: string | null;
  snils: string | null;
  birthDate: string | null;
  passportReplacementConfirmed: boolean;
}

export type ListingStatus = "ACTIVE" | "SOLD";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: string;
  isUShop: boolean;
  photos: string[];
  status: ListingStatus;
  dormId: number;
  room: string;
  createdAt: string;
  isFavorited: boolean;
  seller: Pick<PublicUser, "id" | "fullName" | "initials" | "verified" | "maxId" | "maxVisible" | "dealsCount" | "createdAt">;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface AdminStats {
  studentsCount: number;
  listingsCount: number;
  verifiedCount: number;
  notLoggedInCount: number;
  openTicketsCount: number;
  pendingAppealsCount: number;
}

export type TicketStatus = "NEW" | "IN_PROGRESS" | "DONE";

export interface Ticket {
  id: string;
  category: string;
  description: string;
  status: TicketStatus;
  comment: string | null;
  photos: string[];
  dormId: number;
  room: string;
  createdAt: string;
  updatedAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "initials">;
}

export type AppealStatus = "PENDING" | "IN_REVIEW" | "RESOLVED";

export interface Appeal {
  id: string;
  topic: string;
  text: string;
  anonymous: boolean;
  status: AppealStatus;
  response: string | null;
  photos: string[];
  routedToBastion: boolean;
  dormId: number;
  createdAt: string;
  respondedAt: string | null;
  resident: Pick<PublicUser, "id" | "fullName" | "room"> | null;
}

export type PaymentPeriod = "MONTH" | "QUARTER" | "YEAR";
export type PaymentMethod = "SBP" | "CARD";

export interface Payment {
  id: string;
  amount: number;
  period: PaymentPeriod;
  method: PaymentMethod;
  receiptNo: string;
  createdAt: string;
}

export interface PaymentsSummary {
  balance: number;
  monthlyRate: number;
  history: Payment[];
}

export interface DormEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  dormId: number;
  isSfu: boolean;
  photos: string[];
  createdAt: string;
}

export type ChatChannelType = "DORM" | "SECTION" | "ANNOUNCEMENTS" | "CAMPUS" | "DM" | "SFU_ANNOUNCEMENTS";

export interface ChatChannelSummary {
  id: string;
  type: ChatChannelType;
  dormId: number | null;
  section: string | null;
  canPost: boolean;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  peer?: Pick<PublicUser, "id" | "fullName" | "initials" | "verified"> | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  photos: string[];
  eventId: string | null;
  createdAt: string;
  channelId: string;
  author: Pick<PublicUser, "id" | "fullName" | "initials" | "role">;
}

export type NotificationType =
  | "TICKET_STATUS"
  | "APPEAL_RESPONSE"
  | "ANNOUNCEMENT"
  | "EVENT"
  | "CHAT"
  | "LOST_FOUND"
  | "ROLE_ASSIGNED"
  | "LOGIN"
  | "MESSAGE"
  | "CHECKOUT_REMINDER"
  | "ROOM_CHECK"
  | "CERTIFICATE_STATUS"
  | "INVOICE_STATUS";

export interface BroadcastResult {
  message: ChatMessage;
  deliveredCount: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkType: string | null;
  linkId: string | null;
  read: boolean;
  createdAt: string;
}

export type LostFoundKind = "LOST" | "FOUND";

export interface LostFoundItem {
  id: string;
  kind: LostFoundKind;
  title: string;
  location: string | null;
  photo: string | null;
  dormId: number;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "initials">;
}

export interface ContactMessage {
  id: string;
  text: string;
  photo: string | null;
  dormId: number;
  read: boolean;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "room">;
}

export type RoomCheckResult = "OK" | "ISSUES";

export interface RoomCheck {
  id: string;
  dormId: number;
  room: string;
  result: RoomCheckResult;
  notes: string | null;
  createdAt: string;
  checkedBy: Pick<PublicUser, "id" | "fullName" | "initials">;
}

export interface LeadershipReport {
  id: string;
  dormId: number;
  title: string;
  text: string;
  read: boolean;
  createdAt: string;
  author: Pick<PublicUser, "id" | "fullName">;
}

export interface ExplanatoryNote {
  id: string;
  dormId: number;
  room: string;
  residentName: string;
  reason: string;
  text: string;
  createdAt: string;
  createdBy: Pick<PublicUser, "id" | "fullName">;
}

export type MaterialLogStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MaterialLog {
  id: string;
  title: string;
  description: string | null;
  photos: string[];
  status: MaterialLogStatus;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "room">;
}

export interface DormLeadershipOverview {
  dormId: number;
  nameRu: string;
  residentsCount: number;
  totalDebt: number;
  explanatoryNotesCount: number;
  openAppealsCount: number;
  pendingReportsCount: number;
}

export interface GradeRecord {
  id: string;
  semesterLabel: string;
  subject: string;
  kind: string;
  grade: string;
  hours: string | null;
}

export type WeekParity = "ALL" | "ODD" | "EVEN";

export interface ScheduleEntry {
  id: string;
  studyGroup: string;
  dayOfWeek: number;
  weekParity: WeekParity;
  startTime: string;
  endTime: string;
  subject: string;
  type: string;
  room: string | null;
  teacher: string | null;
}

export type CertificateStatus = "NEW" | "READY" | "ISSUED";
export type DocumentCategory = "CERTIFICATE" | "CONTRACT" | "FOREIGN";
export type SealType = "OFFICIAL" | "INSTITUTE";

export interface CertificateRequest {
  id: string;
  type: string;
  category: DocumentCategory;
  sealType: SealType | null;
  status: CertificateStatus;
  comment: string | null;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "room">;
}

// The catalog backing "Справки" — expanded from a flat certificate list
// into three departments matching how the university itself organizes them
// (Институт: справки + договоры; foreign-student documents are their own
// group since only international students need them). `requiresSeal` marks
// the one type ("Справка об обучении") the student can order with either an
// official state seal or an institute seal; everything else has no seal
// choice (the foreign-student "выписка из приказа" always carries the
// official seal by convention, so it isn't offered as a pick).
export interface DocumentTypeInfo {
  key: string;
  label: string;
  category: DocumentCategory;
  fundingTypes: FundingType[] | "ALL";
  requiresSeal?: boolean;
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { key: "enrollment_certificate", label: "Справка об обучении", category: "CERTIFICATE", fundingTypes: "ALL", requiresSeal: true },
  { key: "scholarship_certificate", label: "Справка о размере стипендии", category: "CERTIFICATE", fundingTypes: ["BUDGET"] },
  { key: "tuition_payment_certificate", label: "Справка об оплате обучения", category: "CERTIFICATE", fundingTypes: ["PAID"] },
  { key: "military_certificate", label: "Справка в военкомат", category: "CERTIFICATE", fundingTypes: "ALL" },
  { key: "additional_agreement", label: "Дополнительное соглашение", category: "CONTRACT", fundingTypes: "ALL" },
  { key: "tuition_discount_agreement", label: "Допсоглашение о снижении стоимости обучения", category: "CONTRACT", fundingTypes: ["PAID"] },
  { key: "education_loan_agreement", label: "Договор об образовательном кредите", category: "CONTRACT", fundingTypes: ["PAID"] },
  { key: "financial_aid_agreement", label: "Допсоглашение о материальной помощи", category: "CONTRACT", fundingTypes: "ALL" },
  { key: "order_extract", label: "Выписка из приказа (например, о переводе)", category: "FOREIGN", fundingTypes: "ALL" },
];

export function allowedDocumentTypes(fundingType: FundingType): DocumentTypeInfo[] {
  return DOCUMENT_TYPES.filter((d) => d.fundingTypes === "ALL" || d.fundingTypes.includes(fundingType));
}

export type InvoiceStatus = "REQUESTED" | "READY" | "PAID";

export interface InvoiceRequest {
  id: string;
  purpose: string;
  amount: number | null;
  status: InvoiceStatus;
  comment: string | null;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "room">;
}

// The set of invoice purposes a student can request in advance — matches
// what the "Бухгалтерия" department actually issues invoices for.
export const INVOICE_PURPOSES = ["Проживание в общежитии", "Гостиничные услуги", "Оплата обучения"] as const;

// Monday of week 1 (ODD) of the current academic term — the standard
// Russian university biweekly "чётная/нечётная неделя" rotation is just a
// parity count of ISO weeks from a fixed start date, so this one constant
// drives both the server's schedule filter and the client's toggle default.
const WEEK_PARITY_EPOCH_MS = Date.UTC(2026, 7, 31); // Mon, 2026-08-31

export function weekParityAt(date: Date): "ODD" | "EVEN" {
  const diffDays = Math.floor((date.getTime() - WEEK_PARITY_EPOCH_MS) / (24 * 3600 * 1000));
  const diffWeeks = Math.floor(diffDays / 7);
  return ((diffWeeks % 2) + 2) % 2 === 0 ? "ODD" : "EVEN";
}

export type FacilityType = "LAUNDRY" | "GYM" | "COUNSELING";

export interface Facility {
  id: string;
  dormId: number;
  name: string;
  type: FacilityType;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}

export interface FacilitySlot {
  startTime: string;
  booked: boolean;
  mine: boolean;
}

export interface FacilityBooking {
  id: string;
  date: string;
  startTime: string;
  createdAt: string;
  facility: Pick<Facility, "id" | "name" | "type">;
  resident: Pick<PublicUser, "id" | "fullName" | "room">;
}

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface MenuItem {
  id: string;
  dormId: number;
  dayOfWeek: number;
  mealType: MealType;
  name: string;
  price: number;
}

export type RoommateRequestType = "SWAP" | "SEEK_ROOMMATE";
export type RoommateRequestStatus = "ACTIVE" | "CLOSED";

export interface RoommateRequest {
  id: string;
  type: RoommateRequestType;
  room: string;
  desiredRoom: string | null;
  description: string;
  status: RoommateRequestStatus;
  createdAt: string;
  resident: Pick<PublicUser, "id" | "fullName" | "room" | "initials">;
}

export type ActivityItemType = "TICKET" | "APPEAL" | "CONTACT" | "REGISTRATION" | "LOGIN" | "MESSAGE";

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  text: string;
  createdAt: string;
}

export type EvictionTier = "NEUTRAL" | "REMINDER" | "WARNING" | "OVERDUE";

export interface EvictionInfo {
  daysLeft: number;
  tier: EvictionTier;
}

/** Mirrors the prototype's smart eviction counter thresholds (🔔 30d / ⚠️ 7d / 🚨 overdue). */
export function evictionInfo(checkoutDate: string | null): EvictionInfo | null {
  if (!checkoutDate) return null;
  const days = Math.ceil((new Date(checkoutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { daysLeft: days, tier: "OVERDUE" };
  if (days <= 7) return { daysLeft: days, tier: "WARNING" };
  if (days <= 30) return { daysLeft: days, tier: "REMINDER" };
  return { daysLeft: days, tier: "NEUTRAL" };
}

/**
 * Mobile floating tab-bar look, per the design spec's 3 interchangeable prototype
 * variants (§6.5). This is a component/build-time setting, not a resident-facing
 * preference — see GlassTabBar.tsx for the single switch point.
 */
export type NavVariant = "pill" | "dock" | "segment";
