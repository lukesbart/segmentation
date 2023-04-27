import {describe, expect, it} from 'vitest';
import pkg from '../src/routes/skeleton.js'
const { PhysicalAddressSpace, VirtualAddressSpace, Segment, segmentType, implicitActions, growDirection} = pkg; 



describe("PAS", () => {
    const pas = new PhysicalAddressSpace(12, 10);

    it("that pas has the correct sizes based on constructor", () => {
        expect(pas.paSize).toEqual(2**12)
    })

    it("Should fail to create a segment because it is invalid", () => {
        expect(pas.validSegmentCreationOrChange(-1, 0, 512)).toBeFalsy()
    })
})

describe("VAS", () => {
    const vas = new VirtualAddressSpace();

    it("Checks that vas is an instance of VirtualAddressSpace", () =>{
        expect(vas).toBeInstanceOf(VirtualAddressSpace);
    })
})

describe("Segment", () => {
    const segment = new Segment(segmentType.code, 0, 256, growDirection.Positive);

    it("Should be created as expected", () => {
        expect(segment.growDirection).toBe(growDirection.Positive);
        expect(segment.base).toBe(0)
        expect(segment.size).toBe(256);
        expect(segment.bounds).toBe(255);
        expect(segment.type).toBe(segmentType.code);
    })
})