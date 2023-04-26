<script lang="ts">
    export let segmentGrowDirection: number;
    export let segmentName: string;
    export let segmentWidth: number;
    export let segmentPosition: number;
    export let active: boolean;

    $:borderStyle = active ? "border-4 border-sky-300"  : "border-2 border-sky-50/80";
    $:positionStyle = segmentGrowDirection === 1 ? `left: ${segmentPosition*100}` : `right: ${(1-segmentPosition)*100}`;
    $:backgroundStyle = segmentGrowDirection === 1 ? "bg-blue-600" : "bg-red-600";
</script>

<div class="inline-block z-10 absolute cursor-pointer" style="{positionStyle}%; width: {segmentWidth*100}%;">
    <div class="text-blue-50 {backgroundStyle} h-20 rounded-md text-center border-solid {borderStyle} flex items-center justify-center hover:ring-2 hover:ring-white hover:ring-offset-0">
        <span class="inline=block text-2xl {active ? "font-normal" : "font-thin"}">{segmentName}</span>
    </div>
</div>