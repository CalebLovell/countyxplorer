export type CountyData = {
	id: string;
	name: string;
	state: string;
	population: number;
	medianAge: number;
	temperature: {
		avgTempF: number;
		isEstimated: boolean;
	};
	votes: {
		totals: {
			democrat: number;
			republican: number;
			total: number;
		};
		percentages: {
			democrat: number;
			republican: number;
		};
		winner: string;
		isEstimated: boolean;
	};
	housing: {
		medianHomeValue: number;
		percentNationalMedian?: number;
		isEstimated: boolean;
	};
	rent: {
		medianRent: number;
		sizes: {
			efficiency: number;
			oneBR: number;
			twoBR: number;
			threeBR: number;
			fourBR: number;
		};
		isEstimated: boolean;
	};
};
