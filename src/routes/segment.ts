import type growDirection from "./constants/growDirection";
import { boundsCalc } from "./constants/baseBoundsCalc";
import type { ISegment } from "./interfaces/ISegment";
import type { ISegmentType } from "./interfaces/ISegmentType";

class Segment implements ISegment {
    size: number;
    base: number;
    bounds: number;
    vaBase: number;
    vaBounds: number;
    growDirection: typeof growDirection.Negative | typeof growDirection.Positive;
    type: ISegmentType;
  
    constructor(type: ISegmentType, base: number, size: number, segmentGrowDirection: typeof growDirection.Negative | typeof growDirection.Positive)  {
      this.type = type;
      this.size = size;
  
      // Physical Address Space Information
      this.base = base;
      
      // Should be one less than base + size because we want n values instead of n+1
      this.bounds = boundsCalc(this.base, this.size, segmentGrowDirection);
  
      
      // Virtual Address Space Information
      this.vaBase = 0;
      this.vaBounds = 0;
  
      this.growDirection = segmentGrowDirection;
    }
  }

  export {Segment};