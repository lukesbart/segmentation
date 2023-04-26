<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
<title>Segmentation Simulator</title>

<script lang="ts"> 
import {Simulator} from './sim'
import PhysicalAddressSpace from './components/PhysicalAddressSpace.svelte';
import VirtualAddressSpace from './components/VirtualAddressSpace.svelte';

import { Notyf } from 'notyf';
    import 'notyf/notyf.min.css'
    import { onMount } from 'svelte';

    let notyf: Object;
    onMount(() => {
        notyf = new Notyf({
            duration: 2000
        })
    })

    export function displayError(message: string) {
        notyf.error(message);
    }

// Change the value whenever an error occurs in the table,
// multiplying it by -1 is an arbitary value that keeps this counter from getting to a high value, 
// with {#key} it rerenders the table inputs and sets them back to correct values
let resetSizeorBase = 1;
let resetLengthInput = 1;

const sim = new Simulator();

sim.createNewDefaultAddressSpace();

let currentAddressSpace = 0;

// Core Simulator Functions

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

function changePALength(newPALength: number) {
    try {
        sim.editPaLength(newPALength)
        sim.pas = sim.pas
    } catch (e: any) {
        resetLengthInput *= -1
        displayError(e.message);
    }
}

function changeVALength(newVaLength: number) {
    try {
        sim.editVaLength(newVaLength)
        sim.pas = sim.pas
    } catch (e: any) {
        resetLengthInput *= -1
        displayError(e.message)
    }
}

let currentSegmentNumber: string;
let currentSegmentOffset: string;

// Enables checks to prevent app from breaking when addressSpaceList is empty
$: pasEmpty = sim.pas.addressSpaceList.length === 0;

let addressInputValue:  string

let addressTranslationBase = 10;
let addressInputBase = 10;

// Logic that should be moved into sim
function translateAddress(currentAddressSpace: number, addressTranslationVal: number, base: number) {
    if(addressTranslationVal < 0) {
        return "N/A";
    }

    let segment = sim.addressInSegment(currentAddressSpace, addressTranslationValue!);

    if (segment === "Segmentation Fault") {
        return segment;
    }
    
    let translation = (segment.base - segment.vaBase) + addressTranslationVal;

    [currentSegmentNumber, currentSegmentOffset] = sim.explicitAddress(segment, addressTranslationVal)

    if (base === 10) {
        return translation;
    }

    if (base === 2) {
        return translation.toString(base).padStart(12, '0')+"b"
    }

    return "0x" + translation.toString(base).toUpperCase()
}

$: addressTranslationValue = addressInputValue !== undefined && addressInputValue !== null ? parseInt(addressInputValue, addressInputBase) : null
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

let buildName = "";
let builds = [];
function saveBuild() {
    builds = JSON.parse(localStorage.getItem('builds')) ?? builds;

    builds.push({name: buildName, build: sim.toJSON()});

    let buildsOBJ = JSON.stringify(builds)

    localStorage.setItem('builds', buildsOBJ);
    // console.log(sim.toJSON())
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
    // console.log(sim.toJSON())
    jsonOutput = sim.toJSON()
}

let storedBuilds = [];
function getLocalStorageItems() {
    try {
        let getBuilds = JSON.parse(localStorage.getItem('builds'))
        getBuilds.forEach(build => {
            // console.log(build.build)
            storedBuilds.push(build)
        })
    } catch(e: any) {
        // displayError(e.message)
        console.log(e.message)
    }
}

if (typeof localStorage !== undefined) {
    getLocalStorageItems()
}

function setBuildFromMemory(buildName: string) {
    // Get index of build for now
    let buildIndx: number;

    for (let i = 0; i < storedBuilds.length; i++) {
        if (storedBuilds[i].name === buildName) {
            buildIndx = i;
            addressTranslationValue = null;
        }
    }

    if (buildIndx === undefined || buildIndx === null) {
        return displayError("Could not find build")
    }

    buildFromJson(storedBuilds[buildIndx]["build"])
}

function deleteBuild(buildName: string) {
    for (let i = 0; i < storedBuilds.length; i++) {
        if (storedBuilds[i].name === buildName) {
            storedBuilds.splice(i, 1)
            storedBuilds = storedBuilds;


            let buildsJSON = JSON.stringify(storedBuilds);
            localStorage.setItem('builds', buildsJSON)
            break;
        }
    }
}
</script>

<h1 class="text-center text-5xl">Segmentation Simulator</h1>

<div class="flex w-full">
    <div style="margin-right: 50%">
        <label for="translateVA">Address Translation:</label>
        {#if addressInputBase === 16}
            <input type="text" bind:value={addressInputValue} id="translateVA" disabled={sim.pas.addressSpaceList.length === 0} class="bg-gray-900 w-28" min="0">
        {:else}
            <input type="number" bind:value={addressInputValue} id="translateVA" disabled={sim.pas.addressSpaceList.length === 0} class="bg-gray-900 w-28" min="0">
        {/if}
        <br>
        <label for="">From:</label>
        <select name="" id="" bind:value={addressInputBase} class="rounded-md">
            <option value="{10}">Dec</option>
            <option value="{16}">Hex</option>
            <option value="{2}">Bin</option>
        </select>
        <label for="" class="ml-5">To:</label>
        <select name="" id="" bind:value={addressTranslationBase} class="mt-2 rounded-md">
            <option value="{10}" selected>Dec</option>
            <option value="{16}">Hex</option>
            <option value="{2}">Bin</option>
        </select>
        <br>
        <p>Segment: {addressTranslationResult !== null ? addressTranslationResult : 'N/A'}</p>   
        <p>Physical: {virtualAddressToPhysical !== null ? virtualAddressToPhysical : 'N/A'}</p>
        <p>Explicit: <span class="text-pink-500">{addressTranslationResult !== null && addressTranslationResult !== "Segmentation Fault" && currentSegmentNumber ? currentSegmentNumber : ""}</span>{addressTranslationValue !== null && addressTranslationValue !== undefined && addressTranslationResult !== "Segmentation Fault" && currentSegmentOffset !== null ? currentSegmentOffset : "N/A"}</p>
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

<VirtualAddressSpace virtualAddressToPhysical={virtualAddressToPhysical} addressTranslationValue={addressTranslationValue} sim={sim} pasEmpty={pasEmpty} currentAddressSpace={currentAddressSpace} animation={animation} addressTranslationResult={addressTranslationResult} addressTranslationBase={addressTranslationBase}/>

<!-- <div style="text-align: center;">
    <button on:click={() => {currentAddressSpace--; animateDirection("left")}} disabled={currentAddressSpace === 0 || pasEmpty} class="p-2 enabled:bg-red-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Previous Address Space</button>
    <button on:click={() => {currentAddressSpace++; animateDirection("right")}} disabled={currentAddressSpace === sim.pas.addressSpaceList.length - 1 || pasEmpty} class="p-2 enabled:bg-blue-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Next Address Space</button>
</div> -->

<div class="flex justify-center items-center mt-6">
    <button on:click={() => {currentAddressSpace--; animateDirection("left")}} disabled={currentAddressSpace === 0 || pasEmpty} class="p-2 enabled:bg-red-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50 h-10" title="Previous Address Space"><i class="bi bi-arrow-left-circle-fill"></i></button>
    <table class="text-center mx-2">
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
                        <td>{segment.bounds > 0 && segment.size > 0 ?  segment.bounds : 'N/A'}</td>
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
    <button on:click={() => {currentAddressSpace++; animateDirection("right")}} disabled={currentAddressSpace === sim.pas.addressSpaceList.length - 1 || pasEmpty} class="p-2 enabled:bg-blue-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50 h-10" title="Next Address Space"><i class="bi bi-arrow-right-circle-fill"></i></button>
</div>

<div class="text-center mt-4 mb-6">
    <button on:click={() => deleteAddressSpace()} disabled={pasEmpty} class="enabled:bg-red-600 disabled:bg-gray-600 rounded-md">Delete Address Space</button>
    <button on:click={() => createNewAddressSpace()} disabled={sim.pas.getPercentFull() === 1} class="enabled:bg-blue-600 disabled:bg-gray-600 rounded-md">New Address Space</button> 
</div>

<PhysicalAddressSpace virtualAddressToPhysical={virtualAddressToPhysical} virtualAddressToPhysicalDecimal={virtualAddressToPhysicalDecimal} addressTranslationValue={addressTranslationValue} sim={sim} pasEmpty={pasEmpty} bind:currentAddressSpace={currentAddressSpace} percentFull={Math.ceil(sim.pas.getPercentFull()*100)} />

<br><br>
<div class="text-center">
    <h2 class="text-3xl text-center">Simulation Presets</h2>
    <br>
    {#each storedBuilds as build}
        <button on:click={() => setBuildFromMemory(build.name)} class="bg-green-800 p-2 rounded-md">{build.name}</button>
        <button on:click={() => deleteBuild(build.name)} class="bg-red-700 p-2 rounded-md mr-2"><i class="bi-trash" style="color: white;"></i></button>
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