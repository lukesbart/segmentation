import {describe, expect, it} from 'vitest';
import { Segment } from '../src/routes/segment';

import segmentType from '../src/routes/constants/segmentType';
import growDirection from '../src/routes/constants/growDirection';

describe("Segment tests", () => {
    const codeSegment = new Segment(segmentType.code, 0, 256, growDirection.Positive);
    const stackSegment = new Segment(segmentType.stack, 256, 256, growDirection.Negative);

    it("Checks to see if positive growth segment was created with correct bounds", () => {
        expect(codeSegment.bounds).toEqual(255)
    })

    it("Checks to see if negative growth segment was created with correct bounds", () => {
        expect(stackSegment.bounds).toEqual(0);
    })
})