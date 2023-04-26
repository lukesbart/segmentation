// Credit: lodash baseInRange function

const inRange = (number: number, start: number, end: number) => {
    return number >= Math.min(start, end) && number <= Math.max(start, end)
}

export {inRange}