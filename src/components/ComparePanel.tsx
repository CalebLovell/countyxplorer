import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";
import { getCostOfLiving } from "~/data/functions";

const route = getRouteApi("/$layer");

export const ComparePanel = () => {
	const search = route.useSearch();
	const navigate = useNavigate();
	const { counties, stdev } = useCounties();

	const compareStr = (search as Record<string, unknown>).compare as
		| string
		| undefined;
	const compareIds = compareStr
		? compareStr.split(",").filter(Boolean)
		: [];

	const compared = compareIds
		.map((id) => counties.find((c) => c.id === id))
		.filter((c): c is NonNullable<typeof c> => c != null);

	if (compared.length === 0) return null;

	const removeCounty = (id: string) => {
		const next = compareIds.filter((x) => x !== id);
		navigate({
			from: "/$layer",
			search: {
				...search,
				compare: next.length > 0 ? next.join(",") : undefined,
			} as typeof search,
		});
	};

	const clearAll = () => {
		navigate({
			from: "/$layer",
			search: { ...search, compare: undefined } as typeof search,
		});
	};

	return (
		<section className="w-full">
			<div className="rounded-lg border border-sky-300 bg-sky-50/60 p-3">
				<div className="mb-2 flex items-center justify-between">
					<h3 className="font-semibold text-gray-900 text-sm">
						🆚 Compare ({compared.length})
					</h3>
					<button
						type="button"
						onClick={clearAll}
						className="text-sky-600 text-xs hover:text-sky-800"
					>
						Clear all
					</button>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b text-left text-gray-500">
								<th scope="col" className="pb-1 pr-2 font-medium">Metric</th>
								{compared.map((c) => (
									<th
										key={c.id}
										className="pb-1 pr-1 font-medium"
									>
										<div className="flex items-center gap-1">
											<span className="truncate" style={{ maxWidth: "60px" }}>
												{c.name}
											</span>
											<button
												type="button"
												onClick={() => removeCounty(c.id)}
												className="shrink-0 text-gray-400 hover:text-red-500"
												aria-label={`Remove ${c.name}`}
											>
												×
											</button>
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							<CompareRow
								label="Population"
								values={compared.map((c) =>
									c.population.toLocaleString(),
								)}
							/>
							<CompareRow
								label="Med. Age"
								values={compared.map((c) => `${c.medianAge}`)}
							/>
							<CompareRow
								label="Temp"
								values={compared.map(
									(c) => `${c.temperature.avgTempF}°F`,
								)}
							/>
							<CompareRow
								label="Home $"
								values={compared.map(
									(c) =>
										`$${c.housing.medianHomeValue.toLocaleString()}`,
								)}
							/>
							<CompareRow
								label="Rent"
								values={compared.map(
									(c) =>
										`$${c.rent.medianRent.toLocaleString()}`,
								)}
							/>
							<CompareRow
								label="CoL"
								values={compared.map(
									(c) => `${getCostOfLiving(c, stdev)}/100`,
								)}
							/>
							<CompareRow
								label="Leans"
								values={compared.map((c) =>
									c.votes.winner === "democrat" ? "🔵 Dem" : "🔴 Rep",
								)}
							/>
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
};

const CompareRow = ({
	label,
	values,
}: {
	label: string;
	values: string[];
}) => (
	<tr>
		<td className="py-1 pr-2 font-medium text-gray-600">{label}</td>
		{values.map((v) => (
			<td key={`${label}-${v}`} className="py-1 pr-1 text-gray-900">
				{v}
			</td>
		))}
	</tr>
);
