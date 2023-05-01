import { validAccess } from "./constants/validAccess";
import type { ISegmentType } from "./interfaces/ISegmentType";
import segmentType from "./constants/segmentType";
import growDirection from "./constants/growDirection";
import type { IVirtualAddressSpace } from "./interfaces/IVirtualAddressSpace";
import type { ISegment } from "./interfaces/ISegment";

class VirtualAddressSpace implements IVirtualAddressSpace {
    size: number;
    vaLength: number;
    id: number;
    segmentList: Array<ISegment>
  
    constructor() {
      // All three set when VAS is added to PAS
      this.vaLength = 0;
      this.size = 0;
      // Used to keep track of segments in visualization
      this.id = 0;
  
      this.segmentList = [];
    }
   
    // When creating a new segment, the new segment's VABase won't be known because that would be given to it
    validSegmentCreationOrChange(newSegment: ISegment | null, newSize: number): boolean {
      if (newSize > this.size / 4) {
        return false;
      }
  
      // Seeing if virtual address space already has this type of segment and whether it is the current segment or not
      if(newSegment !== null && !(this.segmentList.indexOf(newSegment) === -1) && this.segmentList[this.segmentList.indexOf(newSegment)] !== newSegment) {
        return false;
      }
  
  
      // Should not be passing in newVABase because that is assigned by the VirtualAddressSpace
      if (newSize > (this.size / 4)) {
        return false;
      }
  
      return true;
    }
  
    placeSegment(segment: ISegment): void {
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
          segment.vaBase = this.size;
        } else {
          segment.vaBase = this.size * (3/4);
        }
      }
      else {
        throw new Error("Segment must have a type")
      }
  
      if (segment.growDirection === growDirection.Positive) {
        segment.vaBounds = segment.vaBase + segment.size - 1;
      } else {
        segment.vaBounds = segment.vaBase - segment.size;
      }
  
    }
  
    addNewSegment(segment: ISegment): void {
      this.placeSegment(segment);
      this.segmentList.push(segment);
    }
  
    editSegment(segment: ISegment, segmentIndex: number): void {
      // To reuse addNewSegment function create copy of segment and delete in array
      // let editedSegment = segment;
      //
      // this.segmentList.splice(this.segmentList.indexOf(segment), 0);
      //
      // this.addNewSegment(editedSegment);
  
      this.placeSegment(segment);
      this.segmentList[segmentIndex] = segment;
  
    }
  
    editSegmentGrowDirection(segment: ISegment, segmentIndex: number): void {
      this.placeSegment(segment);
      this.segmentList[segmentIndex] = segment;
    }
  
    addressInSegment(virtualAddress: number): ISegment  | null {
      for (let i = 0; i < this.segmentList.length; i++) {
        // With negative growth direction, the first valid address is segmentBase - 1, 
        if (validAccess(this.segmentList[i].vaBase, this.segmentList[i].vaBounds, virtualAddress, this.segmentList[i].growDirection)) {
          return this.segmentList[i];
        }
      }
  
      // If I want to be typesafe about this, change this to return null and handle that in sim or page 
      return null; 
    }
  
    segmentNameFromVirtualAddress(virtualAddress: number): ISegmentType["name"] | null {
      const segmentFound = this.addressInSegment(virtualAddress);
  
      if(segmentFound == null) {
        return null
      } else {
        return segmentFound.type.name;
      }
    }
  }

  export {VirtualAddressSpace}