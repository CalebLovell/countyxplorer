import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { counties } from '../src/data/counties.js'

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
	console.log('🌱 Seeding database...')

	await prisma.rent.deleteMany()
	await prisma.housing.deleteMany()
	await prisma.politics.deleteMany()
	await prisma.temperature.deleteMany()
	await prisma.population.deleteMany()
	await prisma.age.deleteMany()
	await prisma.county.deleteMany()

	for (const c of counties) {
		await prisma.county.create({
			data: {
				id: c.id,
				name: c.name,
				state: c.state,
				age: {
					create: { medianAge: c.medianAge },
				},
				population: {
					create: { population: c.population },
				},
				temperature: {
					create: {
						avgTempF: c.temperature.avgTempF,
						isEstimated: c.temperature.isEstimated,
					},
				},
				politics: {
					create: {
						democrat: c.votes.totals.democrat,
						republican: c.votes.totals.republican,
						total: c.votes.totals.total,
						pctDemocrat: c.votes.percentages.democrat,
						pctRepublican: c.votes.percentages.republican,
						winner: c.votes.winner,
						isEstimated: c.votes.isEstimated,
					},
				},
				housing: {
					create: {
						medianHomeValue: c.housing.medianHomeValue,
						percentNationalMedian: c.housing.percentNationalMedian ?? null,
						isEstimated: c.housing.isEstimated,
					},
				},
				rent: {
					create: {
						medianRent: c.rent.medianRent,
						efficiency: c.rent.sizes.efficiency,
						oneBR: c.rent.sizes.oneBR,
						twoBR: c.rent.sizes.twoBR,
						threeBR: c.rent.sizes.threeBR,
						fourBR: c.rent.sizes.fourBR,
						isEstimated: c.rent.isEstimated,
					},
				},
			},
		})
	}

	console.log(`✅ Seeded ${counties.length} counties`)
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
