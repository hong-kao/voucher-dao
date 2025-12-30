import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/db.config.js';
import { Status } from '../generated/prisma/index.js';
import crypto from 'node:crypto';

const router = Router();

const generate_claim_code = (): string => {
    const random_part = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `VDAO-${random_part}`
}

//get - all redemptions from user
router.get("/:userAddress", async (req: Request, res: Response) => {
    try{
        const { userAddress } = req.params;
        const { status } = req.query;

        const redemptions = await prisma.redemption.findMany({
            where:{
                user: (userAddress as string).toLowerCase(),
                ...(status && { status: status as Status }),
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json({
            items: redemptions
        });
    }catch(err: any){
        console.log("Error while fetching redemptions: ", err);
        res.status(500).json({
            error: "Failed to fetch redemptions"
        });
    }
});

//get - get redemption by claim code
router.get("/code/:claimCode", async (req: Request, res: Response) => {
    try{
        const { claimCode } = req.params;

        const redemption = await prisma.redemption.findFirst({
            where:{
                claim_code: claimCode as string
            }
        });

        if(!redemption){
            res.status(404).json({
                error: "Redemption not found"
            });
            return;
        }

        res.json(redemption);
    }catch(err: any){
        console.error("Error while fetching redemption via claim code:  ", err);
        res.status(500).json({
            error: "Error while fetching error via claim code"
        })
    }
});

//post - create new redemption (called after on chain event)
router.post("/", async (req: Request, res: Response) => {
    try{
        const { on_chain_id, user, token_id } = req.body;

        if(!on_chain_id || !user || !token_id){
            res.status(400).json({
                error: "Missing fields"
            });
            return;
        }

        const existing = await prisma.redemption.findUnique({
            where:{
                on_chain_id
            }
        });

        if(existing){
            //return the existing if already exists
            res.json(existing);
            return;
        }

        const redemption = await prisma.redemption.create({
            data:{
                on_chain_id,
                user: user.toLowerCase(),
                token_id: parseInt(token_id, 10),
                claim_code: generate_claim_code(),
                status: Status.PENDING
            },
        });

        res.status(201).json(redemption);
    }catch(err: any){
        console.error("Error while creating redemption: ", err);
        res.status(500).json({
            error: "Error while creating redemption"
        });
    }
});

//patch - mark redemption as used
router.patch("/:id/use", async (req: Request, res: Response) => {
    try{
        const id = parseInt(req.params.id as string, 10);
        
        const redemption = await prisma.redemption.update({
            where: {
                id
            },
            data:{
                status: Status.USED,
                used_at: new Date()
            }
        });

        res.json(redemption);
    }catch(err: any){
        console.error("Error updating redemption to used: ", err);

        if(err.code == "P2025"){
            res.status(404).json({
                error: "Redemption not found",
            });
            return;
        }

        res.status(500).json({
            error: "Error failed to update redemption to used"
        });
    }
});

//patch - mark redemption as expired
router.patch("/:id/expire", async (req: Request, res: Response) => {
    try{
        const id = parseInt(req.params.id as string, 10);
        
        const redemption = await prisma.redemption.update({
            where: {
                id
            },
            data:{
                status: Status.EXPIRED,
            }
        });

        res.json(redemption);
    }catch(err: any){
        console.error("Error updating redemption to expired: ", err);

        if(err.code == "P2025"){
            res.status(404).json({
                error: "Redemption not found",
            });
            return;
        }

        res.status(500).json({
            error: "Error failed to update redemption to expired"
        });
    }
});

export default router;