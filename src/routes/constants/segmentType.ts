import type { ISegmentType } from "../interfaces/ISegmentType";

const segmentType: {[key: string]: ISegmentType} = {
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
}

export default segmentType