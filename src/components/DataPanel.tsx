import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";
import { getCostOfLiving } from "~/data/functions";

const route = getRouteApi("/$layer");

export const DataPanel = () => {
	const search = route.useSearch();
	const { county: selectedCountyId } = search;
	const { counties, stdev } = useCounties();
	const navigate = useNavigate();
	const selectedCounty =
		selectedCountyId != null
			? (counties.find((c) => Number(c.id) === selectedCountyId) ?? null)
			: null;

	if (!selectedCounty) return null;

	const compareStr = (search as Record<string, unknown>).compare as
		| string
		| undefined;
	const compareIds = compareStr ? compareStr.split(",").filter(Boolean) : [];
	const isPinned = compareIds.includes(selectedCounty.id);

	const togglePin = () => {
		let next: string[];
		if (isPinned) {
			next = compareIds.filter((x) => x !== selectedCounty.id);
		} else {
			next = [...compareIds, selectedCounty.id].slice(0, 4);
		}
		navigate({
			from: "/$layer",
			search: {
				...search,
				compare: next.length > 0 ? next.join(",") : undefined,
			} as typeof search,
		});
	};

	const col = getCostOfLiving(selectedCounty, stdev);
	const colLabel =
		col <= 20
			? "Very Low"
			: col <= 40
				? "Low"
				: col <= 60
					? "Moderate"
					: col <= 80
						? "High"
						: "Very High";

	const winner = selectedCounty.votes.winner;
	const demPct = selectedCounty.votes.percentages.democrat.toFixed(1);
	const repPct = selectedCounty.votes.percentages.republican.toFixed(1);

	return (
		<section className="w-full">
			<div className="rounded-lg border border-indigo-400 bg-indigo-50/50 p-3">
				<div className="mb-3 flex items-start justify-between">
					<div>
						<h3 className="font-semibold text-gray-900 text-sm">
							{selectedCounty.name}
						</h3>
						<p className="text-gray-600 text-xs">{selectedCounty.state}</p>
					</div>
					<button
						type="button"
						onClick={togglePin}
						className={`shrink-0 rounded px-2 py-1 text-xs transition-colors ${
							isPinned
								? "bg-sky-200 text-sky-800 hover:bg-sky-300"
								: "bg-gray-200 text-gray-600 hover:bg-sky-100 hover:text-sky-700"
						}`}
						title={isPinned ? "Unpin from compare" : "Pin to compare (max 4)"}
					>
						{isPinned ? "📌 Pinned" : "📌 Pin"}
					</button>
				</div>

				<div className="space-y-1.5">
					<Detail
						title="Population"
						value={selectedCounty.population?.toLocaleString()}
					/>
					<Detail
						title="Median Age"
						value={`${selectedCounty.medianAge} yrs`}
					/>
					<Detail
						title="Avg. Temperature"
						value={`${selectedCounty.temperature.avgTempF} °F`}
						estimated={selectedCounty.temperature.isEstimated}
					/>
					<Detail
						title="Median Home Value"
						value={`$${selectedCounty.housing.medianHomeValue.toLocaleString()}`}
						estimated={selectedCounty.housing.isEstimated}
					/>
					<Detail
						title="vs. National Median"
						value={
							selectedCounty.housing.percentNationalMedian != null
								? `${selectedCounty.housing.percentNationalMedian.toFixed(0)}%`
								: undefined
						}
					/>
					<Detail
						title="Median Rent"
						value={`$${selectedCounty.rent.medianRent.toLocaleString()}`}
						estimated={selectedCounty.rent.isEstimated}
					/>

					{/* Rent breakdown */}
					<div className="border-gray-200 border-t pt-1.5">
						<span className="mb-1 block font-medium text-gray-600 text-xs">
							Rent by Size
						</span>
						<div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
							<MiniDetail
								label="Studio"
								value={`$${selectedCounty.rent.sizes.efficiency.toLocaleString()}`}
							/>
							<MiniDetail
								label="1 BR"
								value={`$${selectedCounty.rent.sizes.oneBR.toLocaleString()}`}
							/>
							<MiniDetail
								label="2 BR"
								value={`$${selectedCounty.rent.sizes.twoBR.toLocaleString()}`}
							/>
							<MiniDetail
								label="3 BR"
								value={`$${selectedCounty.rent.sizes.threeBR.toLocaleString()}`}
							/>
							<MiniDetail
								label="4 BR"
								value={`$${selectedCounty.rent.sizes.fourBR.toLocaleString()}`}
							/>
						</div>
					</div>

					{/* Politics */}
					<div className="border-gray-200 border-t pt-1.5">
						<span className="mb-1 block font-medium text-gray-600 text-xs">
							Political Leaning
						</span>
						<div className="mb-1 flex h-2 overflow-hidden rounded-full">
							<div
								className="bg-blue-500 transition-all"
								style={{
									width: `${selectedCounty.votes.percentages.democrat}%`,
								}}
							/>
							<div
								className="bg-red-500 transition-all"
								style={{
									width: `${selectedCounty.votes.percentages.republican}%`,
								}}
							/>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-blue-700">D {demPct}%</span>
							<span
								className={`font-medium ${winner === "democrat" ? "text-blue-700" : "text-red-700"}`}
							>
								{winner === "democrat" ? "🔵" : "🔴"}{" "}
								{winner === "democrat" ? "Dem" : "Rep"}
							</span>
							<span className="text-red-700">R {repPct}%</span>
						</div>
						{selectedCounty.votes.isEstimated && (
							<span className="text-amber-600" style={{ fontSize: "10px" }}>
								📍 Estimated
							</span>
						)}
					</div>

					{/* Cost of Living */}
					<div className="border-gray-200 border-t pt-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-gray-600">Cost of Living</span>
							<span className="font-semibold text-gray-900">
								{col}/100 ({colLabel})
							</span>
						</div>
						<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
							<div
								className={`h-full rounded-full transition-all ${
									col <= 40
										? "bg-emerald-500"
										: col <= 70
											? "bg-amber-500"
											: "bg-red-500"
								}`}
								style={{ width: `${col}%` }}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

const Detail = ({
	title,
	value,
	estimated,
}: {
	title: string;
	value: string | number | null | undefined;
	estimated?: boolean;
}) => {
	if (!value) return null;
	return (
		<div className="flex items-center justify-between text-xs">
			<span className="text-gray-600">{title}</span>
			<span className="font-semibold text-gray-900">
				{value}
				{estimated && (
					<span
						className="ml-1 text-amber-500"
						title="Estimated value"
						style={{ fontSize: "10px" }}
					>
						~
					</span>
				)}
			</span>
		</div>
	);
};

const MiniDetail = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-center justify-between" style={{ fontSize: "10px" }}>
		<span className="text-gray-500">{label}</span>
		<span className="font-medium text-gray-700">{value}</span>
	</div>
);
