import { prisma } from './src/config/db.config.js';

async function seed() {
    console.log('🌱 Seeding database...');

    // These match the vouchers created in the deploy script
    const vouchers = [
        {
            token_id: 1,
            store: 'Amazon',
            face_value: 5000,
            currency: 'INR',
            description: 'Amazon India e-gift card - Valid for all products',
            created_by: '0x0000000000000000000000000000000000000000',
        },
        {
            token_id: 2,
            store: 'Zara',
            face_value: 2000,
            currency: 'INR',
            description: 'Zara fashion voucher - Valid at all stores',
            created_by: '0x0000000000000000000000000000000000000000',
        },
        {
            token_id: 3,
            store: 'Starbucks',
            face_value: 500,
            currency: 'INR',
            description: 'Starbucks coffee voucher - Valid at all outlets',
            created_by: '0x0000000000000000000000000000000000000000',
        },
    ];

    for (const voucher of vouchers) {
        const existing = await prisma.voucherMeta.findUnique({
            where: { token_id: voucher.token_id },
        });

        if (existing) {
            console.log(`✓ Voucher ${voucher.store} (tokenId: ${voucher.token_id}) already exists`);
        } else {
            await prisma.voucherMeta.create({ data: voucher });
            console.log(`✓ Created voucher: ${voucher.store} (tokenId: ${voucher.token_id})`);
        }
    }

    console.log('✅ Seeding complete!');
    await prisma.$disconnect();
}

seed().catch((e) => {
    console.error('Seed failed:', e);
    prisma.$disconnect();
    process.exit(1);
});
