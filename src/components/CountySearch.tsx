import { getRouteApi, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useCounties } from "~/data/CountiesContext";

const route = getRouteApi("/$layer");

export const CountySearch = () => {
	const { counties } = useCounties();
	const search = route.useSearch();
	const navigate = useNavigate();
	const [query, setQuery] = React.useState("");
	const [isOpen, setIsOpen] = React.useState(false);
	const [highlightIndex, setHighlightIndex] = React.useState(0);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const listRef = React.useRef<HTMLUListElement>(null);

	const results = React.useMemo(() => {
		if (!query.trim()) return [];
		const q = query.toLowerCase().trim();
		return counties
			.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.state.toLowerCase().includes(q) ||
					`${c.name}, ${c.state}`.toLowerCase().includes(q),
			)
			.slice(0, 8);
	}, [query, counties]);

	React.useEffect(() => {
		setHighlightIndex(0);
	}, [results]);

	const selectCounty = React.useCallback(
		(id: string) => {
			navigate({
				from: "/$layer",
				search: { ...search, county: Number(id) },
			});
			setQuery("");
			setIsOpen(false);
			inputRef.current?.blur();
		},
		[navigate, search],
	);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && results[highlightIndex]) {
				e.preventDefault();
				selectCounty(results[highlightIndex].id);
			} else if (e.key === "Escape") {
				setIsOpen(false);
				inputRef.current?.blur();
			}
		},
		[results, highlightIndex, selectCounty],
	);

	return (
		<div className="relative">
			<div className="flex items-center">
				<svg
					className="absolute left-2.5 h-4 w-4 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					onBlur={() => setTimeout(() => setIsOpen(false), 200)}
					onKeyDown={handleKeyDown}
					placeholder="Search counties..."
					className="w-48 rounded-full border border-gray-200 bg-white/90 py-1.5 pr-3 pl-8 text-sm shadow-sm backdrop-blur-sm transition-all placeholder:text-gray-400 focus:w-64 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
				/>
			</div>

			{isOpen && results.length > 0 && (
				<ul
					ref={listRef}
					className="absolute right-0 z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
				>
					{results.map((county, i) => (
						<li key={county.id}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									selectCounty(county.id);
								}}
								className={`w-full px-3 py-2 text-left text-sm transition-colors ${
									i === highlightIndex
										? "bg-indigo-50 text-indigo-900"
										: "text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="font-medium">{county.name}</span>
								<span className="ml-1 text-gray-400">{county.state}</span>
							</button>
						</li>
					))}
				</ul>
			)}

			{isOpen && query.trim() && results.length === 0 && (
				<div className="absolute right-0 z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white px-3 py-3 text-center text-gray-500 text-sm shadow-xl">
					No counties found
				</div>
			)}
		</div>
	);
};
