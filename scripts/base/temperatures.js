import { createWriteStream, promises as fs } from "node:fs";
import https from "node:https";
import os from "node:os"; // Added import for os module
import path from "node:path";
import * as tar from "tar";

const DATA_YEAR = 2023;

// Archive URLs mapping for data year (extracted from NOAA directory listing)
const archiveUrls = {
	1: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0101_e${DATA_YEAR}0131_c${DATA_YEAR}0404.tar.gz`,
	2: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0201_e${DATA_YEAR}0228_c${DATA_YEAR}0509.tar.gz`,
	3: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0301_e${DATA_YEAR}0331_c${DATA_YEAR}0604.tar.gz`,
	4: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0401_e${DATA_YEAR}0430_c${DATA_YEAR}0709.tar.gz`,
	5: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0501_e${DATA_YEAR}0531_c${DATA_YEAR}0709.tar.gz`,
	6: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0601_e${DATA_YEAR}0630_c${DATA_YEAR}0709.tar.gz`,
	7: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0701_e${DATA_YEAR}0731_c${DATA_YEAR}1009.tar.gz`,
	8: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0801_e${DATA_YEAR}0831_c${DATA_YEAR}1109.tar.gz`,
	9: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}0901_e${DATA_YEAR}0930_c${DATA_YEAR}1210.tar.gz`,
	10: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}1001_e${DATA_YEAR}1031_c20240105.tar.gz`,
	11: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}1101_e${DATA_YEAR}1130_c20240206.tar.gz`,
	12: `https://www.ncei.noaa.gov/data/nclimgrid-daily/archive/${DATA_YEAR}/nclimgrid-daily_v1-0-0_complete_s${DATA_YEAR}1201_e${DATA_YEAR}1231_c20240307.tar.gz`,
};

// Download and extract county CSV from archive
async function downloadMonthData(month, variable) {
	const url = archiveUrls[month];

	if (!url) {
		throw new Error(`No archive URL available for month ${month}`);
	}

	console.log(`Downloading: ${url}`);

	// Use cross-platform temp directory
	const tempDir = path.join(os.tmpdir(), `noaa-${month}-${Math.random().toString(36).substr(2, 9)}`);
	await fs.mkdir(tempDir, { recursive: true });
	const archivePath = path.join(tempDir, `month-${month}.tar.gz`);

	// Download archive
	const fileStream = createWriteStream(archivePath);

	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}: ${url}`));
					return;
				}

				res.pipe(fileStream);
				fileStream.on("finish", async () => {
					try {
						// Extract and find county CSV file
						const csvData = await extractCountyCsvFromArchive(archivePath, tempDir, month, variable);
						// Cleanup
						await fs.rm(tempDir, { recursive: true, force: true });
						resolve(csvData);
					} catch (error) {
						await fs.rm(tempDir, { recursive: true, force: true });
						reject(error);
					}
				});
				fileStream.on("error", reject);
			})
			.on("error", reject);
	});
}

// Extract county CSV data from downloaded archive
async function extractCountyCsvFromArchive(archivePath, tempDir, month, variable) {
	const monthStr = month.toString().padStart(2, "0");
	const expectedCsvName = `${variable}-${DATA_YEAR}${monthStr}-cty-scaled.csv`;

	try {
		// Await extraction of the specific CSV file we need
		await tar.extract({
			file: archivePath,
			cwd: tempDir,
			filter: (path) => path.endsWith(expectedCsvName),
		});

		// Read the extracted CSV file
		const csvPath = path.join(tempDir, expectedCsvName);
		const csvData = await fs.readFile(csvPath, "utf-8");
		console.log(`  Extracted ${expectedCsvName} (${csvData.length} characters)`);
		return csvData;
	} catch (error) {
		throw new Error(`Failed to extract ${expectedCsvName}: ${error.message}`);
	}
}

// Parse NOAA county CSV data (format: cty,FIPS,Name,Year,Month,Variable,Day1,...Day31)
function parseCSV(csvData) {
	const lines = csvData.trim().split("\n");
	const records = [];

	for (const line of lines) {
		const values = line.split(",");

		if (values.length < 6 || values[0] !== "cty") {
			continue; // Skip non-county records
		}

		const fips = values[1]; // FIPS code
		const name = values[2]; // County name
		const year = values[3];
		const month = values[4];
		const variable = values[5];

		// Extract daily temperature values (columns 6+), excluding missing values (-999.99)
		const dailyTemps = values
			.slice(6)
			.map((temp) => parseFloat(temp.trim()))
			.filter((temp) => !Number.isNaN(temp) && temp > -900); // Exclude NOAA missing value indicators

		// Calculate average temperature for the month
		if (dailyTemps.length > 0) {
			const avgTempCelsius = dailyTemps.reduce((sum, temp) => sum + temp, 0) / dailyTemps.length;
			// Convert Celsius to Fahrenheit
			const avgTempFahrenheit = (avgTempCelsius * 9) / 5 + 32;

			records.push({
				fips: fips,
				name: name,
				year: year,
				month: month,
				variable: variable,
				value: avgTempFahrenheit, // Monthly average temperature in Fahrenheit
				dataPoints: dailyTemps.length,
			});
		}
	}

	return records;
}

// Calculate annual average temperatures for all counties
async function getCountyAverages() {
	const countyData = new Map(); // Store daily temps for each county

	// Download data for each month of the year
	for (let month = 1; month <= 12; month++) {
		try {
			console.log(`\nProcessing month ${month}/12...`);
			const csvData = await downloadMonthData(month, "tavg");
			const records = parseCSV(csvData);

			console.log(`  Parsed ${records.length} records`);

			for (const record of records) {
				const fips = record.fips;
				const monthlyAvgTemp = record.value;
				const countyName = record.name;

				if (!fips || Number.isNaN(monthlyAvgTemp)) continue;

				if (!countyData.has(fips)) {
					countyData.set(fips, {
						fips: fips,
						name: countyName,
						state: countyName.split(":")[0] || "Unknown", // Extract state from name format "AL: County Name"
						monthlyTemps: [],
					});
				}

				countyData.get(fips).monthlyTemps.push(monthlyAvgTemp);
			}
		} catch (error) {
			console.error(`  Error downloading month ${month}:`, error.message);
		}
	}

	// Calculate annual averages from monthly averages
	const results = [];
	for (const [, data] of countyData) {
		const sum = data.monthlyTemps.reduce((a, b) => a + b, 0);
		const avg = sum / data.monthlyTemps.length;

		results.push({
			fips: data.fips,
			name: data.name,
			state: data.state,
			avgTemp: avg.toFixed(2),
			dataPoints: data.monthlyTemps.length, // Number of months with data
		});
	}

	// Sort by FIPS code
	results.sort((a, b) => a.fips.localeCompare(b.fips));

	return results;
}

// Main execution
(async () => {
	console.log(`Starting NOAA County Temperature Data Collection for ${DATA_YEAR}...\n`);

	try {
		const results = await getCountyAverages();

		console.log(`\n✓ Successfully collected data for ${results.size || results.length} counties`);

		// Save to JSON file
		await fs.writeFile(`data/base/temperatures_${DATA_YEAR}.json`, JSON.stringify(results, null, 2));
		console.log(`✓ Saved to: temperatures_${DATA_YEAR}.json`);

		// Save to CSV file
		const csvHeader = "FIPS,County Name,State,Avg Temperature (°F),Data Points\n";
		const csvRows = results.map((r) => `${r.fips},"${r.name}",${r.state},${r.avgTemp},${r.dataPoints}`).join("\n");
		await fs.writeFile(`data/base/temperatures_${DATA_YEAR}.csv`, csvHeader + csvRows);
		console.log(`✓ Saved to: temperatures_${DATA_YEAR}.csv`);

		// Show sample of results
		console.log("\nSample results (first 5 counties):");
		results.slice(0, 5).forEach((r) => {
			console.log(`  ${r.fips} - ${r.name}, ${r.state}: ${r.avgTemp}°F (${r.dataPoints} days)`);
		});
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
})();
