import { promises as fs } from "node:fs";
import https from "node:https";
import path from "node:path";

const DATA_YEAR = 2023;

// HUD User API base URL
const HUD_API_BASE = "https://www.huduser.gov/hudapi/public";

// Load environment variables from .env file
async function loadEnvFile() {
	try {
		const envPath = path.join(process.cwd(), ".env");
		const envContent = await fs.readFile(envPath, "utf8");

		envContent.split("\n").forEach((line) => {
			const [key, value] = line.split("=");
			if (key && value) {
				process.env[key.trim()] = value.trim();
			}
		});
	} catch (error) {
		console.warn("Could not load .env file:", error.message);
	}
}

// Load env file first
await loadEnvFile();

// HUD API requires an API key from huduser.gov
// Set your API key in the .env file as HUD_API_KEY=your_key_here
const API_KEY = process.env.HUD_API_KEY;

// Helper function to make HTTPS requests with authentication
function httpsRequest(url, retries = 3) {
	return new Promise((resolve, reject) => {
		console.log(`Fetching: ${url}`);

		const makeRequest = (attemptCount) => {
			https
				.get(url, {
					headers: {
						"User-Agent": "Mozilla/5.0 (compatible; Node.js FMR Data Collector)",
						Accept: "application/json",
						Authorization: `Bearer ${API_KEY}`,
					},
					timeout: 30000,
				})
				.on("timeout", () => {
					if (attemptCount < retries) {
						console.log(`  Timeout, retrying (${attemptCount + 1}/${retries})...`);
						setTimeout(() => makeRequest(attemptCount + 1), 2000);
					} else {
						reject(new Error("Request timeout after retries"));
					}
				})
				.on("response", (res) => {
					if (res.statusCode === 429 && attemptCount < retries) {
						console.log(`  Rate limited, retrying in 5 seconds (${attemptCount + 1}/${retries})...`);
						setTimeout(() => makeRequest(attemptCount + 1), 5000);
						return;
					}

					if (res.statusCode === 401) {
						reject(new Error("API authentication failed - check your HUD API key"));
						return;
					}

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
				.on("error", (error) => {
					if (attemptCount < retries) {
						console.log(`  Error, retrying (${attemptCount + 1}/${retries}): ${error.message}`);
						setTimeout(() => makeRequest(attemptCount + 1), 2000);
					} else {
						reject(error);
					}
				});
		};

		makeRequest(0);
	});
}

// Get list of states to iterate through
async function getStates() {
	const url = `${HUD_API_BASE}/fmr/listStates`;

	try {
		const response = await httpsRequest(url);
		// Response is an array directly, not wrapped in data property
		const states = Array.isArray(response) ? response : response.data || [];
		console.log(`✓ Retrieved ${states.length} states`);
		return states;
	} catch (error) {
		throw new Error(`Failed to fetch states: ${error.message}`);
	}
}

// Get counties for a specific state
async function getCountiesForState(stateCode) {
	const url = `${HUD_API_BASE}/fmr/listCounties/${stateCode}`;

	try {
		const response = await httpsRequest(url);
		const counties = Array.isArray(response) ? response : response.data || [];
		console.log(`  ${stateCode}: ${counties.length} counties`);
		return counties;
	} catch (error) {
		console.warn(`  Warning: Failed to fetch counties for ${stateCode}: ${error.message}`);
		return [];
	}
}

// Get FMR data for a specific county
async function getFMRData(entityId) {
	const url = `${HUD_API_BASE}/fmr/data/${entityId}?year=${DATA_YEAR}`;

	try {
		const response = await httpsRequest(url);
		// Extract the actual rent data from the nested structure
		if (response?.data?.basicdata) {
			return {
				countyName: response.data.county_name,
				metroName: response.data.metro_name,
				areaName: response.data.area_name,
				...response.data.basicdata,
			};
		}
		return null;
	} catch (error) {
		console.warn(`    Warning: Failed to fetch FMR data for ${entityId}: ${error.message}`);
		return null;
	}
}

// State FIPS code mapping
const STATE_FIPS_MAP = {
	AL: "01",
	AK: "02",
	AZ: "04",
	AR: "05",
	CA: "06",
	CO: "08",
	CT: "09",
	DE: "10",
	DC: "11",
	FL: "12",
	GA: "13",
	HI: "15",
	ID: "16",
	IL: "17",
	IN: "18",
	IA: "19",
	KS: "20",
	KY: "21",
	LA: "22",
	ME: "23",
	MD: "24",
	MA: "25",
	MI: "26",
	MN: "27",
	MS: "28",
	MO: "29",
	MT: "30",
	NE: "31",
	NV: "32",
	NH: "33",
	NJ: "34",
	NM: "35",
	NY: "36",
	NC: "37",
	ND: "38",
	OH: "39",
	OK: "40",
	OR: "41",
	PA: "42",
	RI: "44",
	SC: "45",
	SD: "46",
	TN: "47",
	TX: "48",
	UT: "49",
	VT: "50",
	VA: "51",
	WA: "53",
	WV: "54",
	WI: "55",
	WY: "56",
};

// Main function to collect county rent data
async function collectCountyRentData() {
	console.log(`Starting HUD County Fair Market Rent Data Collection for ${DATA_YEAR}...\n`);
	console.log("⚠️  This will collect data for ALL US counties - this may take 30-60 minutes!");
	console.log("   Progress will be saved incrementally in case of interruption.\n");

	if (!API_KEY) {
		console.error("❌ HUD API key not found!");
		console.log("\n📋 To get HUD Fair Market Rent data:");
		console.log("1. Register at https://www.huduser.gov/portal/dataset/fmr-api.html");
		console.log("2. Create an API access token");
		console.log("3. Add HUD_API_KEY=your_token to your .env file");
		process.exit(1);
	}

	try {
		const states = await getStates();
		const allCountyRents = [];
		let totalCountiesProcessed = 0;
		let statesProcessed = 0;

		console.log(`\nFetching county data for all ${states.length} states/territories...\n`);

		// Process ALL states - no limits
		for (const state of states) {
			statesProcessed++;
			console.log(`\n[${statesProcessed}/${states.length}] Processing ${state.state_name} (${state.state_code})...`);

			try {
				const counties = await getCountiesForState(state.state_code);

				// Process ALL counties in each state
				for (const county of counties) {
					totalCountiesProcessed++;
					console.log(`    [${totalCountiesProcessed}] Processing ${county.county_name}...`);

					const fmrData = await getFMRData(county.fips_code);

					if (fmrData) {
						// Calculate median rent from 2-bedroom FMR (most common metric)
						const medianRent = fmrData["Two-Bedroom"] || null;

						if (medianRent) {
							const stateFips = STATE_FIPS_MAP[state.state_code] || "00";
							const countyFips = county.county_code?.toString().padStart(3, "0") || "000";
							const fullFips = `${stateFips}${countyFips}`;

							allCountyRents.push({
								fips: fullFips,
								stateName: state.state_name,
								stateCode: state.state_code,
								countyName: county.county_name,
								metroName: fmrData.metroName,
								areaName: fmrData.areaName,
								year: DATA_YEAR,
								medianRent: medianRent,
								efficencyRent: fmrData.Efficiency || null,
								oneBrRent: fmrData["One-Bedroom"] || null,
								twoBrRent: fmrData["Two-Bedroom"] || null,
								threeBrRent: fmrData["Three-Bedroom"] || null,
								fourBrRent: fmrData["Four-Bedroom"] || null,
								entityId: county.fips_code,
							});

							console.log(`    ✓ ${county.county_name}: $${medianRent}/month`);
						}
					}

					// Rate limiting - wait between requests to avoid overwhelming the API
					await new Promise((resolve) => setTimeout(resolve, 1000)); // Increased to 1 second
				}
			} catch (error) {
				console.error(`Error processing ${state.state_name}: ${error.message}`);
			}

			// Progress update
			console.log(`    ✓ Completed ${state.state_name} - Total counties collected: ${allCountyRents.length}`);
		}

		console.log(`\n🏁 Finished processing all ${states.length} states/territories!`);
		console.log(`📊 Total counties processed: ${totalCountiesProcessed}`);
		console.log(`📊 Counties with rent data: ${allCountyRents.length}`);

		return allCountyRents;
	} catch (error) {
		throw new Error(`Failed to collect rent data: ${error.message}`);
	}
}

// Main execution
(async () => {
	try {
		const rentData = await collectCountyRentData();

		if (rentData.length === 0) {
			console.log("\n⚠️  No county rent data collected from API.");
			return;
		}

		// Sort by median rent (highest first)
		rentData.sort((a, b) => b.medianRent - a.medianRent);

		console.log(`\n✅ Successfully collected rent data for ${rentData.length} counties`);

		// Create output directory if it doesn't exist
		await fs.mkdir("data/base", { recursive: true });

		// Save to JSON file
		const jsonFilePath = `data/base/rents_${DATA_YEAR}.json`;
		await fs.writeFile(jsonFilePath, JSON.stringify(rentData, null, 2));
		console.log(`✓ Saved to: ${jsonFilePath}`);

		// Save to CSV file
		const csvHeader =
			"FIPS,State,State Code,County,Metro Area,Year,Median Rent,Efficiency,1BR,2BR,3BR,4BR,Entity ID\n";
		const csvRows = rentData
			.map(
				(county) =>
					`"${county.fips}","${county.stateName}","${county.stateCode}","${county.countyName}","${county.areaName || county.metroName || ""}",${county.year},${county.medianRent},${county.efficencyRent || ""},${county.oneBrRent || ""},${county.twoBrRent || ""},${county.threeBrRent || ""},${county.fourBrRent || ""},"${county.entityId}"`,
			)
			.join("\n");

		const csvFilePath = `data/base/rents_${DATA_YEAR}.csv`;
		await fs.writeFile(csvFilePath, csvHeader + csvRows);
		console.log(`✓ Saved to: ${csvFilePath}`);

		// Show sample of results
		console.log("\nSample results (top 5 by median rent):");
		rentData.slice(0, 5).forEach((county) => {
			console.log(`  ${county.countyName}, ${county.stateName}`);
			console.log(`    Median Rent (2BR): $${county.medianRent?.toLocaleString()}/month`);
			console.log(`    Range: $${county.oneBrRent || "N/A"} (1BR) - $${county.fourBrRent || "N/A"} (4BR)`);
		});

		// Show summary statistics
		const rents = rentData.map((c) => c.medianRent).filter((r) => r > 0);
		if (rents.length > 0) {
			const minRent = Math.min(...rents);
			const maxRent = Math.max(...rents);
			const avgRent = rents.reduce((sum, rent) => sum + rent, 0) / rents.length;

			console.log("\n📊 Rent Summary Statistics:");
			console.log(`  Counties with data: ${rentData.length}`);
			console.log(`  Lowest median rent: $${minRent.toLocaleString()}/month`);
			console.log(`  Highest median rent: $${maxRent.toLocaleString()}/month`);
			console.log(`  Average median rent: $${Math.round(avgRent).toLocaleString()}/month`);
		}
	} catch (error) {
		console.error("Error:", error.message);
		console.log("\n💡 Troubleshooting tips:");
		console.log("1. Get a HUD API key from https://www.huduser.gov/portal/dataset/fmr-api.html");
		console.log("2. Add HUD_API_KEY=your_token to your .env file");
		console.log("3. Check API documentation at huduser.gov for latest endpoints");
		process.exit(1);
	}
})();
