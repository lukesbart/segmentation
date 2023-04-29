import growDirection from "./constants/growDirection";
import { inRange } from "./constants/inRange";
import type { IPhysicalAddressSpace } from "./interfaces/IPhysicalAddressSpace";
import type { IVirtualAddressSpace } from "./interfaces/IVirtualAddressSpace";
import type { ISegment } from "./interfaces/ISegment";

class PhysicalAddressSpace implements IPhysicalAddressSpace {
    paLength: number;
    paSize: number;
    vaLength: number;
    vaSize: number;
    segmentList: Array<ISegment>
    maxAddressSpaces: number;
    vasId: number;
    addressSpaceList: Array<IVirtualAddressSpace>
  
    constructor(paLength: number, vaLength: number) {
      this.paLength = paLength;
      this.paSize = (2 ** paLength);
  
      this.vaLength = vaLength;
      this.vaSize = (2 ** vaLength);
  
      this.segmentList = [];
  
      // Change this to a just be reliant on the getPercentFull function
      // Currently unused, maxAddressSpaces is determined by percent of physical address space used
      this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2; 
  
      this.addressSpaceList = [];
  
      // Keep track of vasId to ensure unique vas names
      this.vasId = 0;
    }
  
    validSegmentCreationOrChange(segment: ISegment | null, newBase: number, newSize: number, segmentGrowDirection: number): boolean {
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
  
        /* Really need to thoroughly test this function, one of the most complex parts of program logic
           A positive growth segment cannot overlap base or bounds with another positive growth segment
           A negative growth segment cannot overlap two bases or two bounds with another negative growth segment
           A positive growth segment can share a base with a negative growth segment and vice versa
           Segments canot overlap each other other than exceptions with base bounds and grow direction
        */
  
        if (segmentGrowDirection === growDirection.Negative) {
          if (inRange(newBase - 1, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Positive) {
            return false;
          } else if (inRange(newBase + newSize*segmentGrowDirection, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Positive) {
            return false;
          } else if ((inRange(newBase + newSize*segmentGrowDirection + 1, this.segmentList[i].base, this.segmentList[i].bounds)) && this.segmentList[i].growDirection === growDirection.Negative) {
            return false;
          } else if ((inRange(newBase - 1, this.segmentList[i].base, this.segmentList[i].bounds)) && this.segmentList[i].growDirection === growDirection.Negative) {
            return false;
          }
        } else if (segmentGrowDirection === growDirection.Positive) {
          if ((inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Positive)) {
            return false;
          } else if (inRange(newBase + 1, this.segmentList[i].base, this.segmentList[i].bounds) && this.segmentList[i].growDirection === growDirection.Negative) {
            return false;
          } else if (inRange(newBase + newSize - 1, this.segmentList[i].base, this.segmentList[i].bounds)) {
            return false;
          }
        }
      }
    
      return true;
    }
  
    addNewVAS(vas: IVirtualAddressSpace): void {
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
  
    editVaLength(newVaLength: number): void {
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
  
    editPaLength(newPaLength: number): void {  
      this.paLength = newPaLength;
      this.paSize = 2 ** newPaLength;
  
      this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2; 
    }
  
    getPercentFull(): number {
      let segmentSizeSum = 0;
  
      for (let i = 0; i < this.segmentList.length; i++) {
        segmentSizeSum += this.segmentList[i].size;
      }
  
      return segmentSizeSum / this.paSize;
    }
  }

export {PhysicalAddressSpace};