import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "sfu2026";
const sectionOf = (room: string) => (/^\d{3}$/.test(room) ? String(Math.floor(Number(room) / 100)) : null);

// Copies the bundled placeholder photo into /uploads under a stable name, so a
// seeded ticket can reference a real, resolvable /uploads/... URL — proves the
// photo-attachment pipeline end to end without relying on a live upload.
function seedPhotoUrl(): string {
  const filename = "seed-repair-photo.png";
  const uploadsDir = path.join(process.cwd(), "uploads");
  const dest = path.join(uploadsDir, filename);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), "prisma", "seed-assets", "repair-photo.png"), dest);
  }
  return `/uploads/${filename}`;
}

const LISTINGS_SEED = [
  { title: "Электрочайник Bosch", description: "Почти новый, пользовались месяц, есть коробка.", price: 900, category: "Бытовая техника", room: "412" },
  { title: "Учебник по матанализу, Демидович", description: "Задачник для 1-2 курса, все решения карандашом стёрты.", price: 400, category: "Учёба и книги", room: "118" },
  { title: "Сушилка для белья напольная", description: "Складная, компактная, влезает под кровать.", price: 600, category: "Бытовая техника", room: "305", status: "SOLD" },
  { title: "Велосипед Stels Navigator", description: "Городской, 21 скорость, требует смазки цепи.", price: 7500, category: "Одежда и вещи", room: "210" },
  { title: "Настольная лампа IKEA", description: "Белая, регулировка яркости, шнур 1.5м.", price: 550, category: "Бытовая техника", room: "412" },
  { title: "Гитара акустическая Yamaha", description: "Комплект с чехлом и медиаторами, звучит отлично.", price: 5200, category: "Одежда и вещи", room: "509" },
  { title: "Учебник English Grammar in Use", description: "Синий Мёрфи с ответами, почти не использовалась.", price: 700, category: "Учёба и книги", room: "118" },
  { title: "Мультиварка Redmond 5л", description: "Отдам недорого, уезжаю на стажировку.", price: 1800, category: "Бытовая техника", room: "220" },
  { title: "Репетитор по английскому, разговорный", description: "Готовлю к IELTS и разговорной практике, 1 час — 700₽.", price: 700, category: "Услуги и репетиторство", room: "305", negotiable: true },
  { title: "Монитор Samsung 24\"", description: "Full HD, IPS, без битых пикселей, есть HDMI кабель.", price: 6800, category: "Бытовая техника", room: "620", status: "SOLD" },
  { title: "Куртка зимняя, L", description: "Тёплая, до -25, почти новая, размер L.", price: 2500, category: "Одежда и вещи", room: "210" },
  { title: "Ищу учебник по физике, Иродов", description: "Нужен на семестр, куплю или возьму на время.", price: 0, category: "Ищу / Куплю", room: "620", negotiable: true },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const student = await prisma.user.upsert({
    where: { login: "Example-TT26" },
    update: {},
    create: {
      login: "Example-TT26",
      passwordHash,
      role: "STUDENT",
      fullName: "Анна Ковалёва",
      initials: "АК",
      dormId: 6,
      room: "310",
      section: sectionOf("310"),
      phone: "+7 902 123-45-67",
      email: "kovaleva.a@sfu-kras.ru",
      emergencyContactName: "Ковалёва Ирина Петровна",
      emergencyContactPhone: "+7 913 555-11-22",
      emergencyContactRelation: "Мама",
      medicalNotes: "Аллергия на пенициллин",
      maxId: "max.ru/id48213",
      maxVisible: true,
      verified: true,
      dealsCount: 4,
      balance: 0,
      checkoutDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      lastLoginAt: new Date(),
      fundingType: "BUDGET",
      institute: "Институт космических и информационных технологий",
      studyGroup: "ПИ24-16",
      studyStatus: "Учащийся",
      programName: "Программная инженерия",
      programLevel: "Бакалавриат",
      studyForm: "Очная",
      admissionYear: 2024,
    },
  });

  const admin = await prisma.user.upsert({
    where: { login: "Dorm6-Admin" },
    update: {},
    create: {
      login: "Dorm6-Admin",
      passwordHash,
      role: "ADMIN",
      fullName: "Администратор общежития № 6",
      initials: "А6",
      dormId: 6,
      room: "—",
      phone: "+7 900 000-00-06",
      email: "admin.dorm6@example.org",
      maxVisible: false,
      verified: true,
      lastLoginAt: new Date(),
    },
  });

  const leadership = await prisma.user.upsert({
    where: { login: "Campus-Lead" },
    update: {},
    create: {
      login: "Campus-Lead",
      passwordHash,
      role: "LEADERSHIP",
      fullName: "Руководитель кампуса",
      initials: "РК",
      dormId: 6,
      room: "—",
      phone: "+7 900 000-00-01",
      email: "leadership@example.org",
      maxVisible: false,
      verified: true,
      lastLoginAt: new Date(),
    },
  });

  const extraResidents = [
    { login: "Petrova-EI25", fullName: "Елена Петрова", initials: "ЕП", room: "118", verified: true, residentRole: null as string | null, checkoutDate: null as Date | null, fundingType: "PAID" },
    { login: "Sidorov-MK24", fullName: "Максим Сидоров", initials: "МС", room: "412", verified: false, residentRole: "FLOOR_MONITOR", checkoutDate: new Date(Date.now() + 5 * 24 * 3600 * 1000), fundingType: "BUDGET" },
    { login: "Volkova-DS26", fullName: "Дарья Волкова", initials: "ДВ", room: "220", verified: true, residentRole: "NEWS_EDITOR", checkoutDate: new Date(Date.now() - 3 * 24 * 3600 * 1000), fundingType: "BUDGET" },
    { login: "Nikitin-AV23", fullName: "Артём Никитин", initials: "АН", room: "509", verified: true, residentRole: "INSPECTOR", checkoutDate: null, fundingType: "PAID" },
    { login: "Belova-OT25", fullName: "Ольга Белова", initials: "ОБ", room: "305", verified: false, residentRole: "REGISTRAR", checkoutDate: new Date(Date.now() + 90 * 24 * 3600 * 1000), fundingType: "BUDGET" },
    { login: "Frolov-IK24", fullName: "Иван Фролов", initials: "ИФ", room: "620", verified: true, residentRole: null, checkoutDate: null, fundingType: "BUDGET" },
    { login: "Gromova-YS26", fullName: "Юлия Громова", initials: "ЮГ", room: "210", verified: false, residentRole: null, checkoutDate: null, fundingType: "PAID" },
  ];

  const residents = [student];
  for (const r of extraResidents) {
    const u = await prisma.user.upsert({
      where: { login: r.login },
      update: {},
      create: {
        login: r.login,
        passwordHash,
        role: "STUDENT",
        fullName: r.fullName,
        initials: r.initials,
        dormId: 6,
        room: r.room,
        section: sectionOf(r.room),
        residentRole: r.residentRole,
        phone: "+7 9" + Math.floor(10000000 + Math.random() * 89999999),
        email: r.login.toLowerCase() + "@sfu-kras.ru",
        maxId: r.verified ? `max.ru/id${10000 + Math.floor(Math.random() * 89999)}` : null,
        maxVisible: r.verified,
        verified: r.verified,
        dealsCount: Math.floor(Math.random() * 6),
        balance: Math.round((Math.random() * 3 - 1.5) * 1450),
        checkoutDate: r.checkoutDate,
        lastLoginAt: Math.random() > 0.3 ? new Date() : null,
        fundingType: r.fundingType,
        institute: "Институт космических и информационных технологий",
        studyGroup: "ПИ24-16",
        studyStatus: "Учащийся",
        programName: "Программная инженерия",
        programLevel: "Бакалавриат",
        studyForm: "Очная",
        admissionYear: 2024,
      },
    });
    residents.push(u);
  }

  const existingListings = await prisma.listing.count();
  const seededListings: Awaited<ReturnType<typeof prisma.listing.create>>[] = [];
  if (existingListings === 0) {
    for (let i = 0; i < LISTINGS_SEED.length; i++) {
      const seed = LISTINGS_SEED[i];
      const seller = residents[i % residents.length];
      const listing = await prisma.listing.create({
        data: {
          ...seed,
          dormId: 6,
          sellerId: seller.id,
          createdAt: new Date(Date.now() - i * 3600 * 1000 * 7),
        },
      });
      seededListings.push(listing);
    }

    // A couple of favorites, so the "Избранное" tab isn't empty on first launch.
    const favoritePairs: [number, number][] = [
      [0, 5], // student favorites the guitar
      [1, 9], // Petrova favorites the (sold) monitor
    ];
    for (const [residentIdx, listingIdx] of favoritePairs) {
      const resident = residents[residentIdx];
      const listing = seededListings[listingIdx];
      if (resident && listing && listing.sellerId !== resident.id) {
        await prisma.favorite.create({ data: { userId: resident.id, listingId: listing.id } });
      }
    }
  }

  await prisma.payment.upsert({
    where: { id: "seed-payment-1" },
    update: {},
    create: {
      id: "seed-payment-1",
      amount: 1450,
      period: "MONTH",
      method: "SBP",
      receiptNo: "СФУ-00458213",
      residentId: student.id,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
  });

  const existingTickets = await prisma.ticket.count();
  if (existingTickets === 0) {
    await prisma.ticket.create({
      data: {
        category: "Сантехника",
        description: "Течёт кран на кухне блока, третий день капает.",
        status: "IN_PROGRESS",
        comment: "Мастер придёт во вторник после 15:00",
        photos: JSON.stringify([seedPhotoUrl()]),
        dormId: 6,
        room: student.room,
        residentId: student.id,
      },
    });
    await prisma.ticket.create({
      data: {
        category: "Электрика",
        description: "Не работает розетка у окна.",
        status: "NEW",
        dormId: 6,
        room: "412",
        residentId: residents[2].id,
      },
    });
  }

  const existingAppeals = await prisma.appeal.count();
  if (existingAppeals === 0) {
    await prisma.appeal.create({
      data: {
        topic: "Шумные соседи",
        text: "Соседи из 311 регулярно шумят после 23:00 по будням.",
        anonymous: true,
        status: "PENDING",
        dormId: 6,
        residentId: student.id,
      },
    });
  }

  const existingEvents = await prisma.event.count();
  let seededEventId: string | null = null;
  if (existingEvents === 0) {
    const event = await prisma.event.create({
      data: {
        title: "Осенний субботник",
        description: "Уборка территории у корпуса, встречаемся у входа в 11:00. Инвентарь выдаётся на вахте.",
        date: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        dormId: 6,
        photos: JSON.stringify(["IMG_2201.jpg"]),
      },
    });
    seededEventId = event.id;
  }

  // Chat channels + a few starter messages, so the app doesn't open to empty rooms.
  // (SQLite compound-unique indexes can't be queried with a literal `null` member,
  // so channels are found-or-created rather than upserted — same as chatService.ts.)
  async function getOrCreateChannel(type: string, dormId: number | null, section: string | null) {
    const existing = await prisma.chatChannel.findFirst({ where: { type, dormId, section } });
    if (existing) return existing;
    return prisma.chatChannel.create({ data: { type, dormId, section } });
  }

  const announcements = await getOrCreateChannel("ANNOUNCEMENTS", 6, null);
  const dormChat = await getOrCreateChannel("DORM", 6, null);
  const sectionChat = await getOrCreateChannel("SECTION", 6, "3");
  const campusChat = await getOrCreateChannel("CAMPUS", null, null);

  const existingMessages = await prisma.chatMessage.count();
  if (existingMessages === 0) {
    await prisma.chatMessage.create({
      data: {
        channelId: announcements.id,
        authorId: admin.id,
        text: "📢 Объявление администрации общежития №6\nПлановое отключение горячей воды 12 сентября с 9:00 до 18:00.",
        eventId: seededEventId,
      },
    });
    await prisma.chatMessage.create({
      data: { channelId: dormChat.id, authorId: residents[2].id, text: "Кто-нибудь видел зарядку от ноутбука на кухне 2 этажа?" },
    });
    await prisma.chatMessage.create({
      data: { channelId: sectionChat.id, authorId: student.id, text: "Соседи, у кого есть лишний удлинитель на вечер?" },
    });
    await prisma.chatMessage.create({
      data: { channelId: campusChat.id, authorId: residents[3].id, text: "Меняю место в общежитии №6 на №8, кому актуально — пишите в личку." },
    });
  }

  const existingLostFound = await prisma.lostFoundItem.count();
  if (existingLostFound === 0) {
    await prisma.lostFoundItem.create({
      data: {
        kind: "LOST",
        title: "Чёрный зонт-автомат",
        location: "Холл 1 этажа",
        dormId: 6,
        residentId: student.id,
      },
    });
    await prisma.lostFoundItem.create({
      data: {
        kind: "FOUND",
        title: "Связка ключей с брелоком-совой",
        location: "У входа в 3 подъезд",
        dormId: 6,
        residentId: residents[1].id,
      },
    });
  }

  const existingContactMessages = await prisma.contactMessage.count();
  if (existingContactMessages === 0) {
    await prisma.contactMessage.create({
      data: {
        text: "Не закрывается замок на входной двери блока, можно посмотреть?",
        dormId: 6,
        residentId: student.id,
      },
    });
    await prisma.contactMessage.create({
      data: {
        text: "Подскажите, пожалуйста, до какого числа нужно продлить пропуск для гостя?",
        dormId: 6,
        read: true,
        residentId: residents[3].id,
      },
    });
  }

  const inspector = residents.find((r) => r.login === "Nikitin-AV23")!;
  const existingRoomChecks = await prisma.roomCheck.count();
  if (existingRoomChecks === 0) {
    await prisma.roomCheck.create({
      data: { dormId: 6, room: "509", result: "OK", checkedById: inspector.id },
    });
    await prisma.roomCheck.create({
      data: {
        dormId: 6,
        room: "512",
        result: "ISSUES",
        notes: "Не работает розетка у окна, требуется электрик.",
        checkedById: inspector.id,
      },
    });
  }

  const existingReports = await prisma.leadershipReport.count();
  if (existingReports === 0) {
    await prisma.leadershipReport.create({
      data: {
        dormId: 6,
        title: "Отчёт по задолженностям за сентябрь",
        text: "5 жильцов имеют задолженность более 1000₽, направлены напоминания.",
        authorId: admin.id,
      },
    });
    await prisma.leadershipReport.create({
      data: {
        dormId: 6,
        title: "Инцидент на 4 этаже",
        text: "Повторное нарушение тишины жильцом комнаты 412, составлена объяснительная.",
        authorId: admin.id,
        read: true,
      },
    });
  }

  const existingNotes = await prisma.explanatoryNote.count();
  if (existingNotes === 0) {
    await prisma.explanatoryNote.create({
      data: {
        dormId: 6,
        room: "412",
        residentName: "Максим Сидоров",
        reason: "Нарушение тишины",
        text: "Повторное нарушение режима тишины после 23:00, зафиксировано соседями и комендантом.",
        createdById: admin.id,
      },
    });
  }

  const existingGrades = await prisma.gradeRecord.count();
  if (existingGrades === 0) {
    const GRADES: { semesterLabel: string; sortOrder: number; rows: { subject: string; kind: string; grade: string; hours: string }[] }[] = [
      {
        semesterLabel: "Курс 2, семестр 3, осень 2025-2026 уч. года",
        sortOrder: 3,
        rows: [
          { subject: "Объектно-ориентированное программирование", kind: "Зачёт", grade: "Зачёт", hours: "108 / 3" },
          { subject: "Проектирование программного обеспечения", kind: "Зачёт", grade: "Зачёт", hours: "72 / 2" },
          { subject: "Иностранный язык", kind: "Зачёт", grade: "Зачёт", hours: "72 / 2" },
          { subject: "Базы данных", kind: "Экзамен", grade: "Хор", hours: "180 / 5" },
          { subject: "Алгоритмы и структуры данных", kind: "Экзамен", grade: "Отл", hours: "180 / 5" },
          { subject: "Математическая статистика", kind: "Экзамен", grade: "Удовл", hours: "144 / 4" },
        ],
      },
      {
        semesterLabel: "Курс 1, семестр 2, весна 2024-2025 уч. года",
        sortOrder: 2,
        rows: [
          { subject: "Физика", kind: "Зачёт", grade: "Зачёт", hours: "144 / 4" },
          { subject: "Иностранный язык", kind: "Зачёт", grade: "Зачёт", hours: "72 / 2" },
          { subject: "Основы программирования", kind: "Экзамен", grade: "Отл", hours: "144 / 4" },
          { subject: "Математический анализ", kind: "Экзамен", grade: "Хор", hours: "180 / 5" },
          { subject: "Дискретная математика", kind: "Экзамен", grade: "Отл", hours: "144 / 4" },
        ],
      },
      {
        semesterLabel: "Курс 1, семестр 1, осень 2024-2025 уч. года",
        sortOrder: 1,
        rows: [
          { subject: "История России", kind: "Зачёт", grade: "Зачёт", hours: "72 / 2" },
          { subject: "Физическая культура и спорт", kind: "Зачёт", grade: "Зачёт", hours: "18 / 0.5" },
          { subject: "Информатика", kind: "Экзамен", grade: "Хор", hours: "144 / 4" },
          { subject: "Введение в профессию", kind: "Экзамен", grade: "Отл", hours: "144 / 4" },
          { subject: "Алгебра и геометрия", kind: "Экзамен", grade: "Удовл", hours: "180 / 5" },
        ],
      },
    ];
    for (const sem of GRADES) {
      for (const row of sem.rows) {
        await prisma.gradeRecord.create({
          data: { residentId: student.id, semesterLabel: sem.semesterLabel, sortOrder: sem.sortOrder, ...row },
        });
      }
    }
  }

  const existingSchedule = await prisma.scheduleEntry.count();
  if (existingSchedule === 0) {
    const SCHEDULE: { dayOfWeek: number; weekParity: string; startTime: string; endTime: string; subject: string; type: string; room: string; teacher: string }[] = [
      { dayOfWeek: 1, weekParity: "ALL", startTime: "09:00", endTime: "10:30", subject: "Базы данных", type: "Лекция", room: "УЛК 3-12", teacher: "Стоякин Е.В." },
      { dayOfWeek: 1, weekParity: "ODD", startTime: "10:40", endTime: "12:10", subject: "Базы данных", type: "Лабораторная", room: "УЛК 4-05", teacher: "Стоякин Е.В." },
      { dayOfWeek: 1, weekParity: "ALL", startTime: "13:00", endTime: "14:30", subject: "Иностранный язык", type: "Практика", room: "УЛК 2-18", teacher: "Ефимов Е.А." },
      { dayOfWeek: 2, weekParity: "ALL", startTime: "09:00", endTime: "10:30", subject: "Алгоритмы и структуры данных", type: "Лекция", room: "УЛК 3-01", teacher: "Кулишов А.А." },
      { dayOfWeek: 2, weekParity: "EVEN", startTime: "10:40", endTime: "12:10", subject: "Алгоритмы и структуры данных", type: "Практика", room: "УЛК 4-11", teacher: "Кулишов А.А." },
      { dayOfWeek: 3, weekParity: "ALL", startTime: "09:00", endTime: "10:30", subject: "Проектирование программного обеспечения", type: "Лекция", room: "УЛК 3-12", teacher: "Ярицин К.В." },
      { dayOfWeek: 3, weekParity: "ODD", startTime: "10:40", endTime: "12:10", subject: "Проектирование программного обеспечения", type: "Практика", room: "УЛК 4-05", teacher: "Ярицин К.В." },
      { dayOfWeek: 3, weekParity: "ALL", startTime: "14:40", endTime: "16:10", subject: "Физическая культура и спорт", type: "Практика", room: "Спортзал", teacher: "Каф. физвоспитания" },
      { dayOfWeek: 4, weekParity: "ALL", startTime: "09:00", endTime: "10:30", subject: "Математическая статистика", type: "Лекция", room: "УЛК 2-24", teacher: "Прохоренко М.О." },
      { dayOfWeek: 4, weekParity: "EVEN", startTime: "10:40", endTime: "12:10", subject: "Математическая статистика", type: "Практика", room: "УЛК 2-24", teacher: "Прохоренко М.О." },
      { dayOfWeek: 5, weekParity: "ALL", startTime: "10:40", endTime: "12:10", subject: "Объектно-ориентированное программирование", type: "Лабораторная", room: "УЛК 4-05", teacher: "Стоякин Е.В." },
      { dayOfWeek: 5, weekParity: "ODD", startTime: "13:00", endTime: "14:30", subject: "Иностранный язык", type: "Практика", room: "УЛК 2-18", teacher: "Ефимов Е.А." },
    ];
    for (const s of SCHEDULE) {
      await prisma.scheduleEntry.create({ data: { studyGroup: "ПИ24-16", ...s } });
    }
  }

  const existingCertificates = await prisma.certificateRequest.count();
  if (existingCertificates === 0) {
    await prisma.certificateRequest.create({
      data: { residentId: student.id, type: "Справка об обучении", category: "CERTIFICATE", sealType: "OFFICIAL", status: "ISSUED" },
    });
    await prisma.certificateRequest.create({
      data: { residentId: student.id, type: "Справка о размере стипендии", category: "CERTIFICATE", status: "NEW" },
    });
    const paidResident = residents.find((r) => r.login === "Petrova-EI25")!;
    await prisma.certificateRequest.create({
      data: { residentId: paidResident.id, type: "Справка об оплате обучения", category: "CERTIFICATE", status: "READY" },
    });
    await prisma.certificateRequest.create({
      data: { residentId: paidResident.id, type: "Допсоглашение о снижении стоимости обучения", category: "CONTRACT", status: "NEW" },
    });
  }

  const existingInvoices = await prisma.invoiceRequest.count();
  if (existingInvoices === 0) {
    await prisma.invoiceRequest.create({
      data: { residentId: student.id, purpose: "Проживание в общежитии", status: "REQUESTED" },
    });
    await prisma.invoiceRequest.create({
      data: { residentId: student.id, purpose: "Оплата обучения", status: "READY", amount: 45000 },
    });
  }

  const existingFacilities = await prisma.facility.count();
  let laundry: Awaited<ReturnType<typeof prisma.facility.create>> | null = null;
  if (existingFacilities === 0) {
    laundry = await prisma.facility.create({
      data: { dormId: 6, name: "Прачечная", type: "LAUNDRY", openTime: "08:00", closeTime: "22:00", slotMinutes: 60 },
    });
    await prisma.facility.create({
      data: { dormId: 6, name: "Спортзал", type: "GYM", openTime: "07:00", closeTime: "23:00", slotMinutes: 60 },
    });
    await prisma.facility.create({
      data: { dormId: 6, name: "Психологическая служба", type: "COUNSELING", openTime: "10:00", closeTime: "18:00", slotMinutes: 45 },
    });
  }
  if (laundry) {
    const today = new Date().toISOString().slice(0, 10);
    await prisma.facilityBooking.create({
      data: { facilityId: laundry.id, residentId: student.id, date: today, startTime: "18:00" },
    });
  }

  const existingMenu = await prisma.menuItem.count();
  if (existingMenu === 0) {
    const MENU: { dayOfWeek: number; mealType: string; name: string; price: number }[] = [
      { dayOfWeek: 1, mealType: "BREAKFAST", name: "Каша овсяная с ягодами", price: 90 },
      { dayOfWeek: 1, mealType: "BREAKFAST", name: "Сырники со сметаной", price: 120 },
      { dayOfWeek: 1, mealType: "LUNCH", name: "Борщ со сметаной", price: 130 },
      { dayOfWeek: 1, mealType: "LUNCH", name: "Гречка с котлетой", price: 180 },
      { dayOfWeek: 1, mealType: "DINNER", name: "Плов с курицей", price: 170 },
      { dayOfWeek: 2, mealType: "BREAKFAST", name: "Омлет с сыром", price: 100 },
      { dayOfWeek: 2, mealType: "LUNCH", name: "Суп-лапша домашняя", price: 110 },
      { dayOfWeek: 2, mealType: "LUNCH", name: "Пюре с рыбой", price: 190 },
      { dayOfWeek: 2, mealType: "DINNER", name: "Паста болоньезе", price: 160 },
      { dayOfWeek: 3, mealType: "BREAKFAST", name: "Блины со сгущёнкой", price: 110 },
      { dayOfWeek: 3, mealType: "LUNCH", name: "Солянка", price: 140 },
      { dayOfWeek: 3, mealType: "DINNER", name: "Овощное рагу с курицей", price: 165 },
    ];
    for (const m of MENU) {
      await prisma.menuItem.create({ data: { dormId: 6, ...m } });
    }
  }

  const existingRoommateRequests = await prisma.roommateRequest.count();
  if (existingRoommateRequests === 0) {
    const swapper = residents.find((r) => r.login === "Frolov-IK24")!;
    const seeker = residents.find((r) => r.login === "Gromova-YS26")!;
    await prisma.roommateRequest.create({
      data: {
        residentId: swapper.id,
        type: "SWAP",
        room: swapper.room,
        desiredRoom: "Любая на 2 этаже",
        description: "Меняю комнату 620 на этаж пониже, лифт часто не работает.",
      },
    });
    await prisma.roommateRequest.create({
      data: {
        residentId: seeker.id,
        type: "SEEK_ROOMMATE",
        room: seeker.room,
        description: "Освободилось место в комнате, ищу спокойного соседа/соседку.",
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo student login:     Example-TT26 / password: ${DEMO_PASSWORD}`);
  console.log(`Demo admin login:       Dorm6-Admin / password: ${DEMO_PASSWORD}`);
  console.log(`Demo leadership login:  Campus-Lead / password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
