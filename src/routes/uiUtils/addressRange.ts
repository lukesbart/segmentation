const addressRange = (stop: number, step: number) =>
        Array.from({ length: (stop - 0) / step + 1 }, (_, i) => 0 + i * step);

export {addressRange}