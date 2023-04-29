import type { ISegment } from "./ISegment";
import type { ISegmentType } from "./ISegmentType";

export type IVirtualAddressSpace = {
    size: number;
    vaLength: number;
    id: number;
    segmentList: Array<ISegment>;
    placeSegment: (segment: ISegment) => void;
    addressInSegment: (virtualAddress: number) => ISegment  | null;
    validSegmentCreationOrChange: (segment: ISegment | null, newSize: number)=> boolean;
    segmentNameFromVirtualAddress: (virtualAddress: number) => ISegmentType["name"] | null;
    addNewSegment: (segment: ISegment) => void;
    editSegment: (segment: ISegment, segmentIndex: number) => void;
    editSegmentGrowDirection: (segment: ISegment, segmentIndex: number) => void;
};