import { createServerFn } from "@tanstack/react-start";
import type { CountyData } from "~/data/types";
import { prisma } from "~/db";

export const fetchData = createServerFn({
	method: "GET",
}).handler(async (): Promise<CountyData[]> => {
	const rows = await prisma.county.findMany({
		include: {
			age: true,
			population: true,
			temperature: true,
			politics: true,
			housing: true,
			rent: true,
		},
	});

	return rows
		.filter(
			(c) =>
				c.age &&
				c.population &&
				c.temperature &&
				c.politics &&
				c.housing &&
				c.rent,
		)
		.map(
			(c) =>
				({
					id: c.id,
					name: c.name,
					state: c.state,
					population: c.population?.population,
					medianAge: c.age?.medianAge,
					temperature: {
						avgTempF: c.temperature?.avgTempF,
						isEstimated: c.temperature?.isEstimated,
					},
					votes: {
						totals: {
							democrat: c.politics?.democrat,
							republican: c.politics?.republican,
							total: c.politics?.total,
						},
						percentages: {
							democrat: c.politics?.pctDemocrat,
							republican: c.politics?.pctRepublican,
						},
						winner: c.politics?.winner,
						isEstimated: c.politics?.isEstimated,
					},
					housing: {
						medianHomeValue: c.housing?.medianHomeValue,
						percentNationalMedian:
							c.housing?.percentNationalMedian ?? undefined,
						isEstimated: c.housing?.isEstimated,
					},
					rent: {
						medianRent: c.rent?.medianRent,
						sizes: {
							efficiency: c.rent?.efficiency,
							oneBR: c.rent?.oneBR,
							twoBR: c.rent?.twoBR,
							threeBR: c.rent?.threeBR,
							fourBR: c.rent?.fourBR,
						},
						isEstimated: c.rent?.isEstimated,
					},
				}) as CountyData,
		);
});
