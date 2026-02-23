import {
	uniqueNamesGenerator,
	adjectives,
	colors,
	names,
	animals,
} from "unique-names-generator";

export class NameGenerator {
	generate() {
		return uniqueNamesGenerator({
			dictionaries: [adjectives, animals, colors, names],
			separator: "-",
			style: "lowerCase",
		});
	}
}
