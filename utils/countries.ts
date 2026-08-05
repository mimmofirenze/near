export function countryCodeToFlag(countryCode?: string | null) {
  if (!countryCode || countryCode.length !== 2) {
    return "🌍";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((character) =>
      String.fromCodePoint(character.charCodeAt(0) + 127397)
    )
    .join("");
}