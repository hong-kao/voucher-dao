import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/db.config.js';

const router = Router();

//get -> all voucher types
router.get("/", async (req: Request, res: Response) => {
    try {
        const { store, currency } = req.query;

        const vouchers = await prisma.voucherMeta.findMany({
            where: {
                ...(store && {
                    store: {
                        contains: store as string,
                        mode: 'insensitive'
                    }
                }),
                ...(currency && {
                    currency: {
                        contains: currency as string
                    }
                })
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Transform to camelCase for frontend compatibility
        const transformedVouchers = vouchers.map(v => ({
            tokenId: v.token_id,
            store: v.store,
            faceValue: v.face_value,
            currency: v.currency,
            expiryDate: v.expiry_date,
            imageUrl: v.image_url,
            description: v.description,
            createdBy: v.created_by,
            createdAt: v.created_at,
            updatedAt: v.updated_at,
        }));

        res.json({
            items: transformedVouchers
        });
    } catch (err: any) {
        console.error("Error fetching vouchers! -> ", err);
        res.status(500).json({
            error: "Failed to fetch vouchers"
        });
    }
});

//get - single voucher
router.get("/:tokenId", async (req: Request, res: Response) => {
    try {
        const token_id = parseInt(req.params.tokenId as string, 10);

        if (isNaN(token_id)) {
            res.status(400).json({
                error: "Invalid token"
            });
            return;
        }

        const voucher = await prisma.voucherMeta.findUnique({
            where: {
                token_id
            }
        });

        if (!voucher) {
            res.status(400).json({
                error: "Voucher not found!"
            });
            return;
        }

        // Transform to camelCase for frontend compatibility
        res.json({
            tokenId: voucher.token_id,
            store: voucher.store,
            faceValue: voucher.face_value,
            currency: voucher.currency,
            expiryDate: voucher.expiry_date,
            imageUrl: voucher.image_url,
            description: voucher.description,
            createdBy: voucher.created_by,
            createdAt: voucher.created_at,
            updatedAt: voucher.updated_at,
        });
    } catch (err: any) {
        console.error("Error fetching the required voucher: ", err);
        res.status(500).json({
            error: "Error while fetching voucher"
        });
    }
});

//post - create a new voucher meta
router.post("/", async (req: Request, res: Response) => {
    try {
        const { token_id, store, face_value, currency, expiry_date, image_url, description, created_by } = req.body;

        if (!token_id || !store || !face_value || !created_by) {
            res.status(400).json({
                error: "Missing required fields"
            });
            return;
        }

        const voucher = await prisma.voucherMeta.create({
            data: {
                token_id: parseInt(token_id, 10),
                store,
                face_value: parseFloat(face_value),
                currency: currency || 'INR',
                expiry_date: expiry_date ? new Date(expiry_date) : null,
                image_url,
                description,
                created_by
            },
        });

        res.status(201).json(voucher);
    } catch (err: any) {
        console.error("Error creating voucher: ", err);
        if (err.code === "P2002") {
            res.status(409).json({
                error: "Voucher with this token already exists!"
            });
            return;
        }

        res.status(500).json({
            error: "Failed to create voucher"
        })
    }
});

//put - update voucher meta
router.put("/:tokenId", async (req: Request, res: Response) => {
    try {
        const token_id = parseInt(req.params.tokenId as string, 10);
        const { store, face_value, currency, expiry_date, image_url, description } = req.body;

        const voucher = await prisma.voucherMeta.update({
            where: {
                token_id
            },
            data: {
                ...(store && { store }),
                ...(face_value && { face_value: parseFloat(face_value) }),
                ...(currency && { currency }),
                ...(expiry_date !== undefined && { expiry_date: expiry_date ? new Date(expiry_date) : null }),
                ...(image_url !== undefined && { image_url }),
                ...(description !== undefined && { description }),
            },
        });

        res.json(voucher);
    } catch (err: any) {
        console.error("Error updating voucher: ", err);

        if (err.code === "P2025") {
            res.status(404).json({
                error: "Voucher not found"
            });
            return;
        }

        res.status(500).json({
            error: "Error updating voucher"
        });
    }
});

//delete - delete voucher meta data
router.delete("/:tokenId", async (req: Request, res: Response) => {
    try {
        const token_id = parseInt(req.params.tokenId as string, 10);

        await prisma.voucherMeta.delete({
            where: {
                token_id
            }
        });

        res.status(204).send();
    } catch (err: any) {
        console.error("Error while deleting voucher: ", err);

        if (err.code === "P2025") {
            res.status(404).json({
                error: "Voucher not found"
            });
            return;
        }

        res.status(500).json({
            error: "Error while updating voucher"
        });
    }
})

export default router;