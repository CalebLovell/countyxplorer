import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV parsing utility
function parseCSV(content) {
	const lines = content.trim().split("\n");
	const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
	const rows = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i]);
		const row = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || "";
		});
		rows.push(row);
	}

	return { headers, rows };
}

// Parse CSV line handling quotes and commas
function parseCSVLine(line) {
	const result = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

// State name to abbreviation map
const STATE_ABBREV = {
	alabama: "al",
	alaska: "ak",
	arizona: "az",
	arkansas: "ar",
	california: "ca",
	colorado: "co",
	connecticut: "ct",
	delaware: "de",
	florida: "fl",
	georgia: "ga",
	hawaii: "hi",
	idaho: "id",
	illinois: "il",
	indiana: "in",
	iowa: "ia",
	kansas: "ks",
	kentucky: "ky",
	louisiana: "la",
	maine: "me",
	maryland: "md",
	massachusetts: "ma",
	michigan: "mi",
	minnesota: "mn",
	mississippi: "ms",
	missouri: "mo",
	montana: "mt",
	nebraska: "ne",
	nevada: "nv",
	"new hampshire": "nh",
	"new jersey": "nj",
	"new mexico": "nm",
	"new york": "ny",
	"north carolina": "nc",
	"north dakota": "nd",
	ohio: "oh",
	oklahoma: "ok",
	oregon: "or",
	pennsylvania: "pa",
	"rhode island": "ri",
	"south carolina": "sc",
	"south dakota": "sd",
	tennessee: "tn",
	texas: "tx",
	utah: "ut",
	vermont: "vt",
	virginia: "va",
	washington: "wa",
	"west virginia": "wv",
	wisconsin: "wi",
	wyoming: "wy",
	"district of columbia": "dc",
};

// Normalize FIPS code
function normalizeFIPS(fips) {
	if (!fips) return "";
	return fips.toString().replace(/"/g, "").padStart(5, "0");
}

// Normalize state name to abbreviation
function normalizeState(state) {
	const clean = state.replace(/"/g, "").trim().toLowerCase();
	// If already an abbreviation (2 letters), return it
	if (clean.length === 2) return clean;
	// Otherwise look up full name
	return STATE_ABBREV[clean] || clean;
}

// Normalize county name for matching
function normalizeCountyName(county, state) {
	let cleanCounty = county.replace(/"/g, "").trim();

	// Remove state prefix if present (e.g., "AL: Autauga" -> "Autauga")
	cleanCounty = cleanCounty.replace(/^[A-Z]{2}:\s*/, "");

	// Remove common suffixes
	cleanCounty = cleanCounty.replace(/\s+(county|parish|borough|municipality|municipio|census area)$/i, "").trim();

	// Remove state name from county if present (e.g., "Autauga County, Alabama" -> "Autauga")
	const parts = cleanCounty.split(",");
	if (parts.length > 1) {
		cleanCounty = parts[0].trim();
	}

	// Normalize state to abbreviation
	const normalizedState = normalizeState(state);

	return `${cleanCounty}|${normalizedState}`.toLowerCase();
}

async function combineBaseData() {
	console.log("Starting combineBase script...");
	const baseDir = path.join(__dirname, "..", "..", "data", "base");
	const finalDir = path.join(__dirname, "..", "..", "data", "final");

	console.log("Base data directory:", baseDir);
	console.log("Final data directory:", finalDir);

	console.log("\nLoading base CSV files...");

	// Load only base CSV files
	const elections = parseCSV(fs.readFileSync(path.join(baseDir, "elections_2024.csv"), "utf8"));
	const housing = parseCSV(fs.readFileSync(path.join(baseDir, "housing_2023.csv"), "utf8"));
	const ages = parseCSV(fs.readFileSync(path.join(baseDir, "median_ages_2023.csv"), "utf8"));
	const population = parseCSV(fs.readFileSync(path.join(baseDir, "population_2023.csv"), "utf8"));
	const temperatures = parseCSV(fs.readFileSync(path.join(baseDir, "temperatures_2023.csv"), "utf8"));
	const rents = parseCSV(fs.readFileSync(path.join(baseDir, "rents_2023.csv"), "utf8"));

	console.log(`Loaded data:
    - Elections: ${elections.rows.length} rows
    - Housing: ${housing.rows.length} rows
    - Ages: ${ages.rows.length} rows
    - Population: ${population.rows.length} rows
    - Temperatures: ${temperatures.rows.length} rows
    - Rents: ${rents.rows.length} rows`);

	// Create lookup maps
	const electionsMap = new Map();
	elections.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) electionsMap.set(fips, row);
	});

	const housingMap = new Map();
	housing.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) housingMap.set(fips, row);
	});

	const agesMap = new Map();
	ages.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) agesMap.set(fips, row);
	});

	const temperaturesMap = new Map();
	const temperaturesByName = new Map();
	temperatures.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) temperaturesMap.set(fips, row);

		// Also create name-based lookup for temperatures
		const countyName = row["County Name"] || row.County || "";
		const stateName = row.State || "";
		if (countyName && stateName) {
			const countyKey = normalizeCountyName(countyName, stateName);
			temperaturesByName.set(countyKey, row);
		}
	});

	const rentsMap = new Map();
	const rentsByName = new Map();
	rents.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) rentsMap.set(fips, row);

		// Also create name-based lookup for rents
		const countyKey = normalizeCountyName(row.County, row.State);
		rentsByName.set(countyKey, row);
	});

	console.log("\nMerging data by FIPS...");

	// Start with population as base and merge by FIPS
	const combined = [];

	population.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (!fips) return;

		// Exclude Puerto Rico (FIPS codes starting with 72)
		if (fips.startsWith("72")) return;

		// Extract county name from "County Name, State" format
		const nameParts = row["County Name"].split(",");
		const countyName = nameParts[0].trim();
		const stateName = row.State;

		const combinedRow = {
			FIPS: fips,
			County: countyName,
			State: stateName,
			Population: row.Population,
			Year: row.Year,
		};

		// Merge elections data
		const electionsData = electionsMap.get(fips);
		if (electionsData) {
			Object.keys(electionsData).forEach((key) => {
				if (!["FIPS", "County", "State"].includes(key)) {
					combinedRow[key] = electionsData[key];
				}
			});
		}

		// Merge housing data
		const housingData = housingMap.get(fips);
		if (housingData) {
			Object.keys(housingData).forEach((key) => {
				if (!["FIPS", "County", "State"].includes(key)) {
					combinedRow[`housing_${key}`] = housingData[key];
				}
			});
		}

		// Merge ages data
		const agesData = agesMap.get(fips);
		if (agesData) {
			Object.keys(agesData).forEach((key) => {
				if (!["FIPS", "County Name", "State", "State FIPS", "County FIPS"].includes(key)) {
					combinedRow[`age_${key}`] = agesData[key];
				}
			});
		}

		// Merge temperatures data - try FIPS first, then name-based matching
		let temperaturesData = temperaturesMap.get(fips);
		if (!temperaturesData) {
			// Fallback to county name matching
			const countyKey = normalizeCountyName(countyName, stateName);
			temperaturesData = temperaturesByName.get(countyKey);
		}
		if (temperaturesData) {
			Object.keys(temperaturesData).forEach((key) => {
				if (!["FIPS", "County Name", "State"].includes(key)) {
					combinedRow[`temp_${key}`] = temperaturesData[key];
				}
			});
		}

		// Merge rents data - try FIPS first, then name-based matching
		let rentsData = rentsMap.get(fips);
		if (!rentsData) {
			// Fallback to county name matching
			const countyKey = normalizeCountyName(countyName, stateName);
			rentsData = rentsByName.get(countyKey);
		}
		if (rentsData) {
			Object.keys(rentsData).forEach((key) => {
				if (!["FIPS", "State", "State Code", "County", "Year"].includes(key)) {
					combinedRow[`rent_${key}`] = rentsData[key];
				}
			});
		}

		combined.push(combinedRow);
	});

	// Count matches
	const stats = {
		total_counties: combined.length,
		with_elections: combined.filter((r) => r["Total Votes"]).length,
		with_housing: combined.filter((r) => r["housing_Median Home Value"]).length,
		with_ages: combined.filter((r) => r["age_Median Age"]).length,
		with_population: combined.filter((r) => r.Population).length,
		with_temperatures: combined.filter((r) => r["temp_Avg Temperature (°F)"]).length,
		with_rents: combined.filter((r) => r["rent_Median Rent"]).length,
	};

	console.log("\n📈 Base Data Coverage:");
	Object.entries(stats).forEach(([key, value]) => {
		const pct = ((value / stats.total_counties) * 100).toFixed(1);
		console.log(`  ${key}: ${value} (${pct}%)`);
	});

	// Generate output CSV
	const outputHeaders = Object.keys(combined[0]);
	const csvContent = [
		outputHeaders.join(","),
		...combined.map((row) =>
			outputHeaders
				.map((header) => {
					const value = row[header] || "";
					// Quote values that contain commas
					return value.toString().includes(",") ? `"${value}"` : value;
				})
				.join(","),
		),
	].join("\n");

	// Ensure final directory exists
	if (!fs.existsSync(finalDir)) {
		fs.mkdirSync(finalDir, { recursive: true });
	}

	const csvOutputPath = path.join(finalDir, "base.csv");
	fs.writeFileSync(csvOutputPath, csvContent);

	// Also write JSON output
	const jsonOutputPath = path.join(finalDir, "base.json");
	fs.writeFileSync(jsonOutputPath, JSON.stringify(combined, null, 2));

	console.log(`\n✅ Base dataset written to:`);
	console.log(`   CSV: ${csvOutputPath}`);
	console.log(`   JSON: ${jsonOutputPath}`);
	console.log(`📊 Total counties: ${combined.length}`);
	console.log(`📋 Total columns: ${outputHeaders.length}`);
}

const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
	console.log("Script executed directly, running combineBaseData...\n");
	combineBaseData().catch((err) => {
		console.error("Error in combineBaseData:", err);
		process.exit(1);
	});
}

export { combineBaseData };
