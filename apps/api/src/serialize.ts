import type {
  User,
  Listing as PrismaListing,
  Ticket as PrismaTicket,
  Appeal as PrismaAppeal,
  Payment as PrismaPayment,
  Event as PrismaEvent,
  ChatMessage as PrismaChatMessage,
  Notification as PrismaNotification,
  LostFoundItem as PrismaLostFoundItem,
  ContactMessage as PrismaContactMessage,
  RoomCheck as PrismaRoomCheck,
  GradeRecord as PrismaGradeRecord,
  ScheduleEntry as PrismaScheduleEntry,
  CertificateRequest as PrismaCertificateRequest,
  Facility as PrismaFacility,
  FacilityBooking as PrismaFacilityBooking,
  MenuItem as PrismaMenuItem,
  RoommateRequest as PrismaRoommateRequest,
  InvoiceRequest as PrismaInvoiceRequest,
  MaterialLog as PrismaMaterialLog,
} from "@prisma/client";
import type {
  PublicUser,
  Listing,
  Role,
  ResidentRole,
  FundingType,
  Ticket,
  Appeal,
  Payment,
  DormEvent,
  ChatMessage,
  AppNotification,
  LostFoundItem,
  ContactMessage,
  RoomCheck,
  GradeRecord,
  ScheduleEntry,
  CertificateRequest,
  CertificateStatus,
  DocumentCategory,
  SealType,
  WeekParity,
  Facility,
  FacilityType,
  FacilityBooking,
  MenuItem,
  MealType,
  RoommateRequest,
  RoommateRequestType,
  RoommateRequestStatus,
  InvoiceRequest,
  InvoiceStatus,
  MaterialLog,
  MaterialLogStatus,
} from "@sfu/shared";

export function serializeUser(u: User): PublicUser {
  return {
    id: u.id,
    login: u.login,
    role: u.role as Role,
    residentRole: (u.residentRole as ResidentRole | null) ?? null,
    fullName: u.fullName,
    initials: u.initials,
    dormId: u.dormId,
    room: u.room,
    section: u.section,
    phone: u.phone,
    email: u.email,
    emergencyContactName: u.emergencyContactName,
    emergencyContactPhone: u.emergencyContactPhone,
    emergencyContactRelation: u.emergencyContactRelation,
    medicalNotes: u.medicalNotes,
    maxId: u.maxId,
    maxVisible: u.maxVisible,
    verified: u.verified,
    dealsCount: u.dealsCount,
    balance: u.balance,
    checkoutDate: u.checkoutDate ? u.checkoutDate.toISOString() : null,
    loggedIntoApp: u.lastLoginAt !== null,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    fundingType: u.fundingType as FundingType,
    institute: u.institute,
    studyGroup: u.studyGroup,
    studyStatus: u.studyStatus,
    programName: u.programName,
    programLevel: u.programLevel,
    studyForm: u.studyForm,
    admissionYear: u.admissionYear,
    carPlate: u.carPlate,
    inn: u.inn,
    snils: u.snils,
    birthDate: u.birthDate,
    passportReplacementConfirmed: u.passportReplacementConfirmed,
  };
}

export function serializeTicket(t: PrismaTicket & { resident: User }): Ticket {
  return {
    id: t.id,
    category: t.category,
    description: t.description,
    status: t.status as Ticket["status"],
    comment: t.comment,
    photos: JSON.parse(t.photos || "[]"),
    dormId: t.dormId,
    room: t.room,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resident: { id: t.resident.id, fullName: t.resident.fullName, initials: t.resident.initials },
  };
}

export function serializeAppeal(a: PrismaAppeal & { resident: User }): Appeal {
  return {
    id: a.id,
    topic: a.topic,
    text: a.text,
    anonymous: a.anonymous,
    status: a.status as Appeal["status"],
    response: a.response,
    photos: JSON.parse(a.photos || "[]"),
    routedToBastion: a.routedToBastion,
    dormId: a.dormId,
    createdAt: a.createdAt.toISOString(),
    respondedAt: a.respondedAt ? a.respondedAt.toISOString() : null,
    resident: a.anonymous
      ? null
      : { id: a.resident.id, fullName: a.resident.fullName, room: a.resident.room },
  };
}

export function serializePayment(p: PrismaPayment): Payment {
  return {
    id: p.id,
    amount: p.amount,
    period: p.period as Payment["period"],
    method: p.method as Payment["method"],
    receiptNo: p.receiptNo,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeEvent(e: PrismaEvent): DormEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date.toISOString(),
    dormId: e.dormId,
    isSfu: e.isSfu,
    photos: JSON.parse(e.photos || "[]"),
    createdAt: e.createdAt.toISOString(),
  };
}

export function serializeChatMessage(m: PrismaChatMessage & { author: User }): ChatMessage {
  return {
    id: m.id,
    text: m.text,
    photos: JSON.parse(m.photos || "[]"),
    eventId: m.eventId,
    createdAt: m.createdAt.toISOString(),
    channelId: m.channelId,
    author: { id: m.author.id, fullName: m.author.fullName, initials: m.author.initials, role: m.author.role as Role },
  };
}

export function serializeNotification(n: PrismaNotification): AppNotification {
  return {
    id: n.id,
    type: n.type as AppNotification["type"],
    title: n.title,
    body: n.body,
    linkType: n.linkType,
    linkId: n.linkId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export function serializeListing(
  l: PrismaListing & { seller: User; favorites?: { userId: string }[] },
  viewerId?: string
): Listing {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    negotiable: l.negotiable,
    category: l.category,
    isUShop: l.isUShop,
    photos: JSON.parse(l.photos || "[]"),
    status: l.status as Listing["status"],
    dormId: l.dormId,
    room: l.room,
    createdAt: l.createdAt.toISOString(),
    isFavorited: viewerId ? !!l.favorites?.some((f) => f.userId === viewerId) : false,
    seller: {
      id: l.seller.id,
      fullName: l.seller.fullName,
      initials: l.seller.initials,
      verified: l.seller.verified,
      maxId: l.seller.maxId,
      maxVisible: l.seller.maxVisible,
      dealsCount: l.seller.dealsCount,
      createdAt: l.seller.createdAt.toISOString(),
    },
  };
}

export function serializeLostFoundItem(item: PrismaLostFoundItem & { resident: User }): LostFoundItem {
  return {
    id: item.id,
    kind: item.kind as LostFoundItem["kind"],
    title: item.title,
    location: item.location,
    photo: item.photo,
    dormId: item.dormId,
    createdAt: item.createdAt.toISOString(),
    resident: { id: item.resident.id, fullName: item.resident.fullName, initials: item.resident.initials },
  };
}

export function serializeContactMessage(m: PrismaContactMessage & { resident: User }): ContactMessage {
  return {
    id: m.id,
    text: m.text,
    photo: m.photo,
    dormId: m.dormId,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
    resident: { id: m.resident.id, fullName: m.resident.fullName, room: m.resident.room },
  };
}

export function serializeRoomCheck(c: PrismaRoomCheck & { checkedBy: User }): RoomCheck {
  return {
    id: c.id,
    dormId: c.dormId,
    room: c.room,
    result: c.result as RoomCheck["result"],
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    checkedBy: { id: c.checkedBy.id, fullName: c.checkedBy.fullName, initials: c.checkedBy.initials },
  };
}

export function serializeGradeRecord(g: PrismaGradeRecord): GradeRecord {
  return {
    id: g.id,
    semesterLabel: g.semesterLabel,
    subject: g.subject,
    kind: g.kind,
    grade: g.grade,
    hours: g.hours,
  };
}

export function serializeScheduleEntry(s: PrismaScheduleEntry): ScheduleEntry {
  return {
    id: s.id,
    studyGroup: s.studyGroup,
    dayOfWeek: s.dayOfWeek,
    weekParity: s.weekParity as WeekParity,
    startTime: s.startTime,
    endTime: s.endTime,
    subject: s.subject,
    type: s.type,
    room: s.room,
    teacher: s.teacher,
  };
}

export function serializeCertificateRequest(c: PrismaCertificateRequest & { resident: User }): CertificateRequest {
  return {
    id: c.id,
    type: c.type,
    category: c.category as DocumentCategory,
    sealType: (c.sealType as SealType | null) ?? null,
    status: c.status as CertificateStatus,
    comment: c.comment,
    createdAt: c.createdAt.toISOString(),
    resident: { id: c.resident.id, fullName: c.resident.fullName, room: c.resident.room },
  };
}

export function serializeInvoiceRequest(i: PrismaInvoiceRequest & { resident: User }): InvoiceRequest {
  return {
    id: i.id,
    purpose: i.purpose,
    amount: i.amount,
    status: i.status as InvoiceStatus,
    comment: i.comment,
    createdAt: i.createdAt.toISOString(),
    resident: { id: i.resident.id, fullName: i.resident.fullName, room: i.resident.room },
  };
}

export function serializeFacility(f: PrismaFacility): Facility {
  return {
    id: f.id,
    dormId: f.dormId,
    name: f.name,
    type: f.type as FacilityType,
    openTime: f.openTime,
    closeTime: f.closeTime,
    slotMinutes: f.slotMinutes,
  };
}

export function serializeFacilityBooking(b: PrismaFacilityBooking & { facility: PrismaFacility; resident: User }): FacilityBooking {
  return {
    id: b.id,
    date: b.date,
    startTime: b.startTime,
    createdAt: b.createdAt.toISOString(),
    facility: { id: b.facility.id, name: b.facility.name, type: b.facility.type as FacilityType },
    resident: { id: b.resident.id, fullName: b.resident.fullName, room: b.resident.room },
  };
}

export function serializeMenuItem(m: PrismaMenuItem): MenuItem {
  return {
    id: m.id,
    dormId: m.dormId,
    dayOfWeek: m.dayOfWeek,
    mealType: m.mealType as MealType,
    name: m.name,
    price: m.price,
  };
}

export function serializeRoommateRequest(r: PrismaRoommateRequest & { resident: User }): RoommateRequest {
  return {
    id: r.id,
    type: r.type as RoommateRequestType,
    room: r.room,
    desiredRoom: r.desiredRoom,
    description: r.description,
    status: r.status as RoommateRequestStatus,
    createdAt: r.createdAt.toISOString(),
    resident: { id: r.resident.id, fullName: r.resident.fullName, room: r.resident.room, initials: r.resident.initials },
  };
}

export function serializeMaterialLog(m: PrismaMaterialLog & { resident: User }): MaterialLog {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    photos: JSON.parse(m.photos || "[]"),
    status: m.status as MaterialLogStatus,
    createdAt: m.createdAt.toISOString(),
    resident: { id: m.resident.id, fullName: m.resident.fullName, room: m.resident.room },
  };
}
