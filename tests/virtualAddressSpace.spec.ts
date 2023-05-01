import { describe, expect, it } from "vitest";

import { VirtualAddressSpace } from "../src/routes/virtualAddressSpace";
import { Segment } from "../src/routes/segment";

import segmentType from "../src/routes/constants/segmentType";
import growDirection from "../src/routes/constants/growDirection";

describe("VAS place segment", () => {
    const vas = new VirtualAddressSpace();
    vas.vaLength = 10;
    vas.size = 2**vas.vaLength;

    const vasExtra = new Segment(segmentType.extra, 512, 256, growDirection.Negative);

    it("Should place the extra negative growth segment at the end of the virutal address space", () => {
        vas.placeSegment(vasExtra);

        expect(vasExtra.vaBase).toEqual(1024);
    })
})

describe("VAS address in segment", () => {
    const vas = new VirtualAddressSpace();
    vas.vaLength = 10;
    vas.size = 2**vas.vaLength;

    const vasCode = new Segment(segmentType.code, 0, 256, growDirection.Positive);

    it("Should return that the address is in the code segment", () => {
        vas.addNewSegment(vasCode);

        expect(vas.addressInSegment(128)?.type.name).toBe("Code")
    })
})