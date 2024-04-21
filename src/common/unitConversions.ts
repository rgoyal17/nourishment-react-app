import { UNIT } from "./constants";

export function convert(stringValue: string, from: string, to: string) {
  const numValue = Number(stringValue);

  if (!(from in UNIT) || !(to in UNIT) || isNaN(numValue)) {
    return undefined;
  }

  const typedFrom: UNIT = UNIT[from as keyof typeof UNIT];
  const typedTo: UNIT = UNIT[to as keyof typeof UNIT];

  let gramValue = undefined;
  let literValue = undefined;
  let meterValue = undefined;

  switch (typedFrom) {
    case UNIT.gram:
      gramValue = numValue;
      break;
    case UNIT.kilogram:
      gramValue = numValue * 1000;
      break;
    case UNIT.ounce:
      gramValue = numValue * 28.3495;
      break;
    case UNIT.pound:
      gramValue = numValue * 453.592;
      break;

    case UNIT.liter:
      literValue = numValue;
      break;
    case UNIT.milliliter:
      literValue = numValue * 0.001;
      break;
    case UNIT.teaspoon:
      literValue = numValue * 0.00492892;
      break;
    case UNIT.tablespoon:
      literValue = numValue * 0.0147868;
      break;
    case UNIT.cup:
      literValue = numValue * 0.24;
      break;
    case UNIT.pint:
      literValue = numValue * 0.473176;
      break;
    case UNIT.quart:
      literValue = numValue * 0.946353;
      break;
    case UNIT.gallon:
      literValue = numValue * 3.78541;
      break;

    case UNIT.meter:
      meterValue = numValue;
      break;
    case UNIT.centimeter:
      meterValue = numValue * 0.01;
      break;
    case UNIT.millimeter:
      meterValue = numValue * 0.001;
      break;
    case UNIT.inch:
      meterValue = numValue * 0.0254;
      break;
    case UNIT.foot:
      meterValue = numValue * 0.3048;
      break;
    case UNIT.yard:
      meterValue = numValue * 0.9144;
      break;
    case UNIT.mile:
      meterValue = numValue * 1609.34;
      break;

    default:
      break;
  }

  switch (typedTo) {
    case UNIT.gram:
      return gramValue;
    case UNIT.kilogram:
      return gramValue == null ? undefined : gramValue * 0.001;
    case UNIT.ounce:
      return gramValue == null ? undefined : gramValue * 0.035274;
    case UNIT.pound:
      return gramValue == null ? undefined : gramValue * 0.00220462;

    case UNIT.liter:
      return literValue;
    case UNIT.milliliter:
      return literValue == null ? undefined : literValue * 1000;
    case UNIT.teaspoon:
      return literValue == null ? undefined : literValue * 202.884;
    case UNIT.tablespoon:
      return literValue == null ? undefined : literValue * 67.628;
    case UNIT.cup:
      return literValue == null ? undefined : literValue * 4.16667;
    case UNIT.pint:
      return literValue == null ? undefined : literValue * 2.11338;
    case UNIT.quart:
      return literValue == null ? undefined : literValue * 1.05669;
    case UNIT.gallon:
      return literValue == null ? undefined : literValue * 0.264172;

    case UNIT.meter:
      return meterValue;
    case UNIT.centimeter:
      return meterValue == null ? undefined : meterValue * 100;
    case UNIT.millimeter:
      return meterValue == null ? undefined : meterValue * 1000;
    case UNIT.inch:
      return meterValue == null ? undefined : meterValue * 39.3701;
    case UNIT.foot:
      return meterValue == null ? undefined : meterValue * 3.28084;
    case UNIT.yard:
      return meterValue == null ? undefined : meterValue * 1.09361;
    case UNIT.mile:
      return meterValue == null ? undefined : meterValue * 0.000621371;

    default:
      return undefined;
  }
}
