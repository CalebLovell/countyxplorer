import { createContext, useContext, useMemo } from "react";
import type { Stdev } from "~/data/functions";
import { standardDeviation } from "~/data/functions";
import type { CountyData } from "~/data/types";

type CountiesContextValue = {
	counties: CountyData[];
	stdev: Stdev;
};

const CountiesContext = createContext<CountiesContextValue | null>(null);

type Props = {
	counties: CountyData[];
	children: React.ReactNode;
};

export const CountiesProvider = ({ counties, children }: Props) => {
	const stdev = useMemo(() => standardDeviation(counties), [counties]);

	return (
		<CountiesContext.Provider value={{ counties, stdev }}>
			{children}
		</CountiesContext.Provider>
	);
};

export const useCounties = () => {
	const ctx = useContext(CountiesContext);
	if (!ctx) throw new Error("useCounties must be inside CountiesProvider");
	return ctx;
};
