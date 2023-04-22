// Helper functions

// Credit: lodash baseInRange function
function inRange(number, start, end) {
  return number >= Math.min(start, end) && number <= Math.max(start, end)
}

// Since segment size changes affects both PA and VA, the changes should be validated calling class methods of both before making changes

class PhysicalAddressSpace {
  constructor(paLength, vaLength) {
    this.paLength = paLength;
    this.paSize = 2 ** paLength;

    this.vaLength = vaLength;
    this.vaSize = 2 ** vaLength;

    this.segmentList = [];
    this.maxAddressSpaces = (this.paLength - this.vaLength) === 0 ? 1 : (this.paLength - this.vaLength) * 2;

    this.addressSpaceList = [];

    // Keep track of vasId to ensure unique vas names
    this.vasId = 0;
  }

  // Fails check where growDirection is negative
  validSegmentCreationOrChange(segment, newBase, newSize) {
    // Segment can't be bigger than its share of the virtual address space
    if (newSize > (this.vaSize / 4)) {
      return false;
    }

    // Using for i loop to avoid having to keep a separate valid tracking variable
    for (let i = 0; i < this.segmentList.length; i++) {
      if (this.segmentList[i] === segment) {
        continue;
      }

      // Segments can't be created in overlapping space
      if ((inRange(newBase, this.segmentList[i].base, this.segmentList[i].bounds) || inRange(newBase + newSize, this.segmentList[i].base, this.segmentList[i].bounds)) && this.segmentList[i].size > 0) {
        return false;
      }
    }
  
    return true;
  }

  addNewVAS(vas) {
    if (this.addressSpaceList.length < this.maxAddressSpaces) {
      vas.vaLength = this.vaLength;
      vas.size = this.vaSize;
      vas.id = this.vasId++;
      this.addressSpaceList.push(vas);
    } else {
      throw new Error("Too many virtual address spaces");
    }
  }

  editVaLength(newVaLength) {
    let vaSize = 2 ** newVaLength;

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

  editPaLength(newPaLength) {  
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
  constructor() {
    // All three set when VAS is added to PAS
    this.vaLength = 0;
    this.size = 0;
    // Used to keep track of segments in visualization
    this.id;

    this.segmentList = [];
  }
 
  // When creating a new segment, the new segment's VABase won't be known because that would be given to it
  validSegmentCreationOrChange(segment, newSize) {
    if (newSize > this.size / 4) {
      return false;
    }

    // Seeing if virtual address space already has this type of segment and whether it is the current segment or not
    if(!this.segmentList.indexOf(segment) === -1 && this.segmentList[this.segmentList.indexOf(segment)] !== segment) {
      return false;
    }


    // Should not be passing in newVABase because that is assigned by the VirtualAddressSpace
    if (newSize > (this.size / 4)) {
      return false;
    }

    return true;
  }

  // Place segment works with growDirection incorrectly
  placeSegment(segment) {
    if (segment.type === segmentType.code) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (1/4);
      } else {
        segment.vaBase = 0;
      }
    }

    if (segment.type === segmentType.heap) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (1/2);
      } else {
        segment.vaBase = this.size * (1/4);
      }
    }

    if (segment.type === segmentType.stack) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size * (3/4);
      } else {
        segment.vaBase = this.size * (1/2);
      }
    }
    
    if (segment.type === segmentType.extra) {
      if (segment.growDirection === growDirection.Negative) {
        segment.vaBase = this.size;
      } else {
        segment.vaBase = this.size * (3/4);
      }
    }

    if (segment.growDirection === growDirection.Positive) {
      segment.vaBounds = segment.vaBase + segment.size;
    } else {
      segment.vaBounds = segment.vaBase - segment.size;
    }

  }

  addNewSegment(segment) {
    this.placeSegment(segment);
    this.segmentList.push(segment);
  }

  editSegment(segment, segmentIndex) {
    // To reuse addNewSegment function create copy of segment and delete in array
    // let editedSegment = segment;
    //
    // this.segmentList.splice(this.segmentList.indexOf(segment), 0);
    //
    // this.addNewSegment(editedSegment);

    this.placeSegment(segment);
    this.segmentList[segmentIndex] = segment;

  }

  editSegmentGrowDirection(segment, segmentIndex, growDirection) {
    this.placeSegment(segment);
    this.segmentList[segmentIndex] = segment;
  }

  addressInSegment(virtualAddress) {
    for (let i = 0; i < this.segmentList.length; i++) {
      if (inRange(virtualAddress, this.segmentList[i].vaBase, this.segmentList[i].vaBounds)) {
        return this.segmentList[i];
      }
    }

    return "Segmentation Fault";
  }

  translateVirtualToPhysicalAddress(virtualAddress) {
    const segmentFound = this.addressInSegment(virtualAddress);

    if (segmentFound === "Segmentation Fault") {
      return "Segmentation Fault"
    } else {
      return segmentFound.type.name
    }
  }

  // explicitAddress()
}

const segmentType = {
  code: {
    name: 'Code',
    number: 0,
  },
  heap: {
    name: 'Heap',
    number: 1,
  },
  stack: {
    name: 'Stack',
    number: 2
  },
  extra: {
    name: 'Extra',
    number: 3
  }
};

const implicitActions = {
  fetchInstruction: segmentType.code,
  fetchStackPointer: segmentType.stack,
  fetchValue: segmentType.heap,
  extra: segmentType.extra
};

const growDirection = {
  Positive: 1,
  Negative: -1
};

class Segment {
  constructor(type, base, size, growDirection)  {
    this.type = type;
    this.size = size;

    // Physical Address Space Information
    this.base = base;
    this.bounds = this.base + this.size*growDirection - 1;
    
    // Virtual Address Space Information
    this.vaBase = 0;
    this.vaBounds = 0;

    this.growDirection = growDirection;
  }
}

export default {PhysicalAddressSpace, VirtualAddressSpace, Segment, segmentType, implicitActions, growDirection}
