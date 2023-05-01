import type { ISegment } from "./ISegment";
import type { IVirtualAddressSpace } from "./IVirtualAddressSpace";

export type IPhysicalAddressSpace = {
    paLength: number;
    paSize: number;
    vaLength: number;
    vaSize: number;
    segmentList: Array<ISegment>
    maxAddressSpaces: number;
    vasId: number;
    addressSpaceList: Array<IVirtualAddressSpace>

    editPaLength: (newPaLength: number) => void;
    editVaLength: (newVaLength: number) => void;
    validSegmentCreationOrChange: (segment: ISegment | null, newBase: number, newSize: number, segmentGrowDirection: number) => boolean;
    addNewVAS: (vas: IVirtualAddressSpace) => void;
    getPercentFull: () => number
}