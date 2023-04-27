import segmentType from "./constants/segmentType";
import growDirection from "./constants/growDirection";
import { inRange } from "./constants/inRange";
import { validAccess } from "./constants/validAccess";
import { boundsCalc } from "./constants/baseBoundsCalc";

class PhysicalAddressSpace {
  paLength: number;
  paSize: number;
  vaLength: number;
  vaSize: number;
  segmentList: Array<Segment>
  maxAddressSpaces: number;
  vasId: number;
  addressSpaceList: Array<VirtualAddressSpace>

  constructor(paLength: number, vaLength: number) {
    this.paLength = paLength;
    this.paSize = (2 ** paLength);

    this.vaLength = vaLength;
    this.vaSize = (2 ** vaLength);

    this.segmentList = [];

    // Change this to a just be reliant on the getPercentFull function
    this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2; 

    this.addressSpaceList = [];

    // Keep track of vasId to ensure unique vas names
    this.vasId = 0;
  }

  validSegmentCreationOrChange(segment: InstanceType<typeof Segment>, newBase: number, newSize: number, segmentGrowDirection: number): boolean {
    // Segment can't be bigger than its share of the virtual address space
    if (newSize > (this.vaSize / 4)) {
      throw new Error("Segment cannot be bigger than 1/4 of the Virtual Address Space Size")
    }

    // Using for i loop to avoid having to keep a separate valid tracking variable
    for (let i = 0; i < this.segmentList.length; i++) {
      if (this.segmentList[i] === segment) {
        continue;
      }

      // Positive and negative grow direction segments share same base if they are adjacent
      // Segments can't be created in overlapping space
      if (segmentGrowDirection === growDirection.Negative && (inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds) || inRange(newBase + newSize*segmentGrowDirection + 2, this.segmentList[i].base, this.segmentList[i].bounds))) {
        return false;
      } else if (segmentGrowDirection === growDirection.Positive && ((inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Positive) || (inRange(newBase + 1, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Negative) || (inRange(newBase + newSize, this.segmentList[i].base, this.segmentList[i].bounds)))) {
        return false;
      }

      // if (segmentGrowDirection === growDirection.Negative && (inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds))) {
      //   return false;
      // } else if (segmentGrowDirection === growDirection.Positive && (inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds))) {
      //   return false;
      // }

      // if (segmentGrowDirection === growDirection.Negative && (inRange(newBase + newSize * segmentGrowDirection, this.segmentList[i].base, this.segmentList[i].bounds))) {
      //   return false;
      // } else if(segmentGrowDirection == growDirection.Positive && (inRange(newBase + newSize, this.segmentList[i].base, this.segmentList[i].bounds))) {
      //   return false;
      // }
    }
  
    return true;
  }

  addNewVAS(vas: InstanceType<typeof VirtualAddressSpace>) {
    // if (this.addressSpaceList.length < this.maxAddressSpaces) {
    if(this.getPercentFull() < 1) {
      vas.vaLength = this.vaLength;
      vas.size = this.vaSize;
      vas.id = this.vasId++;
      this.addressSpaceList.push(vas);
    } else {
      throw new Error("Too many virtual address spaces");
    }
  }

  editVaLength(newVaLength: number) {
    const vaSize = 2 ** newVaLength;

    for (let i = 0; i < this.addressSpaceList.length; i++) {
      this.addressSpaceList[i].vaLength = newVaLength;
      this.addressSpaceList[i].size = vaSize;
      // call vas function to update all vbase and vbounds of segments
      for (let j = 0; j < this.addressSpaceList[i].segmentList.length; j++) {
        this.addressSpaceList[i].placeSegment(this.addressSpaceList[i].segmentList[j])
      }
    }

    this.vaLength = newVaLength;
    this.vaSize = 2 ** newVaLength;

    this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2;
  }

  editPaLength(newPaLength: number) {  
    this.paLength = newPaLength;
    this.paSize = 2 ** newPaLength;

    this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2; 
  }

  getPercentFull() {
    let segmentSizeSum = 0;

    for (let i = 0; i < this.segmentList.length; i++) {
      segmentSizeSum += this.segmentList[i].size;
    }

    return segmentSizeSum / this.paSize;
  }
}

class VirtualAddressSpace {
  size: number;
  vaLength: number;
  id: number;
  segmentList: Array<Segment>

  constructor() {
    // All three set when VAS is added to PAS
    this.vaLength = 0;
    this.size = 0;
    // Used to keep track of segments in visualization
    this.id = 0;

    this.segmentList = [];
  }
 
  // When creating a new segment, the new segment's VABase won't be known because that would be given to it
  validSegmentCreationOrChange(segment: InstanceType<typeof Segment>, newSize: number) {
    if (newSize > this.size / 4) {
      return false;
    }

    // Seeing if virtual address space already has this type of segment and whether it is the current segment or not
    if(!(this.segmentList.indexOf(segment) === -1) && this.segmentList[this.segmentList.indexOf(segment)] !== segment) {
      return false;
    }


    // Should not be passing in newVABase because that is assigned by the VirtualAddressSpace
    if (newSize > (this.size / 4)) {
      return false;
    }

    return true;
  }

  // Place segment works with growDirection incorrectly
  placeSegment(segment: InstanceType<typeof Segment>) {
    if (segment.base < 0) {
      segment.vaBase = segment.vaBounds = -1;
      return;
    }

    if (segment.type === segmentType.code) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (1/4);
      } else {
        segment.vaBase = 0;
      }
    }

    else if (segment.type === segmentType.heap) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (1/2);
      } else {
        segment.vaBase = this.size * (1/4);
      }
    }

    else if (segment.type === segmentType.stack) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (3/4);
      } else {
        segment.vaBase = this.size * (1/2);
      }
    }
    
    else if (segment.type === segmentType.extra) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size - 1;
      } else {
        segment.vaBase = this.size * (3/4);
      }
    }
    // Theoretically can never reach this section
    else {
      throw new Error("Segment must have a type")
    }

    if (segment.growDirection === growDirection.Positive) {
      segment.vaBounds = segment.vaBase + segment.size - 1;
    } else {
      segment.vaBounds = segment.vaBase - segment.size;
    }

  }

  addNewSegment(segment: InstanceType<typeof Segment>) {
    this.placeSegment(segment);
    this.segmentList.push(segment);
  }

  editSegment(segment: InstanceType<typeof Segment>, segmentIndex: number) {
    // To reuse addNewSegment function create copy of segment and delete in array
    // let editedSegment = segment;
    //
    // this.segmentList.splice(this.segmentList.indexOf(segment), 0);
    //
    // this.addNewSegment(editedSegment);

    this.placeSegment(segment);
    this.segmentList[segmentIndex] = segment;

  }

  editSegmentGrowDirection(segment: InstanceType<typeof Segment>, segmentIndex: number) {
    this.placeSegment(segment);
    this.segmentList[segmentIndex] = segment;
  }

  addressInSegment(virtualAddress: number) {
    for (let i = 0; i < this.segmentList.length; i++) {
      // With negative growth direction, the first valid address is segmentBase - 1, 
      if (validAccess(this.segmentList[i].vaBase, this.segmentList[i].vaBounds, virtualAddress, this.segmentList[i].growDirection)) {
        return this.segmentList[i];
      }
    }

    // If I want to be typesafe about this, change this to return null and handle that in sim or page 
    return null; 
  }

  segmentNameFromVirtualAddress(virtualAddress: number): string | null {
    const segmentFound = this.addressInSegment(virtualAddress);

    if(segmentFound == null) {
      return null
    } else {
      return segmentFound.type.name;
    }
  }
}

class Segment {
  size: number;
  base: number;
  bounds: number;
  vaBase: number;
  vaBounds: number;
  growDirection: typeof growDirection;
  type: typeof segmentType;

  constructor(type: typeof segmentType, base: number, size: number, segmentGrowDirection: number)  {
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

export default {PhysicalAddressSpace, VirtualAddressSpace, Segment}
