import pkg from './skeleton.mjs'
const { PhysicalAddressSpace, VirtualAddressSpace, Segment, segmentType, implicitActions, growDirection} = pkg; 

class Simulator {
  static segmentType = segmentType;
  static implicitActions = implicitActions;
  static growDirection = growDirection;

  constructor(paLength = 12, vaLength = 10) {
    this.pas = new PhysicalAddressSpace(paLength, vaLength)
  }

  editVaLength(newVaLength) {
    if (newVaLength > this.pas.paLength) {
      throw new Error("VALength must be less than PALength")
    }

    let maxSize = 0;
    for (let i = 0; i < this.pas.segmentList.length; i++) {
      if (this.pas.segmentList[i].size > maxSize) {
        maxSize = this.pas.segmentList[i].size;
      }
    }

    if (2**newVaLength < maxSize * 4) {
      throw new Error("VALength cannot be less than segment size")
    }

    this.pas.editVaLength(newVaLength);
  }

  editPaLength(newPaLength) {
    if (newPaLength < this.pas.vaLength) {
      throw new Error("PA Length Cannot Be Less than VA Length")
    }
    
    for (let i = 0; i < this.pas.segmentList.length; i++) {
      if (this.pas.segmentList[i].bounds > 2**newPaLength) {
        throw new Error("PALength cannot be less than max segment place")
      }
    }

    this.pas.editPaLength(newPaLength)
  }

  // Segments should be created when a new address space is created with a default size, the user can only edit segments or delete the virtual address space containing them
  deleteVirtualAddressSpace(vas) {
    // Remove all the segments in the virtual address space from the physical address space
    for (let i = 0; i < vas.segmentList.length; i++) {
      this.pas.segmentList.splice(this.pas.segmentList.indexOf(vas.segmentList[i]), 1);
    }

    this.pas.addressSpaceList.splice(this.pas.addressSpaceList.indexOf(vas), 1);
  }

  // Need a way to determine which vas a segment is in
  // Since the simulator will know what virtual address space is in, might not need to find it, could be useful to confirm that segment exists in PAS
  editSegment(segment, newBase, newSize) {
    if (newBase < 0) {
      throw new Error("Base cannot be negative")
    }

    if (newBase > this.pas.paSize) {
      throw new Error("Base cannot be higher than the size of the physical address space")
    }

    // Find vas to avoid nesting the vas in the segment
    let vas;

    // For loop should be based off of addressSpaceList length
    for (let i = 0; i < this.pas.addressSpaceList.length; i++) {
      if (this.pas.addressSpaceList[i].segmentList.indexOf(segment) !== -1) {
        vas = this.pas.addressSpaceList[i];
        break;
      }
    }

    // Need to make sure that base is in bounds of PA
    if (this.pas.validSegmentCreationOrChange(segment, newBase, newSize*segment.growDirection) && vas.validSegmentCreationOrChange(segment, newSize) && ((newBase + newSize*segment.growDirection)) < this.pas.paSize) {
      // Don't need a function in pas to change segment because current information is valid, changes automatically
      
      let segmentIndex = vas.segmentList.indexOf(segment);

      // By reassigning here, it is reassigned in all locations of the segment, remove one of the reassignings either here or in skeleton
      // Consider cloning segment and passing or only editing it here
      // Need to handle growth direction for segment
      segment.size = newSize;
      segment.base = newBase;
      segment.bounds = segment.size*segment.growDirection + segment.base;

      vas.editSegment(segment, segmentIndex);
    } else {
      throw new Error("Invalid segment resize")
    }
  }

  editSegmentGrowDirection(segment, growDirection) {
    // Have to find vas because vaBase and vaBounds are based partially on growDirection
    let vas;
    for (let i = 0; i < this.pas.addressSpaceList.length; i++) {
      if (this.pas.addressSpaceList[i].segmentList.indexOf(segment) !== -1) {
        vas = this.pas.addressSpaceList[i];
        break;
      }
    }
    
    let segmentIndex = vas.segmentList.indexOf(segment);

    segment.growDirection = growDirection;

    vas.editSegmentGrowDirection(segment, segmentIndex, growDirection);

    let newBase = segment.bounds;
    let newBounds = segment.base;

    segment.base = newBase;
    segment.bounds = newBounds;
  }

    // Break all this into separate pieces, functions below should be moved into a simulator class which is the middleman between the interface and the different classes

  createAddressSpace() {
    const newVirtualAddressSpace = new VirtualAddressSpace();
    
    this.pas.addNewVAS(newVirtualAddressSpace);
  }

  createNewSegment(type, base, size, growDirection, vas) {
    if (this.pas.validSegmentCreationOrChange(-1, base, size*growDirection) && vas.validSegmentCreationOrChange(-1, size)) {
      const newSegment = new Segment(type, base, size, growDirection);

      vas.addNewSegment(newSegment);
      this.pas.segmentList.push(newSegment);
    }
  }

  translateVirtualToPhysicalAddress(vasIndex, virtualAddress) {
    return this.pas.addressSpaceList[vasIndex].translateVirtualToPhysicalAddress(virtualAddress);
  }

  addressInSegment(vasIndex, virtualAddress) {
    return this.pas.addressSpaceList[vasIndex].addressInSegment(virtualAddress);
  }

  toJSON() {
    return JSON.stringify(this.pas)
  }

  // Should the client take this and set their PAS equal to newSim.pas or the simulator does it automatically?
  // These functions should be moved into their own class?
  createBuild(jsonInput) {
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

      parseObj["addressSpaceList"][i]["segmentList"].forEach(segment => {
        // Bug from improper growDirection and segmentType?
        let segmentType = Simulator.segmentType[segment["type"].name.toLowerCase()];
       

        let segmentGrowDirection;
        if (segment["growDirection"] === 1) {
          segmentGrowDirection = Simulator.growDirection.Positive;
        } else if (segment["growDirection"] === -1) {
          segmentGrowDirection = Simulator.growDirection.Negative;
        }

        newSim.createNewSegment(segmentType, segment["base"], segment["size"], segmentGrowDirection, newSim.pas.addressSpaceList[i])
        
      })
    }

    return newSim.pas;
  }

  buildDefault() {
    let size = 256;
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

      this.createNewSegment(segmentType.stack, base+size, size, growDirection.Negative, this.pas.addressSpaceList[i])
      base += size;

      this.createNewSegment(segmentType.extra, base, size, growDirection.Positive, this.pas.addressSpaceList[i])
      base += size;
    }
  }

  // Instead of having the client create all the options for the address space, create a default address space and have them edit it
  createNewDefaultAddressSpace() {
    let size = 256;
    let base = 0;

    if (this.pas.segmentList.length > 0) {
      let lastSegment = this.pas.segmentList[this.pas.segmentList.length - 1]

      if (lastSegment.growDirection === growDirection.Positive) {
        base = lastSegment.bounds + 1;
      } else {
        base  = lastSegment.base + 1;
      }
    }

    this.createAddressSpace();

    let as = this.pas.addressSpaceList[this.pas.addressSpaceList.length - 1]

    this.createNewSegment(segmentType.code, base, size, growDirection.Positive, as)
    base += size;

    this.createNewSegment(segmentType.heap, base, size, growDirection.Positive, as)
    base += size;

    this.createNewSegment(segmentType.stack, base+size, size, growDirection.Negative, as)
    base += size;

    this.createNewSegment(segmentType.extra, base+1, size-1, growDirection.Positive, as)
  }

  createNewBlankAddressSpace() {
    let size = 0;
    let base = 0;

    if (this.pas.segmentList.length > 0) {
      let lastSegment = this.pas.segmentList[this.pas.segmentList.length-1]

      if (lastSegment.growDirection === growDirection.Positive) {
        base = lastSegment.bounds + 1;
      } else {
        base = lastSegment.base + 1;
      }
    }

    this.createAddressSpace();

    let as = this.pas.addressSpaceList[this.pas.addressSpaceList.length - 1]

    this.createNewSegment(segmentType.code, base, size, growDirection.Positive, as);
    base++;

    this.createNewSegment(segmentType.heap, base, size, growDirection.Positive, as);
    base++;

    this.createNewSegment(segmentType.stack, base, size, growDirection.Negative, as);
    base++;

    this.createNewSegment(segmentType.extra, base, size, growDirection.Positive, as);
  }
}

export {Simulator}
