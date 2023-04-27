import {describe, expect, it} from 'vitest';
import {Simulator} from "../src/routes/sim.js"

describe("Sim", () => {
    const sim = new Simulator();

    it("Checks to see it a PAS has been created", () => {
        expect(sim.pas).toBeDefined()
    })

    it("Edits the size of PAS", () => {
        sim.pas.editPaLength(14)

        expect(sim.pas.paLength).toBe(14)
        expect(sim.pas.paSize).toBe(2**14);
    })

    // it("Adds a new segment to sim", () => {
    //     sim.createNewSegment(Simulator.segmentType.code, 0, 256, Simulator.growDirection.Positive, )
    // })
})