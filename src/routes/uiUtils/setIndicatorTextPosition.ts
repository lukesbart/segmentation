// For use in virtual and physical address space number positioning
const setIndicatorTextPosition = (addressTranslationVal: number, asSize: number) => {
    const percent = Math.ceil(addressTranslationVal/asSize*100)
    const changeAtPercent = 97 - (asSize.toString().length - 4)

    if (percent >= changeAtPercent) {
        return `right: ${(1-(addressTranslationVal/asSize))*100}%;`
    }

    return `left: ${(addressTranslationVal/asSize)*100}%;`
}

export {setIndicatorTextPosition}