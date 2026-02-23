import { promises as fs } from "node:fs";
import https from "node:https";

const DATA_URL =
	"https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";

async function downloadElectionData() {
	console.log("Downloading 2024 county-level election data...");

	return new Promise((resolve, reject) => {
		https
			.get(DATA_URL, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}: ${DATA_URL}`));
					return;
				}

				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					console.log(`Downloaded ${data.length} characters of election data`);
					resolve(data);
				});
			})
			.on("error", reject);
	});
}

function parseElectionCSV(csvData) {
	const lines = csvData.trim().split("\n");
	const header = lines[0].split(",");
	const records = [];

	console.log(`Parsing ${lines.length - 1} election records...`);
	console.log("CSV Headers:", header);

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(",");

		if (values.length < header.length) {
			continue;
		}

		const record = {};
		header.forEach((key, index) => {
			record[key.trim()] = values[index]?.trim() || "";
		});

		// Calculate percentages if we have vote counts
		const totalVotes = parseInt(record.total_votes || record.votes_total || "0", 10);
		const demoVotes = parseInt(record.votes_dem || record.dem_votes || "0", 10);
		const repVotes = parseInt(record.votes_gop || record.gop_votes || record.rep_votes || "0", 10);

		if (totalVotes > 0) {
			record.dem_percentage = ((demoVotes / totalVotes) * 100).toFixed(2);
			record.rep_percentage = ((repVotes / totalVotes) * 100).toFixed(2);
		}

		records.push(record);
	}

	return records;
}

function processElectionData(records) {
	console.log(`Processing ${records.length} election records...`);

	const processedData = records
		.map((record) => {
			// Extract key fields and standardize naming
			const fips = record.county_fips || record.FIPS || record.fips || "";
			const countyName = record.county_name || record.county || record.County || "";
			const state = record.state_name || record.state_po || record.state || record.State || "";

			// Get vote counts
			const totalVotes = parseInt(record.total_votes || record.votes_total || "0", 10);
			const demoVotes = parseInt(record.votes_dem || record.dem_votes || "0", 10);
			const repVotes = parseInt(record.votes_gop || record.gop_votes || record.rep_votes || "0", 10);

			// Calculate percentages
			const demPercentage = totalVotes > 0 ? parseFloat(((demoVotes / totalVotes) * 100).toFixed(2)) : 0;
			const repPercentage = totalVotes > 0 ? parseFloat(((repVotes / totalVotes) * 100).toFixed(2)) : 0;

			return {
				fips: fips,
				county: countyName,
				state: state,
				totalVotes: totalVotes,
				democratVotes: demoVotes,
				republicanVotes: repVotes,
				democratPercentage: demPercentage,
				republicanPercentage: repPercentage,
				winner: repPercentage > demPercentage ? "Republican" : "Democrat",
			};
		})
		.filter((record) => record.fips && record.totalVotes > 0);

	// Sort by FIPS code
	processedData.sort((a, b) => a.fips.localeCompare(b.fips));

	return processedData;
}

async function main() {
	console.log("Starting 2024 County Election Data Collection...\n");

	try {
		// Download raw election data
		const csvData = await downloadElectionData();

		// Parse CSV data
		const records = parseElectionCSV(csvData);

		// Process and standardize the data
		const electionData = processElectionData(records);

		console.log(`\n✓ Successfully processed data for ${electionData.length} counties`);

		// Save to JSON file
		await fs.writeFile("data/base/elections_2024.json", JSON.stringify(electionData, null, 2));
		console.log("✓ Saved to: data/base/elections_2024.json");

		// Save to CSV file
		const csvHeader =
			"FIPS,County,State,Total Votes,Democrat Votes,Republican Votes,Democrat %,Republican %,Winner\n";
		const csvRows = electionData
			.map(
				(r) =>
					`${r.fips},"${r.county}",${r.state},${r.totalVotes},${r.democratVotes},${r.republicanVotes},${r.democratPercentage},${r.republicanPercentage},${r.winner}`,
			)
			.join("\n");
		await fs.writeFile("data/base/elections_2024.csv", csvHeader + csvRows);
		console.log("✓ Saved to: data/base/elections_2024.csv");

		// Show sample results
		console.log("\nSample results (first 5 counties):");
		electionData.slice(0, 5).forEach((r) => {
			console.log(
				`  ${r.fips} - ${r.county}, ${r.state}: ${r.democratPercentage}% Dem, ${r.republicanPercentage}% Rep (${r.winner})`,
			);
		});

		// Show summary statistics
		const totalCounties = electionData.length;
		const republicanWins = electionData.filter((r) => r.winner === "Republican").length;
		const democratWins = electionData.filter((r) => r.winner === "Democrat").length;

		console.log("\nSummary:");
		console.log(`  Total Counties: ${totalCounties}`);
		console.log(`  Republican Counties: ${republicanWins} (${((republicanWins / totalCounties) * 100).toFixed(1)}%)`);
		console.log(`  Democrat Counties: ${democratWins} (${((democratWins / totalCounties) * 100).toFixed(1)}%)`);
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

main();
