import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { serializeListing } from "../serialize";
import { notifyUser } from "../notify";

export const listingsRouter = Router();
listingsRouter.use(requireAuth);

// Order matters: static/nested paths must be registered before the generic
// "/:id" route below, or Express would match "mine"/"favorites" as an id.
listingsRouter.get("/mine", async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    include: { seller: true, favorites: { select: { userId: true } } },
  });
  res.json(listings.map((l) => serializeListing(l, req.auth!.sub)));
});

listingsRouter.get("/favorites", async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { favorites: { some: { userId: req.auth!.sub } } },
    orderBy: { createdAt: "desc" },
    include: { seller: true, favorites: { select: { userId: true } } },
  });
  res.json(listings.map((l) => serializeListing(l, req.auth!.sub)));
});

listingsRouter.get("/", async (req, res) => {
  const { dormId, sort, q, status, residentId, floor } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = { status: status || "ACTIVE" };
  if (dormId) where.dormId = Number(dormId);
  if (residentId) where.sellerId = residentId;
  if (floor) where.room = { startsWith: floor };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const orderBy =
    sort === "cheapest" ? { price: "asc" as const } : { createdAt: "desc" as const };

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    include: { seller: true, favorites: { where: { userId: req.auth!.sub } } },
  });
  res.json(listings.map((l) => serializeListing(l, req.auth!.sub)));
});

listingsRouter.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { seller: true, favorites: { where: { userId: req.auth!.sub } } },
  });
  if (!listing) return res.status(404).json({ error: "not_found" });
  res.json(serializeListing(listing, req.auth!.sub));
});

listingsRouter.post("/", async (req, res) => {
  const { title, description, price, negotiable, category, photos, dormId, room } = req.body;
  if (!title || !description || !category || !room) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      price: Number(price) || 0,
      negotiable: !!negotiable,
      category,
      photos: JSON.stringify(photos || []),
      dormId: Number(dormId) || 6,
      room,
      sellerId: req.auth!.sub,
    },
    include: { seller: true },
  });
  res.status(201).json(serializeListing(listing, req.auth!.sub));
});

listingsRouter.patch("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: "not_found" });
  if (listing.sellerId !== req.auth!.sub) return res.status(403).json({ error: "forbidden" });

  const { status, title, description, price } = req.body;
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (title) patch.title = title;
  if (description) patch.description = description;
  if (price) patch.price = Number(price);

  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: patch,
    include: { seller: true, favorites: { where: { userId: req.auth!.sub } } },
  });
  res.json(serializeListing(updated, req.auth!.sub));
});

listingsRouter.post("/:id/favorite", async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: "not_found" });

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: req.auth!.sub, listingId: listing.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: req.auth!.sub, listingId: listing.id } });
    if (listing.sellerId !== req.auth!.sub) {
      const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
      await notifyUser({
        userId: listing.sellerId,
        type: "MESSAGE",
        title: "Ваше объявление добавили в избранное",
        body: `${user?.fullName || "Житель"} заинтересовался: ${listing.title}`,
        linkType: "listing",
        linkId: listing.id,
      });
    }
  }

  const updated = await prisma.listing.findUnique({
    where: { id: listing.id },
    include: { seller: true, favorites: { where: { userId: req.auth!.sub } } },
  });
  res.json(serializeListing(updated!, req.auth!.sub));
});
