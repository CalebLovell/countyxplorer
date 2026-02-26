import * as React from "react";

export const GuideModal = () => {
	const [open, setOpen] = React.useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="ml-2 shrink-0 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
			>
				📖 Guide
			</button>

			{open && (
				<>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
						onClick={() => setOpen(false)}
					>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: modal */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: modal */}
						<div
							className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="absolute top-3 right-3 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
							>
								✕
							</button>

							<h2 className="mb-4 text-lg font-bold text-gray-900">
								📖 How to Use CountyXplorer
							</h2>

							<div className="space-y-4 text-sm text-gray-700">
								<section>
									<h3 className="mb-1 font-semibold text-gray-900">🗺️ Exploring the Map</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li><strong>Click</strong> any county to see its detailed data in the left panel.</li>
										<li><strong>Scroll</strong> to zoom in/out, or use the <strong>+/−</strong> buttons.</li>
										<li><strong>Drag</strong> to pan around the map.</li>
										<li>Press <strong>⌂</strong> to reset the zoom.</li>
									</ul>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">🔍 Finding Counties</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li>Use the <strong>search bar</strong> in the top-right to find counties by name.</li>
										<li>The <strong>Top 10 Matches</strong> list (left panel) ranks counties by how well they fit your filters.</li>
									</ul>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">⚙️ Adjusting Filters</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li>Use the <strong>sliders</strong> on the right to set your preferred ranges for population, age, temperature, home value, and rent.</li>
										<li>Set <strong>importance</strong> (1–5) to control how much each factor matters.</li>
										<li>Toggle filters <strong>on/off</strong> to include or exclude them.</li>
										<li>Click <strong>↺ Reset Filters</strong> to restore defaults.</li>
									</ul>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">🎯 Quick Presets</h3>
									<p>Use the preset buttons at the bottom of the left panel to instantly apply curated filter profiles like <strong>Retirement Paradise</strong>, <strong>Young Professional</strong>, and more.</p>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">📊 View Modes</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li><strong>Combined</strong> — colors counties by overall match to your filters (darker = better fit).</li>
										<li><strong>Population / Age / Temp / Home Value / Rent</strong> — colors by a single metric.</li>
									</ul>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">📌 Comparing Counties</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li>Click <strong>📌 Pin</strong> on a county's detail panel to add it to the comparison table.</li>
										<li>Pin up to <strong>4 counties</strong> to compare them side-by-side.</li>
									</ul>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">🔗 Sharing</h3>
									<p>Click the <strong>Share</strong> button on the map to copy a link with your current filters and selected county. Anyone opening the link will see the same view.</p>
								</section>

								<section>
									<h3 className="mb-1 font-semibold text-gray-900">💡 Tips</h3>
									<ul className="list-disc space-y-1 pl-5">
										<li>Data marked with <strong>~</strong> is estimated from a related region.</li>
										<li>The <strong>Cost of Living</strong> score (0–100) combines rent and home values — lower is cheaper.</li>
									</ul>
								</section>
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
};
