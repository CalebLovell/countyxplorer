import { promises as fs } from "node:fs";
import https from "node:https";

const DATA_YEAR = 2023;

// US Census API endpoint for ACS 5-year estimates (most recent available with all counties)
const CENSUS_BASE_URL = "https://api.census.gov/data";
const ACS_API_URL = `${CENSUS_BASE_URL}/${DATA_YEAR}/acs/acs5`;

// Variable code for total population
const TOTAL_POPULATION_VAR = "B01001_001E";

// Helper function to make HTTPS requests
function httpsRequest(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
					return;
				}

				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					try {
						resolve(JSON.parse(data));
					} catch (error) {
						reject(new Error(`Failed to parse JSON: ${error.message}`));
					}
				});
			})
			.on("error", reject);
	});
}

// Fetch state FIPS codes mapping
async function getStateFipsCodes() {
	const url = `${CENSUS_BASE_URL}/${DATA_YEAR}/acs/acs5?get=NAME&for=state:*`;

	console.log("Fetching state FIPS codes...");

	try {
		const response = await httpsRequest(url);
		const stateMap = new Map();

		// Skip header row (first element)
		response.slice(1).forEach(([name, fips]) => {
			stateMap.set(fips, name);
		});

		console.log(`✓ Retrieved ${stateMap.size} states`);
		return stateMap;
	} catch (error) {
		throw new Error(`Failed to fetch state FIPS codes: ${error.message}`);
	}
}

// Fetch county population data for all states
async function fetchCountyPopulation() {
	console.log(`Starting Census County Population Data Collection for ${DATA_YEAR} (ACS 5-year estimates)...\n`);

	const stateMap = await getStateFipsCodes();
	const allCounties = [];

	// Fetch data for all counties nationwide
	const url = `${ACS_API_URL}?get=NAME,${TOTAL_POPULATION_VAR}&for=county:*`;

	console.log("Fetching county population data for all US counties...");
	console.log(`API URL: ${url}`);

	try {
		const response = await httpsRequest(url);

		// Skip header row (first element)
		const countyData = response.slice(1);

		console.log(`✓ Retrieved data for ${countyData.length} counties`);

		for (const [countyName, population, stateFips, countyFips] of countyData) {
			const stateName = stateMap.get(stateFips) || "Unknown";
			const fullFips = `${stateFips}${countyFips}`; // Combine state and county FIPS

			// Skip entries with missing population data
			if (!population || population === "null" || population === "-666666666") {
				continue;
			}

			const populationValue = parseInt(population, 10);
			if (Number.isNaN(populationValue)) {
				continue;
			}

			allCounties.push({
				fips: fullFips,
				name: countyName,
				state: stateName,
				stateFips: stateFips,
				countyFips: countyFips,
				population: populationValue,
				year: DATA_YEAR,
			});
		}

		// Sort by FIPS code
		allCounties.sort((a, b) => a.fips.localeCompare(b.fips));

		return allCounties;
	} catch (error) {
		throw new Error(`Failed to fetch county population data: ${error.message}`);
	}
}

// Main execution
(async () => {
	try {
		const results = await fetchCountyPopulation();

		console.log(`\n✓ Successfully collected population data for ${results.length} counties`);

		// Create output directory if it doesn't exist
		await fs.mkdir("data/base", { recursive: true });

		// Save to JSON file
		const jsonFilePath = `data/base/population_${DATA_YEAR}.json`;
		await fs.writeFile(jsonFilePath, JSON.stringify(results, null, 2));
		console.log(`✓ Saved to: ${jsonFilePath}`);

		// Save to CSV file
		const csvHeader = "FIPS,County Name,State,State FIPS,County FIPS,Population,Year\n";
		const csvRows = results
			.map((r) => `${r.fips},"${r.name}",${r.state},${r.stateFips},${r.countyFips},${r.population},${r.year}`)
			.join("\n");
		const csvFilePath = `data/base/population_${DATA_YEAR}.csv`;
		await fs.writeFile(csvFilePath, csvHeader + csvRows);
		console.log(`✓ Saved to: ${csvFilePath}`);

		// Show sample of results
		console.log("\nSample results (first 5 counties):");
		results.slice(0, 5).forEach((r) => {
			console.log(`  ${r.fips} - ${r.name}, ${r.state}: ${r.population.toLocaleString()}`);
		});

		// Show summary statistics
		const populations = results.map((r) => r.population);
		const totalPopulation = populations.reduce((sum, pop) => sum + pop, 0);
		const minPopulation = Math.min(...populations);
		const maxPopulation = Math.max(...populations);
		const avgPopulation = totalPopulation / populations.length;

		console.log("\nSummary Statistics:");
		console.log(`  Counties with data: ${results.length}`);
		console.log(`  Total US population: ${totalPopulation.toLocaleString()}`);
		console.log(`  Smallest county: ${minPopulation.toLocaleString()}`);
		console.log(`  Largest county: ${maxPopulation.toLocaleString()}`);
		console.log(`  Average county population: ${Math.round(avgPopulation).toLocaleString()}`);
	} catch (error) {
		console.error("Error:", error.message);
		console.log("\n💡 Note: This uses ACS 5-year estimates for complete county coverage.");
		console.log("   All US counties are included, regardless of population size.");
		process.exit(1);
	}
})();
