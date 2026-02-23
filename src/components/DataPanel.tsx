import { getRouteApi } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";

const route = getRouteApi("/$layer");

export const DataPanel = () => {
	const { county: selectedCountyId } = route.useSearch();
	const { counties } = useCounties();
	const selectedCounty =
		selectedCountyId != null
			? (counties.find((c) => Number(c.id) === selectedCountyId) ?? null)
			: null;

	const details = [
		{
			title: "Population",
			value: selectedCounty?.population?.toLocaleString() ?? null,
		},
		{ title: "Median Age", value: selectedCounty?.medianAge ?? null },
		{
			title: "Avg. Temperature",
			value: selectedCounty?.temperature.avgTempF
				? `${selectedCounty.temperature.avgTempF} °F`
				: null,
		},
		{
			title: "Median Home Value",
			value: selectedCounty?.housing.medianHomeValue
				? `$${selectedCounty.housing.medianHomeValue.toLocaleString()}`
				: null,
		},
		{
			title: "Median Rent",
			value: selectedCounty?.rent.medianRent
				? `$${selectedCounty.rent.medianRent.toLocaleString()}`
				: null,
		},
	];

	if (!selectedCounty) return null;
	return (
		<section className="w-full">
			<div className="rounded-lg border border-indigo-400 bg-indigo-50/50 p-3">
				<div className="mb-3">
					<h3 className="font-semibold text-gray-900 text-sm">
						{selectedCounty.name}
					</h3>
					<p className="text-gray-600 text-xs">{selectedCounty.state}</p>
				</div>

				<div className="space-y-2">
					{details.map(({ title, value }) => (
						<Detail key={title} title={title} value={value} />
					))}
				</div>
			</div>
		</section>
	);
};

const Detail = ({
	title,
	value,
}: {
	title: string;
	value: string | number | null | undefined;
}) => {
	if (!value) return null;
	return (
		<div className="flex items-center justify-between text-xs">
			<span className="text-gray-600">{title}</span>
			<span className="font-semibold text-gray-900">{value}</span>
		</div>
	);
};
