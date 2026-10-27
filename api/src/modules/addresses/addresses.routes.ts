import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { notFound } from "../../lib/errors.js";
import { newId } from "../../lib/ids.js";

export const addressesRouter = Router();

const addressSchema = z.object({
  label: z.string().min(1).max(30).default("Home"),
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  isDefault: z.boolean().optional(),
});

addressesRouter.use(authenticate);

addressesRouter.get("/", (req, res) => {
  res.json({ data: req.user!.addresses });
});

addressesRouter.post("/", validate(addressSchema), (req, res) => {
  const user = req.user!;
  const body = req.body as z.infer<typeof addressSchema>;
  const address = { id: newId("adr"), ...body };
  if (body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }
  user.addresses.push(address);
  persist();
  res.status(201).json({ address });
});

addressesRouter.patch("/:id", validate(addressSchema.partial()), (req, res, next) => {
  try {
    const user = req.user!;
    const address = user.addresses.find((a) => a.id === req.params.id);
    if (!address) throw notFound("Address not found");
    const body = req.body as Partial<z.infer<typeof addressSchema>>;
    if (body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    Object.assign(address, body);
    persist();
    res.json({ address });
  } catch (error) {
    next(error);
  }
});

addressesRouter.delete("/:id", (req, res, next) => {
  try {
    const user = req.user!;
    const address = user.addresses.find((a) => a.id === req.params.id);
    if (!address) throw notFound("Address not found");
    user.addresses = user.addresses.filter((a) => a.id !== req.params.id);
    if (address.isDefault && user.addresses[0]) user.addresses[0].isDefault = true;
    persist();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
