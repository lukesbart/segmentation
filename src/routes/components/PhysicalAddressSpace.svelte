<script lang="ts">
    import Segment from "../segment.svelte";
    import type { Simulator } from "../sim";

    import { addressRange } from "../uiUtils/addressRange";

    export let virtualAddressToPhysical: number | string;
    export let virtualAddressToPhysicalDecimal: number;
    export let addressTranslationValue: number | null;
    export let sim: InstanceType<typeof Simulator>
    export let pasEmpty: boolean;
    export let currentAddressSpace: number;
    export let percentFull: number;

</script>

<p class="text-center text-xl">Physical Address Space</p>
<p class="text-center">{percentFull}% Full</p>
<div class="bg-gray-800 h-28 text-blue-100 select-none px-1 w-full">
    <div class="absolute border-l h-20 border-solid border-gray-400 w-1 z-0"></div>
    <div class="absolute left-125 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-375 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/2 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-625 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-3/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-875 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute right-2 border-l h-20 border-solid border-gray-400 z-0"></div>
    {#if virtualAddressToPhysical && virtualAddressToPhysical !== "Segmentation Fault" && addressTranslationValue > 0}<div class="absolute border-l-4 h-20 border-solid border-teal-300 z-20" style="left: {(virtualAddressToPhysicalDecimal/sim.pas.paSize)*100}%;"></div>{/if}
    

    <div class="flex">
        <div class="h-20"></div>
        {#if !pasEmpty}
            {#each sim.pas.addressSpaceList as addressSpace}
                {#each addressSpace.segmentList as segment}
                    {#if segment.size > 0}
                        <div on:click={() => currentAddressSpace = sim.pas.addressSpaceList.indexOf(addressSpace)} on:keypress={() => {}}>
                            <Segment segmentGrowDirection={segment.growDirection} segmentName={addressSpace.id+segment.type.name[0]} segmentWidth={segment.size/sim.pas.paSize} segmentPosition={segment.base/sim.pas.paSize} active={addressSpace === sim.pas.addressSpaceList[currentAddressSpace]}/>
                        </div>
                    {/if}
                {/each}
            {/each}
        {/if}
    </div>

    <div class="mt-2">
        {#each addressRange(sim.pas.paSize, sim.pas.paSize/8) as num}
            {#if num < sim.pas.paSize}
                <span style="left: {(num/sim.pas.paSize)*100}%; position: absolute; margin: 0; padding: 0;">{num}</span>
            {:else}
                <span style="right: 0; position: absolute; padding: 0;">{num}</span>
            {/if}
        {/each}
        {#if virtualAddressToPhysical && virtualAddressToPhysical !== "Segmentation Fault" && addressTranslationValue > 0}<p class="text-teal-300 inline-block absolute z-10" style="left: {(virtualAddressToPhysicalDecimal/sim.pas.paSize)*100}%;">{virtualAddressToPhysical}</p>{/if}
    </div>  
</div>