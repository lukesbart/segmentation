<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
<title>Segmentation Simulator</title>

<script lang="ts"> 
import {Simulator} from './sim.mjs'
import Segment from './segment.svelte'

// Change the value whenever an error occurs in the table,
// multiplying it by -1 is an arbitary value that keeps this counter from getting to a high value, 
// with {#key} it rerenders the table inputs and sets them back to correct values
let resetSizeorBase = 1;
let resetLengthInput = 1;

const sim = new Simulator();

sim.createNewDefaultAddressSpace();

console.log(sim.pas);

let currentAddressSpace = 0;

// Redefine function in sim to handle null
// Can only change one of these at a time, expect other parameters to be null
function editSegment(newSize: string | null, newBase: string | null, newGrowDirection: string | null, segmentIndex: number) {
    let editedSegment = sim.pas.addressSpaceList[currentAddressSpace].segmentList[segmentIndex];

    if (newSize) {
        let newSizeVal = parseInt(newSize)

        try {
            sim.editSegment(editedSegment, editedSegment.base, newSizeVal);
        } catch (e: any) {
            resetSizeorBase *= -1;

            displayError(e.message)
            return;
        }
    }

    if (newBase) {
        let newBaseVal = parseInt(newBase);

        try {
            sim.editSegment(editedSegment, newBaseVal, editedSegment.size)
        } catch (e: any) {
            resetSizeorBase *= -1
            
            displayError(e.message)
            return;
        }
    }

    if (newGrowDirection) {
        let newGrowDirectionVal = parseInt(newGrowDirection)
        sim.editSegmentGrowDirection(editedSegment, newGrowDirectionVal);
    }

    sim.pas = sim.pas    
}

let errorMessage = "";

function displayError(error: string) {
    errorMessage = error;
    console.log("You called")
    setTimeout(() => {
            errorMessage = "";
    }, 2000)
}

function deleteAddressSpace() {
    sim.deleteVirtualAddressSpace(sim.pas.addressSpaceList[currentAddressSpace]);
    sim.pas = sim.pas
    currentAddressSpace = 0;
}

function createNewAddressSpace() {
    sim.createNewBlankAddressSpace();
    
    sim.pas = sim.pas;

    currentAddressSpace = sim.pas.addressSpaceList.length - 1;
}

// Enables checks to prevent app from breaking when addressSpaceList is empty
$: pasEmpty = sim.pas.addressSpaceList.length === 0;

let addressTranslationValue: number

let addressTranslationBase = 10;

function translateAddress(currentAddressSpace, addressTranslationVal, base) {
    let segment = sim.addressInSegment(currentAddressSpace, addressTranslationValue);

    if (segment === "Segmentation Fault") {
        return segment;
    }
    
    let translation = (segment.base - segment.vaBase) + addressTranslationVal;

    if (addressTranslationBase === 10) {
        return translation;
    }

    if (addressTranslationBase === 2) {
        return translation.toString(base).padStart(12, '0')+"b"
    }

    return "0x" + translation.toString(base).toUpperCase()
}

$: addressTranslationResult = addressTranslationValue !== undefined && addressTranslationValue !== null && !pasEmpty ? sim.translateVirtualToPhysicalAddress(currentAddressSpace, addressTranslationValue) : null
$: virtualAddressToPhysical = addressTranslationValue !== undefined && addressTranslationValue !== null ? translateAddress(currentAddressSpace, addressTranslationValue, addressTranslationBase) : null
$: virtualAddressToPhysicalDecimal = addressTranslationValue !== undefined && addressTranslationValue !== null ? translateAddress(currentAddressSpace, addressTranslationValue, 10) : null;

let animation = "";

function animateDirection(direction: string) {
    let animateStyle = "slide"
    let duration = "animate__faster"

    if (direction === "left") {
        animation = `animate__animated animate__${animateStyle}InLeft ${duration}`
    } else {
        animation = `animate__animated animate__${animateStyle}InRight ${duration}`
    }

    setTimeout(() => {
        animation = "";
    }, 500)
}

function changePALength(newPALength) {
    try {
        sim.editPaLength(newPALength)
        sim.pas = sim.pas
    } catch (e) {
        resetLengthInput *= -1
        displayError(e.message);
    }
}

function changeVALength(newVaLength) {
    try {
        sim.editVaLength(newVaLength)
        sim.pas = sim.pas
    } catch (e) {
        resetLengthInput *= -1
        displayError(e.message)
    }
}

const paRange = (stop: number, step: number) =>
        Array.from({ length: (stop - 0) / step + 1 }, (_, i) => 0 + i * step);

let buildName = "";
let builds = [];
function saveBuild() {
    builds = JSON.parse(localStorage.getItem('builds')) ?? builds;

    builds.push({name: buildName, build: sim.toJSON()});

    let buildsOBJ = JSON.stringify(builds)

    localStorage.setItem('builds', buildsOBJ);
    console.log(sim.toJSON())
}

// When changing builds set all tracking variables to 0
function buildFromJson(jsonBuild: string) {
    try {
        const newBuild = sim.createBuild(jsonBuild);
        currentAddressSpace = 0;
        sim.pas = newBuild;
    } catch(e: any) {
        displayError(e.message)
    }
}

let jsonOutput = ""

function outputBuild() {
    console.log(sim.toJSON())
    jsonOutput = sim.toJSON()
}

let storedBuilds = [];
function getLocalStorageItems() {
    try {
        let getBuilds = JSON.parse(localStorage.getItem('builds'))
        getBuilds.forEach(build => {
            console.log(build.build)
            storedBuilds.push(build)
        })
    } catch(e) {
        console.log(e.message)
    }
}

getLocalStorageItems()

function setBuildFromMemory(buildName) {
    // Get index of build for now
    let buildIndx: number;

    for (let i = 0; i < storedBuilds.length; i++) {
        if (storedBuilds[i].name === buildName) {
            buildIndx = i;
            addressTranslationValue = null;
        }
    }

    buildFromJson(storedBuilds[buildIndx]["build"])
}
</script>

<h1 class="text-center text-5xl">Segmentation Simulator</h1>

<div style="display: flex; width: 100%;">
    <div style="margin-right: 50%">
        <label for="translateVA">Address Translation:</label><input type="number" bind:value={addressTranslationValue} id="translateVA" disabled={sim.pas.addressSpaceList.length === 0} class="bg-gray-900 w-20" min="0">
        <select name="" id="" bind:value={addressTranslationBase}>
            <option value="{10}" selected>Dec</option>
            <option value="{16}">Hex</option>
            <option value="{2}">Bin</option>
        </select>
        <br>
        <p>Segment: {addressTranslationResult !== null ? addressTranslationResult : 'N/A'}</p>   
        <p>Physical: {virtualAddressToPhysical !== null ? virtualAddressToPhysical : 'N/A'}</p>
        <p>Explicit: <span class="text-pink-500">{addressTranslationResult !== null && addressTranslationResult !== "Segmentation Fault" ? Simulator.segmentType[addressTranslationResult.toLowerCase()].number.toString(2).padStart(2, '0') : ""}</span>{addressTranslationValue && addressTranslationResult !== "Segmentation Fault" ? (addressTranslationValue - sim.pas.addressSpaceList[currentAddressSpace].segmentList[Simulator.segmentType[addressTranslationResult.toLowerCase()].number].vaBase).toString(2).padStart(sim.pas.vaLength-2, '0') : "N/A"}</p>
        <br> 
    </div>
    <div style="position: relative; right: 0; text-align: right; display: inline-block;">
        {#key resetLengthInput}
            <label for="">PA Length</label>
            <input type="number" value={sim.pas.paLength} on:change={(e) => changePALength(e.target.value)} class="bg-gray-900">
            <br>
            <label for="">VA Length</label>
            <input type="number" value={sim.pas.vaLength} on:change={(e) => changeVALength(e.target.value)} class="bg-gray-900">
        {/key}
    </div>
</div>

<p style="color: red; text-align: center;">{errorMessage}</p>

<p style="text-align: center;" class="text-xl">Virtual Address Space {currentAddressSpace}</p>
<div style="color: white;" class="w-screen h-28 bg-gray-800 select-none">
    <div class="absolute border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/2 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-3/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute right-2 border-l h-20 border-solid border-gray-400 z-0"></div>
    {#if addressTranslationValue && virtualAddressToPhysical !== "Segmentation Fault"}<div class="absolute border-l-4 h-20 border-solid border-teal-300 z-20" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%;"></div>{/if}
    {#if addressTranslationValue && virtualAddressToPhysical === "Segmentation Fault"}<div class="absolute border-l-4 h-20 border-solid border-x-rose-600 z-20" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%"></div>{/if}
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
        {#each paRange(sim.pas.vaSize, sim.pas.vaSize/4) as num}
            {#if num < sim.pas.vaSize}
                <span style="left: {(num/sim.pas.vaSize)*100}%; position: absolute; margin: 0; padding: 0;">{num}</span>
            {:else}
                <span style="right: 0; position: absolute; padding: 0;">{num}</span>
            {/if}
        {/each}
        {#if addressTranslationResult && addressTranslationResult !== "Segmentation Fault"}<p class="text-teal-300 inline-block absolute" style="left: {(addressTranslationValue/sim.pas.vaSize)*100}%;">{addressTranslationValue}</p>{/if}
    </div>
</div>

<div style="text-align: center;">
    <button on:click={() => {currentAddressSpace--; animateDirection("left")}} disabled={currentAddressSpace === 0 || pasEmpty} class="p-2 enabled:bg-red-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Previous Address Space</button>
    <button on:click={() => {currentAddressSpace++; animateDirection("right")}} disabled={currentAddressSpace === sim.pas.addressSpaceList.length - 1 || pasEmpty} class="p-2 enabled:bg-blue-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Next Address Space</button>
</div>

<div style="display: flex; justify-content: center;">
    <table class="text-center">
        <thead>
            <tr class="bg-gray-900">
                <th>Name</th>
                <th>Number</th>
                <th>Base</th>
                <th>Size</th>
                <th>Bounds</th>
                <th>Direction</th>
            </tr>
        </thead>
        <tbody class="bg-gray-800">
            {#if !pasEmpty}
                {#each sim.pas.addressSpaceList[currentAddressSpace].segmentList as segment}
                    <tr>
                        <td>{segment.type.name}</td>
                        <td class="text-center">{segment.type.number.toString(2).padStart(2, '0')}</td>
                        {#key resetSizeorBase}
                            <td><input type="number" value={segment.base} on:change={(e) => editSegment(null, e.target.value, null, sim.pas.addressSpaceList[currentAddressSpace].segmentList.indexOf(segment))} class="w-24 bg-gray-900"></td>
                            <td><input type="number" value={segment.size} on:change={(e) => editSegment(e.target.value, null, null, sim.pas.addressSpaceList[currentAddressSpace].segmentList.indexOf(segment))} class="w-24 bg-gray-900"></td>
                        {/key}
                        <td>{segment.bounds}</td>
                        <td>
                            <select name="" id="" value={segment.growDirection} on:change={(e) => editSegment(null, null, e.target.value, sim.pas.addressSpaceList[currentAddressSpace].segmentList.indexOf(segment))}>
                                <option value={Simulator.growDirection.Positive}>Positive</option>
                                <option value={Simulator.growDirection.Negative}>Negative</option>
                            </select>
                        </td>
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>

<div style="text-align: center;">
    <p>Physical Memory is {Math.ceil(sim.pas.getPercentFull()*100)}% Full</p>  
    <br>
    <button on:click={() => deleteAddressSpace()} disabled={pasEmpty} class="enabled:bg-red-600 disabled:bg-gray-600 rounded-md">Delete Address Space</button>
    <button on:click={() => createNewAddressSpace()} disabled={sim.pas.maxAddressSpaces === sim.pas.addressSpaceList.length} class="enabled:bg-blue-600 disabled:bg-gray-600 rounded-md">New Address Space</button>
</div>

<p style="text-align: center;">Physical Address Space</p>
<div style="width: 100%; color: white;" class="bg-gray-800 h-28 text-blue-100 select-none px-1">
    <div class="absolute border-l h-20 border-solid border-gray-400 w-1 z-0"></div>
    <div class="absolute left-125 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-375 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-1/2 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-625 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-3/4 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute left-875 border-l h-20 border-solid border-gray-400 z-0"></div>
    <div class="absolute right-2 border-l h-20 border-solid border-gray-400 z-0"></div>
    {#if virtualAddressToPhysical && virtualAddressToPhysical !== "Segmentation Fault"}<div class="absolute border-l-4 h-20 border-solid border-teal-300 z-20" style="left: {(virtualAddressToPhysicalDecimal/sim.pas.paSize)*100}%;"></div>{/if}
    

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
        {#each paRange(sim.pas.paSize, sim.pas.paSize/8) as num}
            {#if num < sim.pas.paSize}
                <span style="left: {(num/sim.pas.paSize)*100}%; position: absolute; margin: 0; padding: 0;">{num}</span>
            {:else}
                <span style="right: 0; position: absolute; padding: 0;">{num}</span>
            {/if}
        {/each}
        {#if virtualAddressToPhysical && virtualAddressToPhysical !== "Segmentation Fault"}<p class="text-teal-300 inline-block absolute z-10" style="left: {(virtualAddressToPhysicalDecimal/sim.pas.paSize)*100}%;">{virtualAddressToPhysical}</p>{/if}
    </div>  
</div>



<br><br>
<div class="text-center">
    <h2 class="text-3xl text-center">Simulation Presets</h2>
    <br>
    {#each storedBuilds as build}
        <button on:click={() => setBuildFromMemory(build.name)} class="bg-green-900 p-2 rounded-md mr-2">{build.name}</button>
    {/each}
    <br><br>
    <input type="text" placeholder="Build name" bind:value={buildName} class="bg-gray-800">
    <button on:click={() => saveBuild()} class="bg-blue-900 p-2 rounded-md">Save Build</button>
    <button on:click={() => outputBuild()} class="bg-cyan-900 p-2 rounded-md">Output Build</button>

    <br><br>

    <form on:submit|preventDefault={(e) => buildFromJson(e.target[0].value)}>
        <textarea rows="20" cols="80" id="jsonInput" name="jsonInput" value={jsonOutput} class="border-2 border-black bg-gray-600" />
        <br>
        <button type="submit" class="bg-cyan-900 p-2 w-30 h-10 rounded-md">Submit JSON</button>
    </form>
</div>

<style>
    select {
        @apply bg-gray-800;
    }

    input, button, select { 
        @apply p-2;
    }
</style>