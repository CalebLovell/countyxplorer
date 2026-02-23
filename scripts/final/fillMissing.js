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

	// Remove state name from county if present
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

async function fillMissingData() {
	console.log("Starting fillMissing script...");
	const fillDir = path.join(__dirname, "..", "..", "data", "fill");
	const finalDir = path.join(__dirname, "..", "..", "data", "final");

	console.log("Fill data directory:", fillDir);
	console.log("Final data directory:", finalDir);

	console.log("\nLoading base data...");

	// Load the base data
	const basePath = path.join(finalDir, "base.json");
	if (!fs.existsSync(basePath)) {
		throw new Error(`Base data not found at ${basePath}. Run combineBase.js first.`);
	}

	const baseData = JSON.parse(fs.readFileSync(basePath, "utf8"));
	console.log(`Loaded ${baseData.length} counties from base.json`);

	// Load estimate data
	console.log("\nLoading estimate files...");
	let temperaturesEstimates, electionsEstimates, rentsEstimates, housingEstimates;

	try {
		temperaturesEstimates = parseCSV(fs.readFileSync(path.join(fillDir, "temperatures_estimates.csv"), "utf8"));
		console.log(`  ✓ Loaded ${temperaturesEstimates.rows.length} temperature estimates`);
	} catch (_error) {
		console.log(`  ℹ temperatures_estimates.csv not found, skipping`);
		temperaturesEstimates = null;
	}

	try {
		electionsEstimates = parseCSV(fs.readFileSync(path.join(fillDir, "elections_estimates.csv"), "utf8"));
		console.log(`  ✓ Loaded ${electionsEstimates.rows.length} election estimates`);
	} catch (_error) {
		console.log(`  ℹ elections_estimates.csv not found, skipping`);
		electionsEstimates = null;
	}

	// Load both rents_filled.csv and rents_estimates.csv
	let rentsFilledData = null;
	let rentsEstimatesData = null;

	try {
		rentsFilledData = parseCSV(fs.readFileSync(path.join(fillDir, "rents_filled.csv"), "utf8"));
		console.log(`  ✓ Loaded ${rentsFilledData.rows.length} filled rent records`);
	} catch (_error) {
		console.log(`  ℹ rents_filled.csv not found, skipping`);
	}

	try {
		rentsEstimatesData = parseCSV(fs.readFileSync(path.join(fillDir, "rents_estimates.csv"), "utf8"));
		console.log(`  ✓ Loaded ${rentsEstimatesData.rows.length} rent estimates`);
	} catch (_error) {
		console.log(`  ℹ rents_estimates.csv not found, skipping`);
	}

	// Combine both rent sources
	rentsEstimates = { rows: [] };
	if (rentsFilledData) rentsEstimates.rows.push(...rentsFilledData.rows);
	if (rentsEstimatesData) rentsEstimates.rows.push(...rentsEstimatesData.rows);
	if (rentsEstimates.rows.length === 0) rentsEstimates = null;

	try {
		housingEstimates = parseCSV(fs.readFileSync(path.join(fillDir, "housing_estimates.csv"), "utf8"));
		console.log(`  ✓ Loaded ${housingEstimates.rows.length} housing estimates`);
	} catch (_error) {
		console.log(`  ℹ housing_estimates.csv not found, skipping`);
		housingEstimates = null;
	}

	console.log("\nCreating estimate lookup maps...");

	// Create lookup maps for estimates
	const tempEstimatesMap = new Map();
	const tempEstimatesNameMap = new Map();
	if (temperaturesEstimates) {
		temperaturesEstimates.rows.forEach((row) => {
			const fips = normalizeFIPS(row.FIPS);
			if (fips) tempEstimatesMap.set(fips, row);

			// Also create name-based lookup
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
					.replace(/planning region$/, "")
					.replace(/city$/, "")
					.trim();
				const key = `${county}|${stateCode}`;
				tempEstimatesNameMap.set(key, row);
			}
		});
	}

	const electionsEstimatesMap = new Map();
	if (electionsEstimates) {
		electionsEstimates.rows.forEach((row) => {
			const fips = normalizeFIPS(row.FIPS);
			if (fips) electionsEstimatesMap.set(fips, row);
		});
	}

	const rentsEstimatesMap = new Map();
	const rentsEstimatesNameMap = new Map();
	if (rentsEstimates) {
		rentsEstimates.rows.forEach((row) => {
			const fips = normalizeFIPS(row.FIPS);
			if (fips) rentsEstimatesMap.set(fips, row);

			const countyKey = normalizeCountyName(row.County, row.State);
			rentsEstimatesNameMap.set(countyKey, row);
		});
	}

	const housingEstimatesMap = new Map();
	if (housingEstimates) {
		housingEstimates.rows.forEach((row) => {
			const fips = normalizeFIPS(row.FIPS);
			if (fips) housingEstimatesMap.set(fips, row);
		});
	}

	console.log("\nApplying estimates to create fill and final datasets...");

	// Track what was filled
	const fillData = [];
	let tempFilled = 0;
	let rentsFilled = 0;
	let electionsFilled = 0;
	let housingFilled = 0;

	const finalData = baseData.map((row) => {
		const finalRow = { ...row };
		const fillRow = { FIPS: row.FIPS, County: row.County, State: row.State };
		let hasFillData = false;

		// Fill temperature data if missing
		if (!finalRow["temp_Avg Temperature (°F)"] || finalRow["temp_Avg Temperature (°F)"] === "") {
			let tempData = tempEstimatesMap.get(finalRow.FIPS);
			if (!tempData) {
				// Try name-based lookup
				const county = finalRow.County.replace(/"/g, "")
					.trim()
					.toLowerCase()
					.replace(/\s+(county|parish|borough|municipality|census area)$/i, "")
					.trim();
				const stateCode = getStateAbbreviation(finalRow.State);
				const nameKey = `${county}|${stateCode}`;
				tempData = tempEstimatesNameMap.get(nameKey);
			}

			if (tempData) {
				Object.keys(tempData).forEach((key) => {
					if (!["FIPS", "County Name", "State"].includes(key)) {
						finalRow[`temp_${key}`] = tempData[key];
						fillRow[`temp_${key}`] = tempData[key];
					}
				});
				hasFillData = true;
				tempFilled++;
			}
		}

		// Fill rent data if missing
		if (!finalRow["rent_Median Rent"] || finalRow["rent_Median Rent"] === "") {
			let rentsData = rentsEstimatesMap.get(finalRow.FIPS);
			if (!rentsData) {
				const countyKey = normalizeCountyName(finalRow.County, finalRow.State);
				rentsData = rentsEstimatesNameMap.get(countyKey);
			}

			if (rentsData) {
				Object.keys(rentsData).forEach((key) => {
					if (!["FIPS", "State", "State Code", "County", "Year"].includes(key)) {
						finalRow[`rent_${key}`] = rentsData[key];
						fillRow[`rent_${key}`] = rentsData[key];
					}
				});
				hasFillData = true;
				rentsFilled++;
			}
		}

		// Fill elections if missing
		if (!finalRow["Total Votes"] || finalRow["Total Votes"] === "") {
			const electionsData = electionsEstimatesMap.get(finalRow.FIPS);
			if (electionsData) {
				Object.keys(electionsData).forEach((key) => {
					if (!["FIPS", "County", "State"].includes(key)) {
						finalRow[key] = electionsData[key];
						fillRow[key] = electionsData[key];
					}
				});
				hasFillData = true;
				electionsFilled++;
			}
		}

		// Fill housing if missing
		if (!finalRow["housing_Median Home Value"] || finalRow["housing_Median Home Value"] === "") {
			const housingData = housingEstimatesMap.get(finalRow.FIPS);
			if (housingData) {
				Object.keys(housingData).forEach((key) => {
					if (!["FIPS", "County", "State"].includes(key)) {
						finalRow[`housing_${key}`] = housingData[key];
						fillRow[`housing_${key}`] = housingData[key];
					}
				});
				hasFillData = true;
				housingFilled++;
			}
		}

		if (hasFillData) {
			fillData.push(fillRow);
		}

		return finalRow;
	});

	console.log(`\n📊 Estimates applied:`);
	console.log(`  Temperature estimates: ${tempFilled} counties`);
	console.log(`  Rent estimates: ${rentsFilled} counties`);
	console.log(`  Election estimates: ${electionsFilled} counties`);
	console.log(`  Housing estimates: ${housingFilled} counties`);
	console.log(`  Total fill records: ${fillData.length}`);

	// Calculate final coverage
	const stats = {
		total_counties: finalData.length,
		with_elections: finalData.filter((r) => r["Total Votes"]).length,
		with_housing: finalData.filter((r) => r["housing_Median Home Value"]).length,
		with_ages: finalData.filter((r) => r["age_Median Age"]).length,
		with_population: finalData.filter((r) => r.Population).length,
		with_temperatures: finalData.filter((r) => r["temp_Avg Temperature (°F)"]).length,
		with_rents: finalData.filter((r) => r["rent_Median Rent"]).length,
	};

	console.log("\n📈 Final Data Coverage:");
	Object.entries(stats).forEach(([key, value]) => {
		const pct = ((value / stats.total_counties) * 100).toFixed(1);
		console.log(`  ${key}: ${value} (${pct}%)`);
	});

	console.log("\n📝 Writing output files...");

	// Write fill data (only estimated values)
	if (fillData.length > 0) {
		const fillHeaders = Object.keys(fillData[0]);
		const fillCsvContent = [
			fillHeaders.join(","),
			...fillData.map((row) =>
				fillHeaders
					.map((header) => {
						const value = row[header] || "";
						return value.toString().includes(",") ? `"${value}"` : value;
					})
					.join(","),
			),
		].join("\n");

		const fillCsvPath = path.join(finalDir, "fill.csv");
		fs.writeFileSync(fillCsvPath, fillCsvContent);
		const fillJsonPath = path.join(finalDir, "fill.json");
		fs.writeFileSync(fillJsonPath, JSON.stringify(fillData, null, 2));
		console.log(`  ✓ Fill data: ${fillCsvPath}`);
	}

	// Write final data (base + estimates)
	const finalHeaders = Object.keys(finalData[0]);
	const finalCsvContent = [
		finalHeaders.join(","),
		...finalData.map((row) =>
			finalHeaders
				.map((header) => {
					const value = row[header] || "";
					return value.toString().includes(",") ? `"${value}"` : value;
				})
				.join(","),
		),
	].join("\n");

	const finalCsvPath = path.join(finalDir, "final.csv");
	fs.writeFileSync(finalCsvPath, finalCsvContent);
	const finalJsonPath = path.join(finalDir, "final.json");
	fs.writeFileSync(finalJsonPath, JSON.stringify(finalData, null, 2));
	console.log(`  ✓ Final data: ${finalCsvPath}`);

	console.log("\n✅ Data processing complete!");
	console.log(`   Base: ${baseData.length} counties (raw data only)`);
	console.log(`   Fill: ${fillData.length} counties (estimated data only)`);
	console.log(`   Final: ${finalData.length} counties (base + fill)`);
	console.log(`   Total columns: ${finalHeaders.length}`);
}

const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
	console.log("Script executed directly, running fillMissingData...\n");
	fillMissingData().catch((err) => {
		console.error("Error in fillMissingData:", err);
		process.exit(1);
	});
}

export { fillMissingData };
