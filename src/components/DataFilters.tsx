import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useCounties } from "~/data/CountiesContext";
import { useFilterRanges } from "~/data/useFilterRanges";

const route = getRouteApi("/$layer");

// ─── Histogram ────────────────────────────────────────────────────

function computeBins(values: number[], quantiles: number[]): number[] {
	const counts = Array(quantiles.length + 1).fill(0) as number[];
	for (const v of values) {
		let bin = 0;
		for (const t of quantiles) {
			if (v > t) bin++;
		}
		counts[bin]++;
	}
	return counts;
}

function DistributionChart({
	values,
	quantiles,
	absMin,
	absMax,
	currentMin,
	currentMax,
	active,
}: {
	values: number[];
	quantiles: number[];
	absMin: number;
	absMax: number;
	currentMin: number;
	currentMax: number;
	active: boolean;
}) {
	const bins = computeBins(values, quantiles);
	const maxCount = Math.max(...bins, 1);
	const thresholds = [absMin, ...quantiles, absMax];

	return (
		<div className="mb-1 flex h-10 items-end gap-px">
			{bins.map((count, i) => {
				const binMin = thresholds[i] ?? 0;
				const binMax = thresholds[i + 1] ?? 0;
				const binCenter = (binMin + binMax) / 2;
				const inRange = binCenter >= currentMin && binCenter <= currentMax;
				const heightPct = (count / maxCount) * 100;
				return (
					<div
						key={binMin}
						className="flex flex-1 items-end"
						style={{ height: "100%" }}
					>
						<div
							className={`w-full rounded-t-sm transition-colors ${
								active && inRange ? "bg-indigo-400" : "bg-gray-200"
							}`}
							style={{ height: `${heightPct}%` }}
						/>
					</div>
				);
			})}
		</div>
	);
}

// ─── Range Slider ──────────────────────────────────────────────────

const THUMB_CLASSES =
	"pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-500 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed";

const SELECTION_THUMB_CLASSES =
	"pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-900 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-indigo-900 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed";

function RangeSlider({
	absMin,
	absMax,
	step,
	currentMin,
	currentMax,
	selection,
	onMinChange,
	onMaxChange,
	onSelectionChange,
	disabled,
	formatValue,
}: {
	absMin: number;
	absMax: number;
	step: number;
	currentMin: number;
	currentMax: number;
	selection: number;
	onMinChange: (v: number) => void;
	onMaxChange: (v: number) => void;
	onSelectionChange: (v: number) => void;
	disabled: boolean;
	formatValue: (v: number) => string;
}) {
	const range = absMax - absMin || 1;
	const minPct = ((currentMin - absMin) / range) * 100;
	const maxPct = ((currentMax - absMin) / range) * 100;
	const selPct = ((selection - absMin) / range) * 100;

	return (
		<div>
			{/* Value labels above thumbs */}
			<div className="relative mb-1 h-5">
				<span
					className="-translate-x-1/2 absolute whitespace-nowrap font-mono text-[10px] text-indigo-500"
					style={{ left: `${minPct}%` }}
				>
					Min: {formatValue(currentMin)}
				</span>
				<span
					className="-translate-x-1/2 absolute whitespace-nowrap font-mono text-[10px] text-indigo-500"
					style={{ left: `${maxPct}%` }}
				>
					Max: {formatValue(currentMax)}
				</span>
				<span
					className="-translate-x-1/2 absolute top-0 whitespace-nowrap font-mono font-semibold text-[10px] text-indigo-900"
					style={{ left: `${selPct}%` }}
				>
					↓ {formatValue(selection)}
				</span>
			</div>

			{/* Track + three thumbs */}
			<div className="relative flex h-8 items-center">
				{/* Background track */}
				<div className="absolute h-2 w-full rounded-lg bg-gray-200" />
				{/* Active fill between min and max */}
				<div
					className="absolute h-2 rounded-lg bg-indigo-200"
					style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
				/>
				{/* Min thumb */}
				<input
					type="range"
					step={step}
					min={absMin}
					max={absMax}
					value={currentMin}
					onChange={(e) => {
						const v = Number(e.target.value);
						if (v <= currentMax) onMinChange(v);
					}}
					disabled={disabled}
					className={`${THUMB_CLASSES} z-20`}
				/>
				{/* Max thumb */}
				<input
					type="range"
					step={step}
					min={absMin}
					max={absMax}
					value={currentMax}
					onChange={(e) => {
						const v = Number(e.target.value);
						if (v >= currentMin) onMaxChange(v);
					}}
					disabled={disabled}
					className={`${THUMB_CLASSES} z-10`}
				/>
				{/* Selection thumb — clamped to [currentMin, currentMax] */}
				<input
					type="range"
					step={step}
					min={absMin}
					max={absMax}
					value={selection}
					onChange={(e) => {
						const v = Number(e.target.value);
						onSelectionChange(Math.min(currentMax, Math.max(currentMin, v)));
					}}
					disabled={disabled}
					className={`${SELECTION_THUMB_CLASSES} z-30`}
				/>
			</div>

			{/* Endpoint labels */}
			<div className="mt-0.5 flex justify-between">
				<span className="font-mono text-[9px] text-gray-400">
					{formatValue(absMin)}
				</span>
				<span className="font-mono text-[9px] text-gray-400">
					{formatValue(absMax)}
				</span>
			</div>
		</div>
	);
}

// ─── Info Popover ──────────────────────────────────────────────────

function InfoPopover({ content }: { content: string }) {
	return (
		<Popover className="relative">
			<PopoverButton
				className="text-gray-400 hover:text-gray-600 focus:outline-none"
				aria-label="More information about this data"
			>
				<InformationCircleIcon className="h-4 w-4" />
			</PopoverButton>
			<PopoverPanel className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 text-gray-600 text-xs shadow-lg">
				{content}
			</PopoverPanel>
		</Popover>
	);
}

// ─── Toggle ────────────────────────────────────────────────────────

function Toggle({
	enabled,
	onToggle,
	ariaLabel,
}: {
	enabled: boolean;
	onToggle: () => void;
	ariaLabel?: string;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			role="switch"
			aria-checked={enabled}
			aria-label={ariaLabel}
			className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
				enabled ? "bg-indigo-600" : "bg-gray-300"
			}`}
		>
			<span
				className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
					enabled ? "translate-x-5" : "translate-x-1"
				}`}
			/>
		</button>
	);
}

// ─── Shared Filter Card ────────────────────────────────────────────

type FilterCardProps = {
	label: string;
	enabled: boolean;
	onToggle: () => void;
	values: number[];
	quantiles: number[];
	absMin: number;
	absMax: number;
	currentMin: number;
	currentMax: number;
	selection: number;
	step: number;
	onRangeChange: (min: number, max: number, selection: number) => void;
	importance: number;
	onImportanceChange: (v: number) => void;
	formatValue: (v: number) => string;
	infoContent: string;
};

function FilterCard({
	label,
	enabled,
	onToggle,
	values,
	quantiles,
	absMin,
	absMax,
	currentMin,
	currentMax,
	selection,
	step,
	onRangeChange,
	importance,
	onImportanceChange,
	formatValue,
	infoContent,
}: FilterCardProps) {
	const [localMin, setLocalMin] = useState(currentMin);
	const [localMax, setLocalMax] = useState(currentMax);
	const [localSelection, setLocalSelection] = useState(selection);
	const latestRef = useRef({ min: currentMin, max: currentMax, selection });

	// Sync when upstream changes (e.g., preset applied externally)
	useEffect(() => {
		setLocalMin(currentMin);
		latestRef.current.min = currentMin;
	}, [currentMin]);
	useEffect(() => {
		setLocalMax(currentMax);
		latestRef.current.max = currentMax;
	}, [currentMax]);
	useEffect(() => {
		setLocalSelection(selection);
		latestRef.current.selection = selection;
	}, [selection]);

	const debouncedRangeChange = useDebouncedCallback(() => {
		onRangeChange(
			latestRef.current.min,
			latestRef.current.max,
			latestRef.current.selection,
		);
	}, 250);

	const handleMinChange = (v: number) => {
		setLocalMin(v);
		latestRef.current.min = v;
		if (latestRef.current.selection < v) {
			setLocalSelection(v);
			latestRef.current.selection = v;
		}
		debouncedRangeChange();
	};

	const handleMaxChange = (v: number) => {
		setLocalMax(v);
		latestRef.current.max = v;
		if (latestRef.current.selection > v) {
			setLocalSelection(v);
			latestRef.current.selection = v;
		}
		debouncedRangeChange();
	};

	const handleSelectionChange = (v: number) => {
		setLocalSelection(v);
		latestRef.current.selection = v;
		debouncedRangeChange();
	};

	return (
		<div
			className={`rounded-lg border p-3 transition-all ${
				enabled
					? "border-indigo-400 bg-indigo-50/50"
					: "border-gray-300 bg-gray-50"
			}`}
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-1">
					<span className="font-semibold text-gray-900 text-sm">{label}</span>
					<InfoPopover content={infoContent} />
				</div>
				<Toggle enabled={enabled} onToggle={onToggle} />
			</div>

			<DistributionChart
				values={values}
				quantiles={quantiles}
				absMin={absMin}
				absMax={absMax}
				currentMin={localMin}
				currentMax={localMax}
				active={enabled}
			/>

			<RangeSlider
				absMin={absMin}
				absMax={absMax}
				step={step}
				currentMin={localMin}
				currentMax={localMax}
				selection={localSelection}
				onMinChange={handleMinChange}
				onMaxChange={handleMaxChange}
				onSelectionChange={handleSelectionChange}
				disabled={!enabled}
				formatValue={formatValue}
			/>

			<div className="mt-3">
				<span className="mb-1 block text-gray-600 text-xs">Importance</span>
				<div className="flex items-center gap-2">
					<input
						type="range"
						min={1}
						max={5}
						step={1}
						value={importance}
						onChange={(e) => onImportanceChange(Number(e.target.value))}
						disabled={!enabled}
						className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
					/>
					<span className="w-8 font-semibold text-gray-700 text-xs">
						{importance}/5
					</span>
				</div>
			</div>
		</div>
	);
}

// ─── Main DataFilters ──────────────────────────────────────────────

export const DataFilters = () => {
	const {
		population,
		age,
		temperature,
		home_value,
		median_rent,
		politics,
		population_importance,
		age_importance,
		temperature_importance,
		home_value_importance,
		median_rent_importance,
		politics_importance,
	} = route.useSearch();

	const search = route.useSearch();
	const { layer } = route.useParams();

	const {
		counties,
		stdev: {
			population_min,
			population_max,
			population_quantiles,
			median_age_min,
			median_age_max,
			median_age_quantiles,
			temperature_min,
			temperature_max,
			temperature_quantiles,
			homeValue_min,
			homeValue_max,
			homeValue_quantiles,
			medianRent_min,
			medianRent_max,
			medianRent_quantiles,
			politics_min,
			politics_max,
			politics_quantiles,
		},
	} = useCounties();

	const {
		population_val,
		age_val,
		temperature_val,
		home_value_val,
		median_rent_val,
		politics_val,
		population_pref,
		age_pref,
		temperature_pref,
		home_value_pref,
		median_rent_pref,
		politics_pref,
	} = useFilterRanges();

	const navigate = useNavigate();

	const set = (patch: Record<string, unknown>) =>
		navigate({
			from: "/$layer",
			search: { ...search, ...patch } as typeof search,
		});

	const setRange = (patch: Record<string, unknown>) =>
		navigate({
			from: "/$layer",
			search: { ...search, ...patch } as typeof search,
			replace: true,
		});

	// Raw county value arrays for histograms
	const populationValues = counties.map((c) => c.population);
	const ageValues = counties.map((c) => c.medianAge);
	const tempValues = counties.map((c) => c.temperature.avgTempF);
	const homeValueValues = counties.map((c) => c.housing.medianHomeValue);
	const rentValues = counties.map((c) => c.rent.medianRent);
	const politicsValues = counties.map((c) => c.votes.percentages.republican);

	// Integer-safe absolute boundaries
	const popMin = Math.floor(population_min);
	const popMax = Math.ceil(population_max);
	const ageMin = Math.floor(median_age_min);
	const ageMax = Math.ceil(median_age_max);
	const tempMin = Math.floor(temperature_min);
	const tempMax = Math.ceil(temperature_max);
	const hvMin = Math.floor(homeValue_min);
	const hvMax = Math.ceil(homeValue_max);
	const rentMin = Math.floor(medianRent_min);
	const rentMax = Math.ceil(medianRent_max);
	const polMin = Math.floor(politics_min * 10) / 10;
	const polMax = Math.ceil(politics_max * 10) / 10;

	return (
		<section className="relative">
			{layer !== "combined" && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
					<p className="text-center font-medium text-gray-600 text-sm">
						Switch to <strong>Combined</strong> view
						<br />
						to use filters
					</p>
				</div>
			)}
			<div className="space-y-2">
				{/* Population */}
				<FilterCard
					label="Population"
					enabled={population}
					onToggle={() => set({ population: !population })}
					values={populationValues}
					quantiles={population_quantiles}
					absMin={popMin}
					absMax={popMax}
					currentMin={Math.round(population_val[0])}
					currentMax={Math.round(population_val[1])}
					step={Math.max(1, Math.round((popMax - popMin) / 100))}
					selection={Math.round(population_pref)}
					onRangeChange={(min, max, sel) =>
						setRange({
							population_min: min,
							population_max: max,
							population_pref: sel,
						})
					}
					importance={population_importance}
					onImportanceChange={(v) => set({ population_importance: v })}
					formatValue={(v) => v.toLocaleString()}
					infoContent="Source: U.S. Census Bureau ACS 5-Year Estimates. Total resident population per county."
				/>

				{/* Median Age */}
				<FilterCard
					label="Median Age"
					enabled={age}
					onToggle={() => set({ age: !age })}
					values={ageValues}
					quantiles={median_age_quantiles}
					absMin={ageMin}
					absMax={ageMax}
					currentMin={Math.round(age_val[0])}
					currentMax={Math.round(age_val[1])}
					step={1}
					selection={Math.round(age_pref)}
					onRangeChange={(min, max, sel) =>
						setRange({ age_min: min, age_max: max, age_pref: sel })
					}
					importance={age_importance}
					onImportanceChange={(v) => set({ age_importance: v })}
					formatValue={(v) => `${v}yr`}
					infoContent="Source: U.S. Census Bureau ACS 5-Year Estimates. Median age of all county residents."
				/>

				{/* Avg. Temperature */}
				<FilterCard
					label="Avg. Temperature"
					enabled={temperature}
					onToggle={() => set({ temperature: !temperature })}
					values={tempValues}
					quantiles={temperature_quantiles}
					absMin={tempMin}
					absMax={tempMax}
					currentMin={Math.round(temperature_val[0])}
					currentMax={Math.round(temperature_val[1])}
					step={1}
					selection={Math.round(temperature_pref)}
					onRangeChange={(min, max, sel) =>
						setRange({
							temperature_min: min,
							temperature_max: max,
							temperature_pref: sel,
						})
					}
					importance={temperature_importance}
					onImportanceChange={(v) => set({ temperature_importance: v })}
					formatValue={(v) => `${v}°F`}
					infoContent="Source: NOAA NCEI climate normals. Average annual temperature in °F. Some rural counties use interpolated estimates."
				/>

				{/* Home Value */}
				<FilterCard
					label="Home Value"
					enabled={home_value}
					onToggle={() => set({ home_value: !home_value })}
					values={homeValueValues}
					quantiles={homeValue_quantiles}
					absMin={hvMin}
					absMax={hvMax}
					currentMin={Math.round(home_value_val[0])}
					currentMax={Math.round(home_value_val[1])}
					step={Math.max(1, Math.round((hvMax - hvMin) / 100))}
					selection={Math.round(home_value_pref)}
					onRangeChange={(min, max, sel) =>
						setRange({
							home_value_min: min,
							home_value_max: max,
							home_value_pref: sel,
						})
					}
					importance={home_value_importance}
					onImportanceChange={(v) => set({ home_value_importance: v })}
					formatValue={(v) => `$${v.toLocaleString()}`}
					infoContent="Source: U.S. Census Bureau ACS 5-Year Estimates. Median value of owner-occupied housing units. Some counties use estimated data."
				/>

				{/* Median Rent */}
				<FilterCard
					label="Median Rent"
					enabled={median_rent}
					onToggle={() => set({ median_rent: !median_rent })}
					values={rentValues}
					quantiles={medianRent_quantiles}
					absMin={rentMin}
					absMax={rentMax}
					currentMin={Math.round(median_rent_val[0])}
					currentMax={Math.round(median_rent_val[1])}
					step={Math.max(1, Math.round((rentMax - rentMin) / 100))}
					selection={Math.round(median_rent_pref)}
					onRangeChange={(min, max, sel) =>
						setRange({ rent_min: min, rent_max: max, rent_pref: sel })
					}
					importance={median_rent_importance}
					onImportanceChange={(v) => set({ median_rent_importance: v })}
					formatValue={(v) => `$${v.toLocaleString()}`}
					infoContent="Source: U.S. Census Bureau ACS and HUD Fair Market Rents. Median gross rent for renter-occupied units. Some counties use estimated data."
				/>

				{/* Politics */}
				<FilterCard
					label="Political Lean"
					enabled={politics}
					onToggle={() => set({ politics: !politics })}
					values={politicsValues}
					quantiles={politics_quantiles}
					absMin={polMin}
					absMax={polMax}
					currentMin={Math.round(politics_val[0] * 10) / 10}
					currentMax={Math.round(politics_val[1] * 10) / 10}
					step={0.1}
					selection={Math.round(politics_pref * 10) / 10}
					onRangeChange={(min, max, sel) =>
						setRange({
							politics_min: min,
							politics_max: max,
							politics_pref: sel,
						})
					}
					importance={politics_importance}
					onImportanceChange={(v) => set({ politics_importance: v })}
					formatValue={(v) => `${v.toFixed(1)}% R`}
					infoContent="Source: MIT Election Data and Science Lab. Republican vote share (%) in the most recent presidential election."
				/>
			</div>
		</section>
	);
};
