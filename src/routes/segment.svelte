<script lang="ts">
    export let segmentGrowDirection: number;
    export let segmentName: string;
    export let segmentWidth: number;
    export let segmentPosition: number;
    export let active: boolean;
</script>

<div class="inline-block z-10 absolute cursor-pointer" style="{segmentGrowDirection === 1 ? "left" : "right"}:{segmentGrowDirection === 1 ? segmentPosition*100 : (1-segmentPosition)*100}%; width: {segmentWidth*100}%;">
    <div class="text-blue-50 {segmentGrowDirection === 1 ? "bg-blue-600" : "bg-red-600"} h-20 rounded-md text-center border-solid border-2 {active ? "border-cyan-300" : "border-sky-50/80"} flex items-center justify-center hover:ring-2 hover:ring-white hover:ring-offset-0">
        <span class="inline=block text-2xl {active ? "font-normal" : "font-thin"}">{segmentName}</span>
    </div>
</div>