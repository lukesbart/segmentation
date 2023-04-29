import type growDirection from "../constants/growDirection";
import type { ISegmentType } from "./ISegmentType";

export type ISegment = {
    size: number;
    bounds: number;
    base: number;
    vaBase: number;
    vaBounds: number;
    growDirection: typeof growDirection.Positive | typeof growDirection.Negative
    type: ISegmentType;
}