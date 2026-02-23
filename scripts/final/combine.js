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

// Normalize FIPS code
function normalizeFIPS(fips) {
	if (!fips) return "";
	return fips.toString().replace(/"/g, "").padStart(5, "0");
}

// Normalize county name for matching
function normalizeCountyName(county, state) {
	let cleanCounty = county.replace(/"/g, "").trim();
	const cleanState = state.replace(/"/g, "").trim();

	// Remove common suffixes
	cleanCounty = cleanCounty.replace(/\s+(county|parish|borough|municipality|municipio|census area)$/i, "").trim();

	// Remove state name from county if present (e.g., "Autauga County, Alabama" -> "Autauga")
	const parts = cleanCounty.split(",");
	if (parts.length > 1) {
		cleanCounty = parts[0].trim();
	}

	return `${cleanCounty}|${cleanState}`.toLowerCase();
}

// Create state name to abbreviation mapping
function getStateAbbreviation(stateName) {
	const stateMap = {
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
	};
	return stateMap[stateName.toLowerCase()] || stateName.toLowerCase();
}

async function combineCountyData() {
	console.log("Starting combine script...");
	const baseDir = path.join(__dirname, "..", "..", "data", "base");
	const fillDir = path.join(__dirname, "..", "..", "data", "fill");
	const finalDir = path.join(__dirname, "..", "..", "data", "final");
	console.log("Base data directory:", baseDir);
	console.log("Fill data directory:", fillDir);
	console.log("Final data directory:", finalDir);

	console.log("\nLoading CSV files...");

	// Load all CSV files - use complete versions if available
	const elections = parseCSV(fs.readFileSync(path.join(baseDir, "elections_2024.csv"), "utf8"));
	const housing = parseCSV(fs.readFileSync(path.join(baseDir, "housing_2023.csv"), "utf8"));
	const ages = parseCSV(fs.readFileSync(path.join(baseDir, "median_ages_2023.csv"), "utf8"));
	const population = parseCSV(fs.readFileSync(path.join(baseDir, "population_2023.csv"), "utf8"));

	// Try to load filled versions with filled data, fallback to originals
	let temperatures, rents, alaskaElections;
	try {
		temperatures = parseCSV(fs.readFileSync(path.join(fillDir, "temperatures_filled.csv"), "utf8"));
		console.log("  ✓ Using filled temperatures data");
	} catch {
		temperatures = parseCSV(fs.readFileSync(path.join(baseDir, "temperatures_2023.csv"), "utf8"));
		console.log("  ℹ Using original temperatures (missing data not filled)");
	}

	try {
		rents = parseCSV(fs.readFileSync(path.join(fillDir, "rents_filled.csv"), "utf8"));
		console.log("  ✓ Using filled rents data");
	} catch {
		rents = parseCSV(fs.readFileSync(path.join(baseDir, "rents_2023.csv"), "utf8"));
		console.log("  ℹ Using original rents (missing data not filled)");
	}

	try {
		alaskaElections = parseCSV(fs.readFileSync(path.join(fillDir, "alaska_elections_filled.csv"), "utf8"));
		console.log("  ✓ Using filled Alaska elections data");
	} catch {
		alaskaElections = null;
		console.log("  ℹ Alaska elections not filled");
	}

	console.log(`Loaded data:
    - Elections: ${elections.rows.length} rows${alaskaElections ? ` + ${alaskaElections.rows.length} Alaska` : ""}
    - Housing: ${housing.rows.length} rows
    - Ages: ${ages.rows.length} rows
    - Population: ${population.rows.length} rows
    - Temperatures: ${temperatures.rows.length} rows
    - Rents: ${rents.rows.length} rows`);

	// Normalize FIPS codes and create lookup maps
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

	const populationMap = new Map();
	population.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) populationMap.set(fips, row);
	});

	const temperaturesMap = new Map();
	temperatures.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) temperaturesMap.set(fips, row);
	});

	// Also create temperature lookup by county name for better matching
	const temperaturesNameMap = new Map();
	temperatures.rows.forEach((row) => {
		// Format: 'AL: Autauga' or 'AL: Baldwin County'
		const parts = row["County Name"].split(": ");
		if (parts.length === 2) {
			const stateCode = parts[0].replace(/"/g, "").trim().toLowerCase();
			const county = parts[1]
				.replace(/"/g, "")
				.trim()
				.toLowerCase()
				.replace(/county$/, "")
				.replace(/parish$/, "")
				.replace(/borough$/, "")
				.replace(/municipality$/, "")
				.replace(/census area$/, "")
				.trim();
			const key = `${county}|${stateCode}`;
			temperaturesNameMap.set(key, row);
		}
	});

	console.log("Merging data by FIPS...");

	// Create elections lookup map (include Alaska if available)
	const electionsMap = new Map();
	elections.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) electionsMap.set(fips, row);
	});

	// Add Alaska elections if available
	if (alaskaElections) {
		alaskaElections.rows.forEach((row) => {
			const fips = normalizeFIPS(row.FIPS);
			if (fips) electionsMap.set(fips, row);
		});
	}

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

		// Add population data directly (since we're iterating over population)
		combinedRow.Population = row.Population;
		combinedRow.Year = row.Year;

		// Merge temperatures data - try FIPS first, then county name
		let temperaturesData = temperaturesMap.get(fips);
		if (!temperaturesData) {
			// Fallback to county name matching
			const county = countyName
				.replace(/"/g, "")
				.trim()
				.toLowerCase()
				.replace(/\s+(county|parish|borough|municipality|census area)$/i, "")
				.trim();
			const stateCode = getStateAbbreviation(stateName);
			const nameKey = `${county}|${stateCode}`;
			temperaturesData = temperaturesNameMap.get(nameKey);
		}
		if (temperaturesData) {
			Object.keys(temperaturesData).forEach((key) => {
				if (!["FIPS", "County Name", "State"].includes(key)) {
					combinedRow[`temp_${key}`] = temperaturesData[key];
				}
			});
		}

		combined.push(combinedRow);
	});

	console.log("Mapping rents data by county name...");

	// Create rents lookup by county name and FIPS
	const rentsMap = new Map();
	const rentsByName = new Map();
	rents.rows.forEach((row) => {
		const fips = normalizeFIPS(row.FIPS);
		if (fips) {
			rentsMap.set(fips, row);
		}
		const countyKey = normalizeCountyName(row.County, row.State);
		rentsByName.set(countyKey, row);
	});

	// Add rents data to combined dataset
	let rentsMatched = 0;
	let temperaturesMatched = 0;
	combined.forEach((row) => {
		// Try FIPS match first, then fall back to county name
		let rentsData = rentsMap.get(row.FIPS);
		if (!rentsData) {
			const countyKey = normalizeCountyName(row.County, row.State);
			rentsData = rentsByName.get(countyKey);
		}

		if (rentsData) {
			rentsMatched++;
			Object.keys(rentsData).forEach((key) => {
				if (!["FIPS", "State", "State Code", "County", "Year"].includes(key)) {
					row[`rent_${key}`] = rentsData[key];
				}
			});
		}

		// Count temperature matches
		if (row["temp_Avg Temperature (°F)"]) {
			temperaturesMatched++;
		}
	});

	console.log(`Rents data matched: ${rentsMatched}/${combined.length} counties`);
	console.log(`Temperature data matched: ${temperaturesMatched}/${combined.length} counties`);

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

	const csvOutputPath = path.join(finalDir, "counties_combined.csv");
	fs.writeFileSync(csvOutputPath, csvContent);

	// Also write JSON output
	const jsonOutputPath = path.join(finalDir, "counties_combined.json");
	fs.writeFileSync(jsonOutputPath, JSON.stringify(combined, null, 2));

	console.log(`✅ Combined dataset written to:`);
	console.log(`   CSV: ${csvOutputPath}`);
	console.log(`   JSON: ${jsonOutputPath}`);
	console.log(`📊 Total counties: ${combined.length}`);
	console.log(`📋 Total columns: ${outputHeaders.length}`);

	// Summary statistics
	const stats = {
		total_counties: combined.length,
		with_elections: combined.filter((r) => r["Total Votes"]).length,
		with_housing: combined.filter((r) => r["housing_Median Home Value"]).length,
		with_ages: combined.filter((r) => r["age_Median Age"]).length,
		with_population: combined.filter((r) => r.Population).length,
		with_temperatures: combined.filter((r) => r["temp_Avg Temperature (°F)"]).length,
		with_rents: rentsMatched,
	};

	console.log("\n📈 Data Coverage:");
	Object.entries(stats).forEach(([key, value]) => {
		const pct = ((value / stats.total_counties) * 100).toFixed(1);
		console.log(`  ${key}: ${value} (${pct}%)`);
	});
}

const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
	console.log("Script executed directly, running combineCountyData...");
	combineCountyData().catch((err) => {
		console.error("Error in combineCountyData:", err);
		process.exit(1);
	});
} else {
	console.log("Module imported, not running automatically");
}

export { combineCountyData };
