<script lang="ts">
    import { addressRange } from "../uiUtils/addressRange";
    import Segment from "../segment.svelte";
    import type { Simulator } from "../sim";

    export let virtualAddressToPhysical: number | string;
    export let addressTranslationValue: number | null;
    export let sim: InstanceType<typeof Simulator>
    export let pasEmpty: boolean;
    export let currentAddressSpace: number;
    export let animation: String;
    export let addressTranslationResult: number | string;
    export let addressTranslationBase: number;
</script>

<p class="text-xl text-center mb-2">Virtual Address Space {currentAddressSpace}</p>
<div class="w-screen h-28 bg-gray-800 select-none text-white">
    <div class="absolute border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/2 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-3/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute right-2 border-l h-20 border-solid border-gray-400 z-0"></div>
    {#if addressTranslationValue && virtualAddressToPhysical !== "Segmentation Fault" && addressTranslationValue > 0}<div class="absolute border-l-4 h-20 border-solid border-teal-300 z-20" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%;"></div>{/if}
    {#if addressTranslationValue && virtualAddressToPhysical === "Segmentation Fault" && addressTranslationValue > 0}<div class="absolute border-l-4 h-20 border-solid border-x-rose-600 z-20" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%"></div>{/if}
    <div class="flex {animation}">
        <div class="h-20"></div>

        {#if !pasEmpty}
            {#each sim.pas.addressSpaceList[currentAddressSpace].segmentList as segment}
                {#if segment.size > 0}
                    <Segment segmentGrowDirection={segment.growDirection} segmentName={segment.type.name[0]}  segmentWidth={segment.size / sim.pas.vaSize} segmentPosition={segment.vaBase / sim.pas.vaSize} active={false}/>
                {/if}
            {/each}
        {/if}
    </div>

    <div class="text-blue-50 w-full mt-2">
        {#each addressRange(sim.pas.vaSize, sim.pas.vaSize/4) as num}
            {#if num < sim.pas.vaSize}
                <span style="left: {(num/sim.pas.vaSize)*100}%; position: absolute; margin: 0; padding: 0;">{num}</span>
            {:else}
                <span style="right: 0; position: absolute; padding: 0;">{num}</span>
            {/if}
        {/each}
        {#if addressTranslationResult && addressTranslationResult !== "Segmentation Fault" && addressTranslationValue > 0}<p class="text-teal-300 inline-block absolute" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%;">{addressTranslationBase === 16 ? "0x" : ""}{addressTranslationBase === 2 ? addressTranslationValue?.toString(addressTranslationBase).padStart(sim.pas.vaLength, '0') : addressTranslationValue?.toString(addressTranslationBase).toUpperCase()}</p>{/if}
        <!-- {#if addressTranslationResult && addressTranslationResult !== "Segmentation Fault" && addressTranslationValue > 0}<p class="text-teal-300 inline-block absolute" style="left: {addressIndicatorPosition()}%;">{addressTranslationBase === 16 ? "0x" : ""}{addressTranslationBase === 2 ? addressTranslationValue?.toString(addressTranslationBase).padStart(sim.pas.vaLength, '0') : addressTranslationValue?.toString(addressTranslationBase).toUpperCase()}</p>{/if} -->
    </div>
</div>