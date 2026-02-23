import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alaska Borough/Census Area names mapped by FIPS code
const ALASKA_BOROUGHS = {
	"02013": "Aleutians East Borough",
	"02016": "Aleutians West Census Area",
	"02020": "Anchorage Municipality",
	"02050": "Bethel Census Area",
	"02060": "Bristol Bay Borough",
	"02063": "Chugach Census Area",
	"02066": "Copper River Census Area",
	"02068": "Denali Borough",
	"02070": "Dillingham Census Area",
	"02090": "Fairbanks North Star Borough",
	"02100": "Haines Borough",
	"02105": "Hoonah-Angoon Census Area",
	"02110": "Juneau City and Borough",
	"02122": "Kenai Peninsula Borough",
	"02130": "Ketchikan Gateway Borough",
	"02150": "Kodiak Island Borough",
	"02158": "Kusilvak Census Area",
	"02164": "Lake and Peninsula Borough",
	"02170": "Matanuska-Susitna Borough",
	"02180": "Nome Census Area",
	"02185": "North Slope Borough",
	"02188": "Northwest Arctic Borough",
	"02195": "Petersburg Borough",
	"02198": "Prince of Wales-Hyder Census Area",
	"02220": "Sitka City and Borough",
	"02230": "Skagway Municipality",
	"02240": "Southeast Fairbanks Census Area",
	"02261": "Valdez-Cordova Census Area",
	"02275": "Wrangell City and Borough",
	"02282": "Yakutat City and Borough",
	"02290": "Yukon-Koyukuk Census Area",
};

// Alaska vote estimates based on population (~65% turnout)
const ALASKA_VOTE_ESTIMATES = {
	"02013": 3295,
	"02016": 4982,
	"02020": 278146,
	"02050": 18140,
	"02060": 836,
	"02063": 6854,
	"02066": 2617,
	"02068": 1619,
	"02070": 4706,
	"02090": 95965,
	"02100": 2574,
	"02105": 2023,
	"02110": 32255,
	"02122": 60790,
	"02130": 13948,
	"02150": 13101,
	"02158": 8368,
	"02164": 1592,
	"02170": 109280,
	"02180": 10004,
	"02185": 11113,
	"02188": 7925,
	"02195": 3398,
	"02198": 5753,
	"02220": 8458,
	"02230": 1183,
	"02240": 6970,
	"02261": 2545,
	"02275": 2127,
	"02282": 664,
	"02290": 5189,
};

// Alaska temperature estimates (°F)
const ALASKA_TEMPS = {
	"02013": 38.6,
	"02016": 38.1,
	"02020": 36.3,
	"02050": 28.5,
	"02060": 36.2,
	"02063": 35.8,
	"02066": 32.4,
	"02068": 29.7,
	"02070": 34.1,
	"02090": 26.9,
	"02100": 41.3,
	"02105": 42.1,
	"02110": 42.6,
	"02122": 35.4,
	"02130": 44.8,
	"02150": 39.2,
	"02158": 25.3,
	"02164": 36.8,
	"02170": 33.1,
	"02180": 23.8,
	"02185": 10.9,
	"02188": 19.6,
	"02195": 43.2,
	"02198": 43.7,
	"02220": 43.9,
	"02230": 40.8,
	"02240": 25.1,
	"02261": 37.2,
	"02275": 44.1,
	"02282": 40.5,
	"02290": 22.4,
};

// Connecticut Planning Region temperatures (°F)
const CONNECTICUT_TEMPS = {
	"09110": { name: "Capitol Planning Region", temp: 50.8 },
	"09120": { name: "Greater Bridgeport Planning Region", temp: 52.3 },
	"09130": { name: "Lower Connecticut River Valley Planning Region", temp: 51.2 },
	"09140": { name: "Naugatuck Valley Planning Region", temp: 49.9 },
	"09150": { name: "Northeastern Connecticut Planning Region", temp: 48.7 },
	"09160": { name: "Northwest Hills Planning Region", temp: 47.5 },
	"09170": { name: "South Central Connecticut Planning Region", temp: 52.1 },
	"09180": { name: "Southeastern Connecticut Planning Region", temp: 51.5 },
	"09190": { name: "Western Connecticut Planning Region", temp: 50.2 },
};

// Virginia temperatures (°F)
const VIRGINIA_TEMPS = {
	51678: { name: "Lexington city", temp: 55.2 },
};

// Alaska 2024 election constants
const ALASKA_DEM_PCT = 40.5;
const ALASKA_REP_PCT = 55.7;

// Hawaii 2024 election constants (averaged from Hawaii counties)
const HAWAII_DEM_PCT = 60.9;
const HAWAII_REP_PCT = 37.1;

/**
 * Converts array of objects to CSV format
 */
function arrayToCsv(data) {
	if (!data.length) return "";

	const headers = Object.keys(data[0]);
	const csvRows = [
		headers.join(","),
		...data.map((row) =>
			headers
				.map((header) => {
					const value = row[header] || "";
					return value.toString().includes(",") ? `"${value}"` : value;
				})
				.join(","),
		),
	];

	return csvRows.join("\n");
}

/**
 * Generate all fill estimates
 */
async function generateFillEstimates() {
	console.log("Generating fill estimates...\n");

	const estimates = {
		elections: [],
		temperatures: [],
		rents: [],
		housing: [],
	};

	// Alaska Elections
	console.log("Alaska Elections:");
	for (const [fips, name] of Object.entries(ALASKA_BOROUGHS)) {
		const estimatedVotes = ALASKA_VOTE_ESTIMATES[fips] || 1000;
		const demVotes = Math.round(estimatedVotes * (ALASKA_DEM_PCT / 100));
		const repVotes = Math.round(estimatedVotes * (ALASKA_REP_PCT / 100));
		const totalVotes = demVotes + repVotes;

		estimates.elections.push({
			FIPS: fips,
			County: name,
			State: "Alaska",
			"Total Votes": totalVotes,
			"Democrat Votes": demVotes,
			"Republican Votes": repVotes,
			"Democrat %": ALASKA_DEM_PCT.toFixed(2),
			"Republican %": ALASKA_REP_PCT.toFixed(2),
			Winner: "Republican",
			Note: "Estimated based on statewide results",
		});
	}
	console.log(`  ✓ Generated ${estimates.elections.length} Alaska election estimates`);

	// Kalawao County, Hawaii Election
	console.log("\nKalawao County, Hawaii Election:");
	const kalawaoVotes = 28; // ~65% turnout of population of 43
	const kalawaoDemVotes = Math.round(kalawaoVotes * (HAWAII_DEM_PCT / 100));
	const kalawaoRepVotes = Math.round(kalawaoVotes * (HAWAII_REP_PCT / 100));
	const kalawaoTotalVotes = kalawaoDemVotes + kalawaoRepVotes;

	estimates.elections.push({
		FIPS: "15005",
		County: "Kalawao County",
		State: "Hawaii",
		"Total Votes": kalawaoTotalVotes,
		"Democrat Votes": kalawaoDemVotes,
		"Republican Votes": kalawaoRepVotes,
		"Democrat %": HAWAII_DEM_PCT.toFixed(2),
		"Republican %": HAWAII_REP_PCT.toFixed(2),
		Winner: "Democrat",
		Note: "Estimated based on Hawaii statewide results",
	});
	console.log(`  ✓ Generated 1 Kalawao County election estimate`);

	// Alaska Temperatures
	console.log("\nAlaska Temperatures:");
	for (const [fips, name] of Object.entries(ALASKA_BOROUGHS)) {
		const temp = ALASKA_TEMPS[fips] || 30.0;
		estimates.temperatures.push({
			FIPS: fips,
			"County Name": `AK: ${name}`,
			State: "AK",
			"Avg Temperature (°F)": temp.toFixed(1),
			Note: "Estimated based on regional climate zones",
		});
	}
	console.log(`  ✓ Generated ${estimates.temperatures.length} Alaska temperature estimates`);

	// Connecticut Temperatures
	console.log("\nConnecticut Temperatures:");
	for (const [fips, data] of Object.entries(CONNECTICUT_TEMPS)) {
		estimates.temperatures.push({
			FIPS: fips,
			"County Name": `CT: ${data.name}`,
			State: "CT",
			"Avg Temperature (°F)": data.temp.toFixed(1),
			Note: "Estimated based on regional climate data",
		});
	}
	console.log(`  ✓ Generated ${Object.keys(CONNECTICUT_TEMPS).length} Connecticut temperature estimates`);

	// Virginia Temperatures
	console.log("\nVirginia Temperatures:");
	for (const [fips, data] of Object.entries(VIRGINIA_TEMPS)) {
		estimates.temperatures.push({
			FIPS: fips,
			"County Name": `VA: ${data.name}`,
			State: "VA",
			"Avg Temperature (°F)": data.temp.toFixed(1),
			Note: "Estimated based on regional climate data",
		});
	}
	console.log(`  ✓ Generated ${Object.keys(VIRGINIA_TEMPS).length} Virginia temperature estimate`);

	// District of Columbia Rent
	console.log("\nDistrict of Columbia Rent:");
	estimates.rents.push({
		FIPS: "11001",
		State: "District of Columbia",
		"State Code": "DC",
		County: "District of Columbia",
		"Metro Area": "Washington-Arlington-Alexandria, DC-VA-MD-WV HUD Metro FMR Area",
		Year: "2023",
		"Median Rent": "2650",
		Efficiency: "1850",
		"1BR": "2100",
		"2BR": "2650",
		"3BR": "3350",
		"4BR": "3750",
		"Entity ID": "1100199999",
		Note: "Estimated based on regional urban rent data",
	});
	console.log(`  ✓ Generated 1 District of Columbia rent estimate`);

	// Housing Estimates for Missing Counties
	console.log("\nHousing Estimates:");

	// Kalawao County, Hawaii - very small, use Hawaii County average
	estimates.housing.push({
		FIPS: "15005",
		County: "Kalawao County",
		State: "Hawaii",
		"Median Home Value": "650000",
		"Median Home Value Index": "377.2",
		Affordability: "Very Expensive",
		Note: "Estimated based on Hawaii regional data",
	});

	// Eureka County, Nevada - rural Nevada
	estimates.housing.push({
		FIPS: "32011",
		County: "Eureka County",
		State: "Nevada",
		"Median Home Value": "280000",
		"Median Home Value Index": "162.5",
		Affordability: "Expensive",
		Note: "Estimated based on rural Nevada data",
	});

	// Kenedy County, Texas - very small, rural
	estimates.housing.push({
		FIPS: "48261",
		County: "Kenedy County",
		State: "Texas",
		"Median Home Value": "85000",
		"Median Home Value Index": "49.3",
		Affordability: "Very Affordable",
		Note: "Estimated based on rural Texas data",
	});

	// King County, Texas - very small, rural
	estimates.housing.push({
		FIPS: "48269",
		County: "King County",
		State: "Texas",
		"Median Home Value": "70000",
		"Median Home Value Index": "40.6",
		Affordability: "Very Affordable",
		Note: "Estimated based on rural Texas data",
	});

	// Loving County, Texas - smallest population county in US
	estimates.housing.push({
		FIPS: "48301",
		County: "Loving County",
		State: "Texas",
		"Median Home Value": "75000",
		"Median Home Value Index": "43.5",
		Affordability: "Very Affordable",
		Note: "Estimated based on rural Texas data",
	});

	// Real County, Texas - rural
	estimates.housing.push({
		FIPS: "48385",
		County: "Real County",
		State: "Texas",
		"Median Home Value": "180000",
		"Median Home Value Index": "104.5",
		Affordability: "Affordable",
		Note: "Estimated based on rural Texas data",
	});

	console.log(`  ✓ Generated ${estimates.housing.length} housing estimates`);

	return estimates;
}

/**
 * Write fill estimates to files
 */
async function writeFillEstimates() {
	try {
		const estimates = await generateFillEstimates();
		const fillDir = path.join(__dirname, "..", "..", "data", "fill");

		console.log("\n📝 Writing fill estimate files...");

		// Write elections
		if (estimates.elections.length > 0) {
			const csvPath = path.join(fillDir, "elections_estimates.csv");
			const jsonPath = path.join(fillDir, "elections_estimates.json");
			await fs.writeFile(csvPath, arrayToCsv(estimates.elections));
			await fs.writeFile(jsonPath, JSON.stringify(estimates.elections, null, 2));
			console.log(`  ✓ Elections: ${csvPath}`);
		}

		// Write temperatures
		if (estimates.temperatures.length > 0) {
			const csvPath = path.join(fillDir, "temperatures_estimates.csv");
			const jsonPath = path.join(fillDir, "temperatures_estimates.json");
			await fs.writeFile(csvPath, arrayToCsv(estimates.temperatures));
			await fs.writeFile(jsonPath, JSON.stringify(estimates.temperatures, null, 2));
			console.log(`  ✓ Temperatures: ${csvPath}`);
		}

		// Write rents
		if (estimates.rents.length > 0) {
			const csvPath = path.join(fillDir, "rents_estimates.csv");
			const jsonPath = path.join(fillDir, "rents_estimates.json");
			await fs.writeFile(csvPath, arrayToCsv(estimates.rents));
			await fs.writeFile(jsonPath, JSON.stringify(estimates.rents, null, 2));
			console.log(`  ✓ Rents: ${csvPath}`);
		}

		// Write housing
		if (estimates.housing.length > 0) {
			const csvPath = path.join(fillDir, "housing_estimates.csv");
			const jsonPath = path.join(fillDir, "housing_estimates.json");
			await fs.writeFile(csvPath, arrayToCsv(estimates.housing));
			await fs.writeFile(jsonPath, JSON.stringify(estimates.housing, null, 2));
			console.log(`  ✓ Housing: ${csvPath}`);
		}

		console.log("\n✅ Fill estimates generated successfully!");
		console.log(`   Total elections: ${estimates.elections.length}`);
		console.log(`   Total temperatures: ${estimates.temperatures.length}`);
		console.log(`   Total rents: ${estimates.rents.length}`);
		console.log(`   Total housing: ${estimates.housing.length}`);
	} catch (error) {
		console.error("Error:", error.message);
		throw error;
	}
}

const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
	writeFillEstimates().catch(console.error);
}

export { generateFillEstimates, writeFillEstimates };
