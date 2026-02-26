import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCounties } from "~/data/CountiesContext";
import { useFilterRanges } from "~/data/useFilterRanges";

const POP_BUCKETS = [0, 10000, 50000, 250000, 1000000, 10000000];
const POP_LABELS = ["0", "10k", "50k", "250k", "1M", "Max"];

const getBucketIndex = (val: number) => {
	let closestIndex = 0;
	let minDiff = Number.POSITIVE_INFINITY;
	for (let i = 0; i < POP_BUCKETS.length; i++) {
		const diff = Math.abs(val - POP_BUCKETS[i]);
		if (diff < minDiff) {
			minDiff = diff;
			closestIndex = i;
		}
	}
	return closestIndex;
};

const route = getRouteApi("/$layer");

const useLocalState = <T,>(urlValue: T, commitChange: (val: T) => void) => {
	const [local, setLocal] = useState<T>(urlValue);

	// biome-ignore lint/correctness/useExhaustiveDependencies: React Router pushes
	useEffect(() => {
		setLocal(urlValue);
	}, [JSON.stringify(urlValue)]);

	const commit = () => {
		if (JSON.stringify(local) !== JSON.stringify(urlValue)) {
			commitChange(local);
		}
	};

	return { local, setLocal, commit };
};

const DualRangeInput = ({ min, max, step, disabled, state }: any) => (
	<div className="relative flex h-6 w-full items-center">
		<input
			type="range"
			step={step}
			min={min}
			max={max}
			value={state.local[0]}
			onChange={(e) => {
				const v = Number(e.target.value);
				if (v <= state.local[1]) state.setLocal([v, state.local[1]]);
			}}
			onMouseUp={state.commit}
			onTouchEnd={state.commit}
			disabled={disabled}
			className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
			style={{ zIndex: 2 }}
		/>
		<input
			type="range"
			step={step}
			min={min}
			max={max}
			value={state.local[1]}
			onChange={(e) => {
				const v = Number(e.target.value);
				if (v >= state.local[0]) state.setLocal([state.local[0], v]);
			}}
			onMouseUp={state.commit}
			onTouchEnd={state.commit}
			disabled={disabled}
			className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
			style={{ zIndex: 1 }}
		/>
	</div>
);

const ImportanceInput = ({ disabled, state }: any) => (
	<div className="flex items-center gap-2">
		<input
			type="range"
			min={1}
			max={5}
			value={state.local}
			onChange={(e) => state.setLocal(Number(e.target.value))}
			onMouseUp={state.commit}
			onTouchEnd={state.commit}
			disabled={disabled}
			className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<span className="w-8 text-right font-semibold text-gray-700 text-xs text-right min-w-[32px]">
			{state.local}/5
		</span>
	</div>
);

export const DataFilters = () => {
	const search = route.useSearch();
	const { layer } = route.useParams();
	const {
		population, age, temperature, home_value, median_rent,
		population_importance, age_importance, temperature_importance,
		home_value_importance, median_rent_importance,
	} = search;

	const {
		stdev: {
			median_age_min, median_age_max,
			temperature_min, temperature_max,
			homeValue_min, homeValue_max,
			medianRent_min, medianRent_max,
		},
	} = useCounties();

	const {
		population_val, age_val, temperature_val,
		home_value_val, median_rent_val,
	} = useFilterRanges();

	const navigate = useNavigate();

	const set = (patch: Record<string, unknown>) =>
		navigate({ from: "/$layer", search: { ...search, ...patch } as typeof search });

	const setRange = (patch: Record<string, unknown>) =>
		navigate({ from: "/$layer", search: { ...search, ...patch } as typeof search, replace: true });

	// LOCAL STATES FOR SMOOTH DRAGGING
	const popState = useLocalState([getBucketIndex(population_val[0]), getBucketIndex(population_val[1])], (val) => setRange({ population_min: POP_BUCKETS[val[0]], population_max: POP_BUCKETS[val[1]] }));
	const popImp = useLocalState(population_importance as number, (v) => set({ population_importance: v }));

	const ageState = useLocalState(age_val, (val) => setRange({ age_min: val[0], age_max: val[1] }));
	const ageImp = useLocalState(age_importance as number, (v) => set({ age_importance: v }));

	const tempState = useLocalState(temperature_val, (val) => setRange({ temperature_min: val[0], temperature_max: val[1] }));
	const tempImp = useLocalState(temperature_importance as number, (v) => set({ temperature_importance: v }));

	const homeState = useLocalState(home_value_val, (val) => setRange({ home_value_min: val[0], home_value_max: val[1] }));
	const homeImp = useLocalState(home_value_importance as number, (v) => set({ home_value_importance: v }));

	const rentState = useLocalState(median_rent_val, (val) => setRange({ rent_min: val[0], rent_max: val[1] }));
	const rentImp = useLocalState(median_rent_importance as number, (v) => set({ median_rent_importance: v }));

	return (
		<section className="relative">
			{layer !== "combined" && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
					<p className="text-center font-medium text-gray-600 text-sm">
						Switch to <strong>Combined</strong> view<br />to use filters
					</p>
				</div>
			)}
			<div className="space-y-2">
				{/* Population Filter */}
				<div className={`rounded-lg border p-3 transition-all ${population ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">Population</span>
						<div className="flex items-center gap-2">
							<span className="min-w-[70px] text-right font-mono text-gray-700 text-xs">
								{POP_LABELS[popState.local[0]]} - {POP_LABELS[popState.local[1]]}
							</span>
							<button type="button" onClick={() => set({ population: !population })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${population ? "bg-indigo-600" : "bg-gray-300"}`}>
								<span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${population ? "translate-x-5" : "translate-x-1"}`} />
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<DualRangeInput min={0} max={POP_BUCKETS.length - 1} step={1} disabled={!population} state={popState} />
							<div className="relative mt-1 h-4 w-full text-[10px] font-medium text-gray-400">
								{POP_LABELS.map((label, i) => (
									<span key={label} className="absolute top-0 w-10 -translate-x-1/2 text-center" style={{ left: `calc(8px + ${(i / 5) * 100}% - ${(i / 5) * 16}px)` }}>
										{label}
									</span>
								))}
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Importance</span>
							<ImportanceInput disabled={!population} state={popImp} />
						</div>
					</div>
				</div>

				{/* Median Age Filter */}
				<div className={`rounded-lg border p-3 transition-all ${age ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">Median Age</span>
						<div className="flex items-center gap-2">
							<span className="min-w-[70px] text-right font-mono text-gray-700 text-xs">
								{Math.round(ageState.local[0])} - {Math.round(ageState.local[1])}yrs
							</span>
							<button type="button" onClick={() => set({ age: !age })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${age ? "bg-indigo-600" : "bg-gray-300"}`}>
								<span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${age ? "translate-x-5" : "translate-x-1"}`} />
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<DualRangeInput min={median_age_min} max={median_age_max} step={1} disabled={!age} state={ageState} />
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Importance</span>
							<ImportanceInput disabled={!age} state={ageImp} />
						</div>
					</div>
				</div>

				{/* Temperature Filter */}
				<div className={`rounded-lg border p-3 transition-all ${temperature ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">Avg. Temperature</span>
						<div className="flex items-center gap-2">
							<span className="min-w-[70px] text-right font-mono text-gray-700 text-xs">
								{Math.round(tempState.local[0])} - {Math.round(tempState.local[1])}°F
							</span>
							<button type="button" onClick={() => set({ temperature: !temperature })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${temperature ? "bg-indigo-600" : "bg-gray-300"}`}>
								<span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${temperature ? "translate-x-5" : "translate-x-1"}`} />
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<DualRangeInput min={temperature_min} max={temperature_max} step={1} disabled={!temperature} state={tempState} />
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Importance</span>
							<ImportanceInput disabled={!temperature} state={tempImp} />
						</div>
					</div>
				</div>

				{/* Home Value Filter */}
				<div className={`rounded-lg border p-3 transition-all ${home_value ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">Home Value</span>
						<div className="flex items-center gap-2">
							<span className="min-w-[130px] text-right font-mono text-gray-700 text-xs">
								${homeState.local[0].toLocaleString()} - ${homeState.local[1].toLocaleString()}
							</span>
							<button type="button" onClick={() => set({ home_value: !home_value })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${home_value ? "bg-indigo-600" : "bg-gray-300"}`}>
								<span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${home_value ? "translate-x-5" : "translate-x-1"}`} />
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<DualRangeInput min={homeValue_min} max={homeValue_max} step={Math.round((homeValue_max - homeValue_min) / 100)} disabled={!home_value} state={homeState} />
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Importance</span>
							<ImportanceInput disabled={!home_value} state={homeImp} />
						</div>
					</div>
				</div>

				{/* Median Rent Filter */}
				<div className={`rounded-lg border p-3 transition-all ${median_rent ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">Median Rent</span>
						<div className="flex items-center gap-2">
							<span className="min-w-[110px] text-right font-mono text-gray-700 text-xs">
								${rentState.local[0].toLocaleString()} - ${rentState.local[1].toLocaleString()}
							</span>
							<button type="button" onClick={() => set({ median_rent: !median_rent })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${median_rent ? "bg-indigo-600" : "bg-gray-300"}`}>
								<span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${median_rent ? "translate-x-5" : "translate-x-1"}`} />
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<DualRangeInput min={medianRent_min} max={medianRent_max} step={Math.round((medianRent_max - medianRent_min) / 100)} disabled={!median_rent} state={rentState} />
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Importance</span>
							<ImportanceInput disabled={!median_rent} state={rentImp} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
