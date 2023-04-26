import growDirection from "./growDirection";
import { inRange } from "./inRange";

const validAccess = (base: number, bounds: number, accessAddress: number, segmentGrowDirection: number) => {
    if (segmentGrowDirection === growDirection.Positive && inRange(accessAddress, base, bounds)) {
        return true;
    }

    if (segmentGrowDirection === growDirection.Negative && inRange(accessAddress, base - 1, bounds)) {
        return true;
    }

    return false;
}

export {validAccess}