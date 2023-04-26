import growDirection from "./growDirection"

const baseCalc = (baseValue: number, segmentGrowDirection: number) => {
    if (segmentGrowDirection === growDirection.Positive) {
        return baseValue;
    }

    if (segmentGrowDirection === growDirection.Negative) {
        return baseValue - 1;
    }
}

const boundsCalc = (baseValue: number, size: number, segmentGrowDirection: number): number => {
    if (segmentGrowDirection === growDirection.Positive) {
        return baseValue + size - 1;
    }

    if (segmentGrowDirection === growDirection.Negative) {
        return baseValue - size;
    }

    throw new Error("Segment Must Have a Growth Direction")
}

// this.bounds = segmentGrowDirection === growDirection.Positive ? this.base + this.size - 1 : this.base - this.size;

export {baseCalc, boundsCalc}