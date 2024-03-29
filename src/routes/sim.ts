import type {IPhysicalAddressSpace} from './interfaces/IPhysicalAddressSpace'

import { PhysicalAddressSpace } from './physicalAddressSpace';
import { VirtualAddressSpace } from './virtualAddressSpace';
import { Segment } from './segment';

import growDirection from './constants/growDirection';
import segmentType from './constants/segmentType';
import { boundsCalc } from './constants/baseBoundsCalc';
import type { ISegment } from './interfaces/ISegment';
import type { IVirtualAddressSpace } from './interfaces/IVirtualAddressSpace';
import type { ISegmentType } from './interfaces/ISegmentType';

// Should only contain logic that cannot be contained in skeleton
// Should still provide proxy between view and skeleton

class Simulator {
  pas: IPhysicalAddressSpace;

  static segmentType = segmentType;
  static growDirection = growDirection;

  constructor(paLength = 12, vaLength = 10) {
    this.pas = new PhysicalAddressSpace(paLength, vaLength)
  }

  editVaLength(newVaLength: number): void {
    if (newVaLength > this.pas.paLength) {
      throw new Error("vaLength must be less than PALength")
    }

    if(newVaLength <= 0) {
      throw new Error("vaLength cannot be less than 1")
    }

    let maxSize = 0;
    for (let i = 0; i < this.pas.segmentList.length; i++) {
      if (this.pas.segmentList[i].size > maxSize) {
        maxSize = this.pas.segmentList[i].size;
      }
    }

    if (2**newVaLength < maxSize * 4) {
      throw new Error("vaLength cannot be less than segment size")
    }

    this.pas.editVaLength(newVaLength);
  }

  editPaLength(newPaLength: number): void {
    if (newPaLength < this.pas.vaLength) {
      throw new Error("paLength Cannot Be Less than vaLength")
    }
    
    for (let i = 0; i < this.pas.segmentList.length; i++) {
      if (this.pas.segmentList[i].bounds > 2**newPaLength) {
        throw new Error("paLength cannot be less than max segment place")
      }
    }

    this.pas.editPaLength(newPaLength)
  }

  // Segments should be created when a new address space is created with a default size, the user can only edit segments or delete the virtual address space containing them
  deleteVirtualAddressSpace(vas: IVirtualAddressSpace): void {
    // Remove all the segments in the virtual address space from the physical address space
    for (let i = 0; i < vas.segmentList.length; i++) {
      this.pas.segmentList.splice(this.pas.segmentList.indexOf(vas.segmentList[i]), 1);
    }

    this.pas.addressSpaceList.splice(this.pas.addressSpaceList.indexOf(vas), 1);
  }

  // Need a way to determine which vas a segment is in
  // Since the simulator will know what virtual address space is in, might not need to find it, could be useful to confirm that segment exists in PAS
  editSegment(segment: ISegment, newBase: number, newSize: number): void {
    if (newBase < 0) {
      throw new Error("Base cannot be negative")
    }

    if (newBase > this.pas.paSize) {
      throw new Error("Base cannot be higher than the size of the physical address space")
    }

    if ((newBase + (newSize * segment.growDirection)) < 0) {
      throw new Error("Segment cannot be placed in negative space")
    }

    // Find vas to avoid nesting the vas in the segment
    let vas: IVirtualAddressSpace | undefined;

    // For loop should be based off of addressSpaceList length
    for (let i = 0; i < this.pas.addressSpaceList.length; i++) {
      if (this.pas.addressSpaceList[i].segmentList.indexOf(segment) !== -1) {
        vas = this.pas.addressSpaceList[i];
        break;
      }
    }

    if (vas === undefined) {
      throw new Error("Could not find segment")
    }

    // Need to make sure that base is in bounds of PA
    if (this.pas.validSegmentCreationOrChange(segment, newBase, newSize, segment.growDirection) && vas.validSegmentCreationOrChange(segment, newSize) && ((newBase + newSize*segment.growDirection)) < this.pas.paSize) {
      // Don't need a function in pas to change segment because current information is valid, changes automatically
      
      const segmentIndex = vas.segmentList.indexOf(segment);

      // By reassigning here, it is reassigned in all locations of the segment, remove one of the reassignings either here or in skeleton
      // Consider cloning segment and passing or only editing it here
      // Need to handle growth direction for segment
      segment.size = newSize;
      segment.base = newBase;
      segment.bounds = boundsCalc(newBase, newSize, segment.growDirection); 

      vas.editSegment(segment, segmentIndex);
    } else {
      if ((newBase + newSize*segment.growDirection) > this.pas.paSize) {
        throw new Error("Segment cannot go outside of physical address space");
      }

      throw new Error("Invalid segment base or size");
    }
  }

  editSegmentGrowDirection(segment: ISegment, newGrowDirection: number): void {
    // Have to find vas because vaBase and vaBounds are based partially on growDirection
    let vas: IVirtualAddressSpace | undefined;
    for (let i = 0; i < this.pas.addressSpaceList.length; i++) {
      if (this.pas.addressSpaceList[i].segmentList.indexOf(segment) !== -1) {
        vas = this.pas.addressSpaceList[i];
        break;
      }
    }

    if (vas === undefined) {
      throw new Error("Could not find virtual address space")
    }
    
    const segmentIndex = vas.segmentList.indexOf(segment);

    segment.growDirection = newGrowDirection;

    vas.editSegmentGrowDirection(segment, segmentIndex);

    // Need way to switch these while being able to reverse them an infinte amount of times
    let newBase, newBounds : number;

    // With negative grow direction, the actual base is one more than the actual number of addresses because the 0th address is not valid
    if (newGrowDirection === growDirection.Negative) {
      newBase = segment.bounds + 1;
      newBounds = boundsCalc(newBase, segment.size, newGrowDirection)
    } else {
      newBase = segment.bounds;
      newBounds = boundsCalc(newBase, segment.size, newGrowDirection)
    }

    segment.base = newBase;
    segment.bounds = newBounds;
  }

  createAddressSpace(): void {
    const newVirtualAddressSpace = new VirtualAddressSpace();
    
    this.pas.addNewVAS(newVirtualAddressSpace);
  }

  createNewSegment(type: ISegmentType, base: number, size: number, growDirection: number, vas: IVirtualAddressSpace): void {
    if ((this.pas.validSegmentCreationOrChange(null, base, size, growDirection) && vas.validSegmentCreationOrChange(null, size)) || (base === -1 && size === 0)) {
      const newSegment = new Segment(type, base, size, growDirection);

      vas.addNewSegment(newSegment);
      this.pas.segmentList.push(newSegment);
    }
  }

  segmentNameFromVirtualAddress(vasIndex: number, virtualAddress: number): string | null {
    if (virtualAddress < 0) {
      return "N/A"
    }
    return this.pas.addressSpaceList[vasIndex].segmentNameFromVirtualAddress(virtualAddress)
  }

  translateVirtualAddressToPhysicalAddress(vasIndex: number, virtualAddress: number): number | null {
    const segment = this.addressInSegment(vasIndex, virtualAddress);

    if (segment === null) {
      return null;
    }

    const translation = (segment.base - segment.vaBase) + virtualAddress;

    return translation;
  }

  addressInSegment(vasIndex: number, virtualAddress: number): ISegment | null {
    return this.pas.addressSpaceList[vasIndex].addressInSegment(virtualAddress);
  }

  // Unused function
  explicitAddress(segment: ISegment, address: number) {
    if (address < 0) {
      return [null, null];
    }

    const code = segment.type.number.toString(2).padStart(2, '0');
    const offset = Math.abs(address - segment.vaBase).toString(2).padStart(this.pas.vaLength -  2, '0')

    return [code, offset];
  }

  toJSON(): string {
    return JSON.stringify(this.pas)
  }

  // Should the client take this and set their PAS equal to newSim.pas or the simulator does it automatically?
  // These functions should be moved into their own class?
  createBuild(jsonInput: string): IPhysicalAddressSpace {
    let parseObj;

    try {
      parseObj = JSON.parse(jsonInput);
    } catch (e) {
      throw new Error("Invalid JSON Input.")
    }

    // Create a new simulator, build the sim.pas and then set the new sim.pas equal to the global sim.pas
    // Need to check for PAS sizes eventually
    const newSim = new Simulator(parseObj["paLength"], parseObj["vaLength"])

    for (let i = 0; i < parseObj["addressSpaceList"].length; i++) {
      newSim.createAddressSpace();

      parseObj["addressSpaceList"][i]["segmentList"].forEach((segment: ISegment) => {
        // Bug from improper growDirection and segmentType?
        const newSegmentType = segmentType[segment["type"].name.toLowerCase()];
       

        let segmentGrowDirection: number | undefined;
        if (segment["growDirection"] === 1) {
          segmentGrowDirection = Simulator.growDirection.Positive;
        } else if (segment["growDirection"] === -1) {
          segmentGrowDirection = Simulator.growDirection.Negative;
        }

        if (segmentGrowDirection === undefined) {
          throw new Error("All Segments Must have a grow Direction")
        }

        newSim.createNewSegment(newSegmentType, segment["base"], segment["size"], segmentGrowDirection, newSim.pas.addressSpaceList[i])
        
      })
    }

    return newSim.pas;
  }

  buildDefault(): void {
    const size = 256;
    let base = 0;

    this.createAddressSpace();
    this.createAddressSpace();
    this.createAddressSpace();
    this.createAddressSpace();


    for (let i = 0; i < this.pas.addressSpaceList.length; i++) {
      this.createNewSegment(segmentType.code, base, size, growDirection.Positive, this.pas.addressSpaceList[i])
      base += size;
      
      this.createNewSegment(segmentType.heap, base, size, growDirection.Positive, this.pas.addressSpaceList[i])
      base += size;

      this.createNewSegment(segmentType.stack, base+size-1, size, growDirection.Negative, this.pas.addressSpaceList[i])
      base += size;

      this.createNewSegment(segmentType.extra, base, size, growDirection.Positive, this.pas.addressSpaceList[i])
      base += size;
    }
  }

  // Instead of having the client create all the options for the address space, create a default address space and have them edit it
  // Unused method, replacex with createNewBlankAddressSpace
  createNewDefaultAddressSpace(): void {
    const size = 256;
    let base = 0;

    if (this.pas.segmentList.length > 0) {
      const lastSegment = this.pas.segmentList[this.pas.segmentList.length - 1]

      if (lastSegment.growDirection === growDirection.Positive) {
        base = lastSegment.bounds + 1;
      } else {
        base  = lastSegment.base + 1;
      }
    }

    this.createAddressSpace();

    const as = this.pas.addressSpaceList[this.pas.addressSpaceList.length - 1]

    this.createNewSegment(segmentType.code, base, size, growDirection.Positive, as)
    base += size;

    this.createNewSegment(segmentType.heap, base, size, growDirection.Positive, as)
    base += size;

    this.createNewSegment(segmentType.stack, base+size, size, growDirection.Negative, as)
    base += size;

    this.createNewSegment(segmentType.extra, base, size, growDirection.Positive, as)
  }

  createNewBlankAddressSpace() {
    

    this.createAddressSpace();

    const as = this.pas.addressSpaceList[this.pas.addressSpaceList.length - 1]

    this.createNewSegment(segmentType.code, -1, 0, growDirection.Positive, as);
    this.createNewSegment(segmentType.heap, -1, 0, growDirection.Positive, as);
    this.createNewSegment(segmentType.stack, -1, 0, growDirection.Negative, as);
    this.createNewSegment(segmentType.extra, -1, 0, growDirection.Positive, as);
  }
}

export {Simulator}
