import {describe, expect, it} from 'vitest';
import pkg from '../src/routes/skeleton.js'
const { PhysicalAddressSpace, VirtualAddressSpace, Segment} = pkg; 
import segmentType from '../src/routes/constants/segmentType.js';
import growDirection from '../src/routes/constants/growDirection.js';

const addSegmentToPAS = (pas: InstanceType<typeof PhysicalAddressSpace>, newSegment: InstanceType<typeof Segment>): void => {
    if (pas.validSegmentCreationOrChange(newSegment, newSegment.base, newSegment.size, newSegment.growDirection)) {
        pas.segmentList.push(newSegment);
    }    
}

describe("PAS validSegmentCreationOrChange", () => {
    const pas = new PhysicalAddressSpace(12, 10);

    const pasCode = new Segment(segmentType.code, 0, 256, growDirection.Positive);
    const pasHeap = new Segment(segmentType.heap, 256, 256, growDirection.Positive);
    const pasStack = new Segment(segmentType.stack, 768, 256, growDirection.Negative);
    const pasExtra = new Segment(segmentType.extra, 768, 256, growDirection.Positive);

    addSegmentToPAS(pas, pasCode);
    addSegmentToPAS(pas, pasHeap);
    addSegmentToPAS(pas, pasStack);
    addSegmentToPAS(pas, pasExtra);

    it("Added all of the segments to physical address space", () => {
        expect(pas.segmentList.length).toBe(4);
    });

    it("Tries to move a positive growth segment into a negative growth segment", () => {
        expect(pas.validSegmentCreationOrChange(pasExtra, 767, 256, growDirection.Positive)).toBeFalsy();
    });

    it("Tries to move a negative growth segment into a positive growth segment", () => {
        expect(pas.validSegmentCreationOrChange(pasStack, 255, 256, growDirection.Negative)).toBeFalsy();
        expect(pas.validSegmentCreationOrChange(pasStack, 767, 256, growDirection.Negative)).toBeFalsy();
    });

    it("Tries to move a positive growth segment into another positive growth segment", () => {
        expect(pas.validSegmentCreationOrChange(pasHeap, 128, 256, growDirection.Positive)).toBeFalsy();
    });

    it("Moves extra away from sharing overlap with stack", () => {
        expect(pas.validSegmentCreationOrChange(pasExtra, 800, 256, growDirection.Positive)).toBeTruthy();
    });

    it("Moves extra back to sharing overlap with stack", () => {
        expect(pas.validSegmentCreationOrChange(pasExtra, 768, 256, growDirection.Positive)).toBeTruthy();
    });

    it("Moves stack away from sharing overlap with extra", () => {
        expect(pas.validSegmentCreationOrChange(pasStack, 1536, 256, growDirection.Negative)).toBeTruthy();
    });

    it("Moves stack back to sharing overlap with extra", () => {
        expect(pas.validSegmentCreationOrChange(pasStack, 768, 256, growDirection.Negative)).toBeTruthy();
    });

    it("Moves code away from and back to its original base", () => {
        expect(pas.validSegmentCreationOrChange(pasCode, 2048, 256, growDirection.Positive)).toBeTruthy();
        expect(pas.validSegmentCreationOrChange(pasCode, 0, 256, growDirection.Positive)).toBeTruthy();
    })

    it("Moves heap away from and back to its original base", () => {
        expect(pas.validSegmentCreationOrChange(pasHeap, 2048, 256, growDirection.Positive)).toBeTruthy();
        expect(pas.validSegmentCreationOrChange(pasHeap, 256, 256, growDirection.Positive)).toBeTruthy();
    })

    it("Moves stack away from and back to its original base", () => {
        expect(pas.validSegmentCreationOrChange(pasStack, 2048, 256, growDirection.Negative)).toBeTruthy();
        expect(pas.validSegmentCreationOrChange(pasStack, 768, 256, growDirection.Negative)).toBeTruthy();
    })

    it("Moves extra away from and back to its original base", () => {
        expect(pas.validSegmentCreationOrChange(pasExtra, 2048, 256, growDirection.Positive)).toBeTruthy();
        expect(pas.validSegmentCreationOrChange(pasExtra, 768, 256, growDirection.Positive)).toBeTruthy();
    })
})


// describe("PAS", () => {
//     const pas = new PhysicalAddressSpace(12, 10);

//     it("that pas has the correct sizes based on constructor", () => {
//         expect(pas.paSize).toEqual(2**12)
//     })

//     it("Should fail to create a segment because it is invalid", () => {
//         expect(pas.validSegmentCreationOrChange(-1, 0, 512)).toBeFalsy()
//     })
// })

// describe("VAS", () => {
//     const vas = new VirtualAddressSpace();

//     it("Checks that vas is an instance of VirtualAddressSpace", () =>{
//         expect(vas).toBeInstanceOf(VirtualAddressSpace);
//     })
// })

// describe("Segment", () => {
//     const segment = new Segment(segmentType.code, 0, 256, growDirection.Positive);

//     it("Should be created as expected", () => {
//         expect(segment.growDirection).toBe(growDirection.Positive);
//         expect(segment.base).toBe(0)
//         expect(segment.size).toBe(256);
//         expect(segment.bounds).toBe(255);
//         expect(segment.type).toBe(segmentType.code);
//     })
// })