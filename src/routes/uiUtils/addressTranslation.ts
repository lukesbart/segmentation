const translateAddressToDecimal = (addressTranslationInput: string) => {
    const prefix = addressTranslationInput.slice(0, 2);
    const number = addressTranslationInput.slice(2);

    if (prefix === '0b') {
        return parseInt(number, 2)
    }

    return parseInt(addressTranslationInput);
}

const translateToBase = (addressInput: number, base: number) => {
    const translatedAddress = addressInput.toString(base);

    if (base === 2) {
        return '0b' + translatedAddress;
    } else if (base === 16) {
        return '0x' + translatedAddress;
    }

    return translatedAddress;
}

export {translateAddressToDecimal, translateToBase}