import { promises as fs } from "node:fs";
import https from "node:https";

// Census API endpoint for American Community Survey 5-Year Estimates (2019-2023)
// Using B25077_001E which is "Median value (dollars)" for owner-occupied housing units
const CENSUS_API_URL = "https://api.census.gov/data/2023/acs/acs5?get=B25077_001E,NAME&for=county:*&in=state:*";

async function fetchHousingData() {
	console.log("Downloading median home value data from US Census API...");

	return new Promise((resolve, reject) => {
		https
			.get(CENSUS_API_URL, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}: ${CENSUS_API_URL}`));
					return;
				}

				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					try {
						const jsonData = JSON.parse(data);
						console.log(`Downloaded ${jsonData.length - 1} county housing records`);
						resolve(jsonData);
					} catch (error) {
						reject(new Error(`Failed to parse JSON: ${error.message}`));
					}
				});
			})
			.on("error", reject);
	});
}

function parseHousingData(apiData) {
	console.log("Processing housing data...");

	// First row is headers: ["B25077_001E","NAME","state","county"]
	const [...rows] = apiData;

	const records = rows.map((row) => {
		const [medianValue, name, stateCode, countyCode] = row;

		// Parse county name and state from NAME field (e.g., "Autauga County, Alabama")
		const [countyName, stateName] = name.split(", ");

		// Create FIPS code by combining state and county codes
		const fips = stateCode + countyCode;

		// Parse median home value (null values come as null from API, negative values are data errors)
		let medianHomeValue = null;
		if (medianValue !== null && !Number.isNaN(medianValue)) {
			const parsedValue = parseInt(medianValue, 10);
			// Only accept positive values (negative values are likely data errors)
			medianHomeValue = parsedValue > 0 ? parsedValue : null;
		}

		return {
			fips: fips,
			county: countyName,
			state: stateName,
			medianHomeValue: medianHomeValue,
		};
	});

	// Filter out records with null or invalid values
	const validRecords = records.filter((record) => record.medianHomeValue !== null && record.medianHomeValue > 0);

	console.log(`Processed ${records.length} total records, ${validRecords.length} with valid data`);

	return validRecords;
}

function calculateHousingMetrics(records) {
	console.log("Calculating housing market metrics...");

	// Calculate national statistics for reference
	const validValues = records.map((r) => r.medianHomeValue);
	const nationalMedian = validValues.sort((a, b) => a - b)[Math.floor(validValues.length / 2)];
	const nationalMean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

	console.log(`National median home value: $${nationalMedian.toLocaleString()}`);
	console.log(`National mean home value: $${nationalMean.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);

	// Add comparative metrics to each record
	const processedData = records.map((record) => ({
		...record,
		percentageOfNationalMedian: ((record.medianHomeValue / nationalMedian) * 100).toFixed(1),
		priceCategory: categorizeHomePrice(record.medianHomeValue, nationalMedian),
	}));

	// Sort by median home value (highest first)
	processedData.sort((a, b) => b.medianHomeValue - a.medianHomeValue);

	return {
		data: processedData,
		nationalMedian,
		nationalMean,
	};
}

function categorizeHomePrice(value, nationalMedian) {
	const ratio = value / nationalMedian;
	if (ratio >= 2.0) return "Very Expensive";
	if (ratio >= 1.5) return "Expensive";
	if (ratio >= 0.75) return "Moderate";
	if (ratio >= 0.5) return "Affordable";
	return "Very Affordable";
}

async function main() {
	console.log("Starting US County Housing Data Collection...\n");

	try {
		// Fetch data from Census API
		const apiData = await fetchHousingData();

		// Parse and clean the data
		const housingRecords = parseHousingData(apiData);

		// Calculate metrics and comparisons
		const { data: housingData, nationalMedian } = calculateHousingMetrics(housingRecords);

		console.log(`\n✓ Successfully processed housing data for ${housingData.length} counties`);

		// Save to JSON file
		const jsonOutput = housingData.map(({ dataYear, ...rest }) => rest);
		await fs.writeFile("data/base/housing_2023.json", JSON.stringify(jsonOutput, null, 2));
		console.log("✓ Saved to: data/base/housing_2023.json");

		// Save to CSV file
		const csvHeader = "FIPS,County,State,Median Home Value,% of National Median,Price Category\n";
		const csvRows = housingData
			.map(
				(r) =>
					`${r.fips},"${r.county}","${r.state}",${r.medianHomeValue},${r.percentageOfNationalMedian},${r.priceCategory}`,
			)
			.join("\n");
		await fs.writeFile("data/base/housing_2023.csv", csvHeader + csvRows);
		console.log("✓ Saved to: data/base/housing_2023.csv");

		// Show sample results - most expensive counties
		console.log("\nMost expensive counties (top 10):");
		housingData.slice(0, 10).forEach((r, i) => {
			console.log(
				`  ${i + 1}. ${r.county}, ${r.state}: $${r.medianHomeValue.toLocaleString()} (${r.percentageOfNationalMedian}% of national)`,
			);
		});

		// Show sample results - most affordable counties
		console.log("\nMost affordable counties (bottom 10):");
		housingData
			.slice(-10)
			.reverse()
			.forEach((r, i) => {
				console.log(
					`  ${i + 1}. ${r.county}, ${r.state}: $${r.medianHomeValue.toLocaleString()} (${r.percentageOfNationalMedian}% of national)`,
				);
			});

		// Show category breakdown
		const categories = {};
		housingData.forEach((r) => {
			categories[r.priceCategory] = (categories[r.priceCategory] || 0) + 1;
		});

		console.log("\nPrice category breakdown:");
		Object.entries(categories).forEach(([category, count]) => {
			console.log(`  ${category}: ${count} counties (${((count / housingData.length) * 100).toFixed(1)}%)`);
		});

		console.log(`\nNote: 1-year estimates only available for counties with 65,000+ population`);
		console.log(`National median home value: $${nationalMedian.toLocaleString()}`);
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

main();
