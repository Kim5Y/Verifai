import "dotenv/config"
import { PrismaClient, AllergenCategory } from '@prisma/client';
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
  const allergens: Array<{
    name: string;
    category: AllergenCategory;
    commonNames: string[];
  }> = [
    {
      name: 'Peanuts',
      category: AllergenCategory.NUT,
      commonNames: ['groundnut', 'arachis oil', 'monkey nuts', 'groundnut oil'],
    },
    {
      name: 'Tree Nuts',
      category: AllergenCategory.NUT,
      commonNames: ['cashew', 'almond', 'walnut', 'hazelnut', 'pecan', 'pistachio'],
    },
    {
      name: 'Milk',
      category: AllergenCategory.DAIRY,
      commonNames: ['lactose', 'whey', 'casein', 'butter', 'cream', 'cheese'],
    },
    {
      name: 'Eggs',
      category: AllergenCategory.EGG,
      commonNames: ['albumin', 'globulin', 'mayonnaise', 'lecithin'],
    },
    {
      name: 'Wheat',
      category: AllergenCategory.GLUTEN,
      commonNames: ['gluten', 'flour', 'starch', 'semolina', 'spelt'],
    },
    {
      name: 'Soy',
      category: AllergenCategory.SOY,
      commonNames: ['soya', 'soybean', 'tofu', 'edamame', 'miso'],
    },
    {
      name: 'Fish',
      category: AllergenCategory.SEAFOOD,
      commonNames: ['cod', 'tilapia', 'catfish', 'tuna', 'salmon', 'mackerel'],
    },
    {
      name: 'Shellfish',
      category: AllergenCategory.SEAFOOD,
      commonNames: ['shrimp', 'crab', 'lobster', 'prawn', 'crayfish'],
    },
    {
      name: 'Sesame',
      category: AllergenCategory.OTHER,
      commonNames: ['tahini', 'sesame oil', 'gingelly', 'benne'],
    },
    {
      name: 'Sulphites',
      category: AllergenCategory.OTHER,
      commonNames: ['sulfur dioxide', 'sodium metabisulfite', 'E220', 'E221'],
    },
    {
      name: 'MSG',
      category: AllergenCategory.OTHER,
      commonNames: ['monosodium glutamate', 'E621', 'flavor enhancer'],
    },
    {
      name: 'Lactose',
      category: AllergenCategory.DAIRY,
      commonNames: ['milk sugar', 'lactulose'],
    },
    {
      name: 'Gluten',
      category: AllergenCategory.GLUTEN,
      commonNames: ['barley', 'rye', 'oats', 'malt', 'triticale'],
    },
    {
      name: 'Mustard',
      category: AllergenCategory.OTHER,
      commonNames: ['mustard seed', 'mustard oil', 'sinapis'],
    },
    {
      name: 'Celery',
      category: AllergenCategory.OTHER,
      commonNames: ['celeriac', 'celery seed', 'celery salt'],
    },
    {
      name: 'Lupin',
      category: AllergenCategory.OTHER,
      commonNames: ['lupin flour', 'lupin seed', 'lupin bean'],
    },
    {
      name: 'Molluscs',
      category: AllergenCategory.SEAFOOD,
      commonNames: ['squid', 'snail', 'oyster', 'scallop', 'clam'],
    },
    {
      name: 'Artificial Dyes',
      category: AllergenCategory.OTHER,
      commonNames: ['tartrazine', 'E102', 'sunset yellow', 'E110', 'E124'],
    },
  ];

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
