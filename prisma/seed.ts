import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL (preferred) or DATABASE_URL is required to run seeds.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const allergens = [
    {
      name: 'Peanuts',
      category: 'Nuts',
      commonNames: ['groundnut', 'arachis oil', 'monkey nuts', 'groundnut oil'],
    },
    {
      name: 'Tree Nuts',
      category: 'Nuts',
      commonNames: ['cashew', 'almond', 'walnut', 'hazelnut', 'pecan', 'pistachio'],
    },
    {
      name: 'Milk',
      category: 'Dairy',
      commonNames: ['lactose', 'whey', 'casein', 'butter', 'cream', 'cheese'],
    },
    {
      name: 'Eggs',
      category: 'Dairy',
      commonNames: ['albumin', 'globulin', 'mayonnaise', 'lecithin'],
    },
    {
      name: 'Wheat',
      category: 'Grains',
      commonNames: ['gluten', 'flour', 'starch', 'semolina', 'spelt'],
    },
    {
      name: 'Soy',
      category: 'Grains',
      commonNames: ['soya', 'soybean', 'tofu', 'edamame', 'miso'],
    },
    {
      name: 'Fish',
      category: 'Seafood',
      commonNames: ['cod', 'tilapia', 'catfish', 'tuna', 'salmon', 'mackerel'],
    },
    {
      name: 'Shellfish',
      category: 'Seafood',
      commonNames: ['shrimp', 'crab', 'lobster', 'prawn', 'crayfish'],
    },
    {
      name: 'Sesame',
      category: 'Seeds',
      commonNames: ['tahini', 'sesame oil', 'gingelly', 'benne'],
    },
    {
      name: 'Sulphites',
      category: 'Additives',
      commonNames: ['sulfur dioxide', 'sodium metabisulfite', 'E220', 'E221'],
    },
    {
      name: 'MSG',
      category: 'Additives',
      commonNames: ['monosodium glutamate', 'E621', 'flavor enhancer'],
    },
    {
      name: 'Lactose',
      category: 'Dairy',
      commonNames: ['milk sugar', 'lactulose'],
    },
    {
      name: 'Gluten',
      category: 'Grains',
      commonNames: ['barley', 'rye', 'oats', 'malt', 'triticale'],
    },
    {
      name: 'Mustard',
      category: 'Condiments',
      commonNames: ['mustard seed', 'mustard oil', 'sinapis'],
    },
    {
      name: 'Celery',
      category: 'Vegetables',
      commonNames: ['celeriac', 'celery seed', 'celery salt'],
    },
    {
      name: 'Lupin',
      category: 'Legumes',
      commonNames: ['lupin flour', 'lupin seed', 'lupin bean'],
    },
    {
      name: 'Molluscs',
      category: 'Seafood',
      commonNames: ['squid', 'snail', 'oyster', 'scallop', 'clam'],
    },
    {
      name: 'Artificial Dyes',
      category: 'Additives',
      commonNames: ['tartrazine', 'E102', 'sunset yellow', 'E110', 'E124'],
    },
  ] as const;

  const upserts = await Promise.all(
    allergens.map((allergen) =>
      prisma.allergen.upsert({
        where: { name: allergen.name },
        create: {
          name: allergen.name,
          category: allergen.category,
          commonNames: [...allergen.commonNames],
        },
        update: {
          category: allergen.category,
          commonNames: [...allergen.commonNames],
        },
      }),
    ),
  );

  console.log(`Seeded ${upserts.length} allergens.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
