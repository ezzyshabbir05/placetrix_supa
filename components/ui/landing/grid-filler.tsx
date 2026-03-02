import { cn } from "@/lib/utils";

type GridFillerProps = React.ComponentProps<"div"> & {
	/**
	 * The number of items in the grid.
	 */
	totalItems: number;
	/**
	 * Number of columns for small screens.
	 */
	smColumns?: number;
	/**
	 * Number of columns for medium screens.
	 */
	mdColumns?: number;
	/**
	 * Number of columns for large screens.
	 */
	lgColumns?: number;
};

export function GridFiller({
	totalItems,
	className,
	smColumns = 2,
	mdColumns,
	lgColumns,
	...props
}: GridFillerProps) {
	const actualMdColumns = mdColumns ?? smColumns;
	const actualLgColumns = lgColumns ?? actualMdColumns;

	// We need enough iterations to cover the maximum possible remainder.
	// For N columns, the remainder can be at most N-1.
	const maxFillers = Math.max(smColumns, actualMdColumns, actualLgColumns) - 1;

	return (
		<>
			{Array.from({ length: maxFillers }).map((_, i) => {
				const neededSm = (smColumns - (totalItems % smColumns)) % smColumns;
				const neededMd =
					(actualMdColumns - (totalItems % actualMdColumns)) % actualMdColumns;
				const neededLg =
					(actualLgColumns - (totalItems % actualLgColumns)) % actualLgColumns;

				const showSm = i < neededSm ? "sm:block" : "sm:hidden";
				const showMd = i < neededMd ? "md:block" : "md:hidden";
				const showLg = i < neededLg ? "lg:block" : "lg:hidden";

				if (
					showSm === "sm:hidden" &&
					showMd === "md:hidden" &&
					showLg === "lg:hidden"
				) {
					return null;
				}

				return (
					<div
						className={cn(
							"pointer-events-none hidden",
							showSm,
							showMd,
							showLg,
							className
						)}
						key={`filler-${i}`}
						{...props}
					/>
				);
			})}
		</>
	);
}
