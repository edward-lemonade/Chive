import React from "react";
import { Link } from "react-router";

type BrandProps = {
	href?: string;
	sizeClass?: string; // tailwind text size classes, e.g. 'text-4xl'
	className?: string;
	children?: React.ReactNode;
};

export default function Brand({
	href = "/",
	sizeClass = "text-4xl",
	className = "",
	children,
}: BrandProps) {
	return (
		<Link
			to={href}
			className={`${sizeClass} font-bold bg-linear-to-br from-yellow-100 to-lime-500 bg-clip-text text-transparent transition-transform duration-200 cursor-pointer hover:-skew-x-6 ${className}`}
		>
			{children ?? "Chive"}
		</Link>
	);
}
