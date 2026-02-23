import { promises as fs } from "node:fs";
import https from "node:https";

const DATA_YEAR = 2023;

// US Census API endpoint for ACS 5-year estimates
const CENSUS_BASE_URL = "https://api.census.gov/data";
const ACS_API_URL = `${CENSUS_BASE_URL}/${DATA_YEAR}/acs/acs5`;

// Variable code for median age
const MEDIAN_AGE_VAR = "B01002_001E";

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

// Fetch county median age data for all states
async function fetchCountyMedianAges() {
	console.log(`Starting Census County Median Age Data Collection for ${DATA_YEAR}...\n`);

	const stateMap = await getStateFipsCodes();
	const allCounties = [];

	// Fetch data for all counties nationwide
	const url = `${ACS_API_URL}?get=NAME,${MEDIAN_AGE_VAR}&for=county:*`;

	console.log("Fetching county median age data for all US counties...");
	console.log(`API URL: ${url}`);

	try {
		const response = await httpsRequest(url);

		// Skip header row (first element)
		const countyData = response.slice(1);

		console.log(`✓ Retrieved data for ${countyData.length} counties`);

		for (const [countyName, medianAge, stateFips, countyFips] of countyData) {
			const stateName = stateMap.get(stateFips) || "Unknown";
			const fullFips = `${stateFips}${countyFips}`; // Combine state and county FIPS

			// Skip entries with missing age data
			if (!medianAge || medianAge === "null" || medianAge === "-666666666") {
				continue;
			}

			const ageValue = parseFloat(medianAge);
			if (Number.isNaN(ageValue)) {
				continue;
			}

			allCounties.push({
				fips: fullFips,
				name: countyName,
				state: stateName,
				stateFips: stateFips,
				countyFips: countyFips,
				medianAge: ageValue,
			});
		}

		// Sort by FIPS code
		allCounties.sort((a, b) => a.fips.localeCompare(b.fips));

		return allCounties;
	} catch (error) {
		throw new Error(`Failed to fetch county median age data: ${error.message}`);
	}
}

// Main execution
(async () => {
	try {
		const results = await fetchCountyMedianAges();

		console.log(`\n✓ Successfully collected median age data for ${results.length} counties`);

		// Create output directory if it doesn't exist
		await fs.mkdir("data/base", { recursive: true });

		// Save to JSON file
		const jsonFilePath = `data/base/median_ages_${DATA_YEAR}.json`;
		await fs.writeFile(jsonFilePath, JSON.stringify(results, null, 2));
		console.log(`✓ Saved to: ${jsonFilePath}`);

		// Save to CSV file
		const csvHeader = "FIPS,County Name,State,State FIPS,County FIPS,Median Age\n";
		const csvRows = results
			.map((r) => `${r.fips},"${r.name}",${r.state},${r.stateFips},${r.countyFips},${r.medianAge}`)
			.join("\n");
		const csvFilePath = `data/base/median_ages_${DATA_YEAR}.csv`;
		await fs.writeFile(csvFilePath, csvHeader + csvRows);
		console.log(`✓ Saved to: ${csvFilePath}`);

		// Show sample of results
		console.log("\nSample results (first 5 counties):");
		results.slice(0, 5).forEach((r) => {
			console.log(`  ${r.fips} - ${r.name}, ${r.state}: ${r.medianAge} years`);
		});

		// Show summary statistics
		const ages = results.map((r) => r.medianAge);
		const minAge = Math.min(...ages);
		const maxAge = Math.max(...ages);
		const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;

		console.log("\nSummary Statistics:");
		console.log(`  Counties with data: ${results.length}`);
		console.log(`  Youngest county median age: ${minAge} years`);
		console.log(`  Oldest county median age: ${maxAge} years`);
		console.log(`  National average: ${avgAge.toFixed(1)} years`);
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
})();
