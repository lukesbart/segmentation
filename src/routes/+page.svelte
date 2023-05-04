<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
<title>Segmentation Simulator</title>

<script lang="ts"> 
import {base} from '$app/paths'

import {Simulator} from './sim'
import PhysicalAddressSpace from './components/PhysicalAddressSpace.svelte';
import VirtualAddressSpace from './components/VirtualAddressSpace.svelte';
import { translateAddressToDecimal, translateToBase } from './uiUtils/addressTranslation';
import growDirection from './constants/growDirection';

import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'
import { onMount } from 'svelte';


let notyf: InstanceType<typeof Notyf>;
onMount(() => {
    notyf = new Notyf({
        duration: 2000
    })
})

function displayError(message: string) {
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
function editSegment(newSize: string | null, newBase: string | null, newGrowDirection: string | null, segmentIndex: number): void {
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

function deleteAddressSpace(): void {
    sim.deleteVirtualAddressSpace(sim.pas.addressSpaceList[currentAddressSpace]);
    sim.pas = sim.pas
    currentAddressSpace = 0;
}

function createNewAddressSpace(): void {
    sim.createNewBlankAddressSpace();
    
    sim.pas = sim.pas;

    currentAddressSpace = sim.pas.addressSpaceList.length - 1;
}

function changePALength(newPALength: number): void {
    try {
        sim.editPaLength(newPALength)
        sim.pas = sim.pas
    } catch (e: any) {
        resetLengthInput *= -1
        displayError(e.message);
    }
}

function changeVALength(newVaLength: number): void {
    try {
        sim.editVaLength(newVaLength)
        sim.pas = sim.pas
    } catch (e: any) {
        resetLengthInput *= -1
        displayError(e.message)
    }
}

// let currentSegmentNumber: string;
// let currentSegmentOffset: string;

// Enables checks to prevent app from breaking when addressSpaceList is empty
$: pasEmpty = sim.pas.addressSpaceList.length === 0;

let addressInputValue:  string

let addressTranslationBase = 10;

// Logic that should be moved into sim
function translateAddress(currentAddressSpace: number, addressTranslationVal: number): number | null {
    if(addressTranslationVal < 0) {
        return null;
    }

    let translatedAddress = sim.translateVirtualAddressToPhysicalAddress(currentAddressSpace, addressTranslationVal)

    return translatedAddress;
}

function calculateSegmentOffset(): string {
    if (currentSegment!.growDirection === growDirection.Negative) {
        // With a negative growth segment, the offset is calculated from the max bounds of the segment
        return Math.abs( (sim.pas.vaSize*((currentSegment!.type.number)/4)) - addressTranslationValue!).toString(2).padStart(sim.pas.vaLength - 2, '0');
    }
    
    return Math.abs((addressTranslationValue! - currentSegment!.vaBase)).toString(2).padStart(sim.pas.vaLength - 2, '0');
}

$: addressTranslationValue = addressInputValue !== undefined && addressInputValue !== null ? translateAddressToDecimal(addressInputValue) : null;
$: vasIndicatorText = addressTranslationValue !== null ? translateToBase(addressTranslationValue, addressTranslationBase) : null;

$: physicalAddressTranslationDecimalValue = addressTranslationValue !== null ? translateAddress(currentAddressSpace, addressTranslationValue) : null
$: pasIndicatorText = physicalAddressTranslationDecimalValue !== null ? translateToBase(physicalAddressTranslationDecimalValue, addressTranslationBase) : null;

$: currentSegment = addressTranslationValue !== null ? sim.addressInSegment(currentAddressSpace, addressTranslationValue) : null;
$: currentSegmentNumber = currentSegment !== null ? currentSegment.type.number.toString(2).padStart(2, '0') : null;
$: currentSegmentOffset = currentSegment !== null && addressTranslationValue !== null ? calculateSegmentOffset() : null;

$: addressTranslationResult = addressTranslationValue !== undefined && addressTranslationValue !== null && !pasEmpty ? sim.segmentNameFromVirtualAddress(currentAddressSpace, addressTranslationValue) : null

// Temporary workaronud addressTranslationResult being null doesn't indicate segmentation fault
$: segmentationFault = addressInputValue !== undefined && addressInputValue !== "" && addressInputValue !== null && addressTranslationValue !== null && sim.segmentNameFromVirtualAddress(currentAddressSpace, addressTranslationValue) === null ? true : false; 

$: virtualAddressToPhysical = addressTranslationValue !== undefined && addressTranslationValue !== null ? translateAddress(currentAddressSpace, addressTranslationValue) : null
$: virtualAddressToPhysicalDecimal = addressTranslationValue !== undefined && addressTranslationValue !== null ? translateAddress(currentAddressSpace, addressTranslationValue) : null;

let animation = "";

function animateDirection(direction: string): void {
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
let builds: Array<{[key: string]: string}> = [];
function saveBuild(): void {
    // Does not work, push to json.parse does not work as a function
    let localStorageBuilds = JSON.parse(localStorage.getItem('builds') || '{}') ?? {};

    Object.entries(localStorageBuilds).forEach((buildObj: any) => {
        builds.push({name: buildObj[1].name, build: buildObj[1].build});
    })

    builds.push({name: buildName, build: sim.toJSON()});

    let buildsOBJ = JSON.stringify(builds)

    localStorage.setItem('builds', buildsOBJ);
    // console.log(sim.toJSON())
}

// When changing builds set all tracking variables to 0
function buildFromJson(jsonBuild: string): void {
    try {
        const newBuild = sim.createBuild(jsonBuild);
        currentAddressSpace = 0;
        sim.pas = newBuild;
    } catch(e: any) {
        displayError(e.message)
    }
}

let jsonOutput = ""

function outputBuild(): void {
    // console.log(sim.toJSON())
    jsonOutput = sim.toJSON()
}

let storedBuilds: Array<{[key: string]: string}> = [];
function getLocalStorageItems(): void {
    try {
        let getBuilds = JSON.parse(localStorage.getItem('builds') || '{}')
        // getBuilds.forEach((build: {[key: string]: string}) => {
        //     // console.log(build.build)
        //     // storedBuilds.push(build)
        //     // console.log(build);
        //     storedBuilds.push({name: build.name, build: build.build})
        // })

        Object.entries(getBuilds).forEach((buildObj: any) => {
            // const [key, value] = buildObj;
            // console.log(`${key} ${value}`)
            // console.log(buildObj[1].name)
            storedBuilds.push({name: buildObj[1].name, build: buildObj[1].build})
        })
    } catch(e: any) {
        // displayError(e.message)
        console.log(e.message)
    }
}

if (typeof localStorage !== undefined) {
    getLocalStorageItems()
}

function setBuildFromMemory(buildName: string): void {
    // Get index of build for now
   if (!confirm("Are you sure you want to switch presets?")) {
        return;
   }

    let buildIndx: number | undefined;

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

function deleteBuild(buildName: string): void {
    if (!confirm(`Are you sure you want to delete ${buildName}?`)) {
        return;
    }

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

<div class="grid grid-cols-2 w-full mt-4">
    <div>

        <label for="addr_translation">Address Translation:</label>
        <input id="addr_translation" type="text" class="bg-gray-700 p-2 rounded-md" bind:value={addressInputValue}>

        <label for="base">To:</label>
        <select name="" id="base" class="bg-gray-800 p-2 rounded-md" bind:value={addressTranslationBase}>
            <option value="{10}">Dec</option>
            <option value="{16}">Hex</option>
            <option value="{2}">Bin</option>
        </select>

        <p>
            Segment: 
            {#if !segmentationFault}
                {addressTranslationResult !== null ? addressTranslationResult : 'N/A'}
            {:else}
                Segmentation Fault
            {/if}

        </p>

        <div class="grid grid-cols-2 w-full">
            <p class="grid-cols-1">Physical: {pasIndicatorText !== null ? pasIndicatorText : 'N/A'}</p>
            <p class="grid-cols-1">Explicit: <span class="text-pink-500">{currentSegmentNumber !== null ? currentSegmentNumber : ""}</span> <span class="ml-2">{currentSegmentOffset !== null ? currentSegmentOffset : "N/A"}</span></p>
    </div>
    </div>

    <div class="text-right">
        {#key resetLengthInput}
            <div class="mr-10">
                <label for="">PA Length (Bits):</label>
                <input type="text" class="bg-gray-700 p-2 rounded-md" value={sim.pas.paLength} on:change={(e) => changePALength(parseInt(e.target.value))}>
            </div>
            <div class="mr-10 mt-2">
                <label for=""> VA Length (Bits):</label>
                <input type="text" class="bg-gray-700 p-2 rounded-md" value={sim.pas.vaLength} on:change={(e) => changeVALength(parseInt(e.target.value))}>
            </div>
        {/key}
    </div>

</div>

<VirtualAddressSpace currentSegment={currentSegment} addressTranslationValue={addressTranslationValue} sim={sim} pasEmpty={pasEmpty} currentAddressSpace={currentAddressSpace} animation={animation} vasIndicatorText={vasIndicatorText}/>

<!-- <div style="text-align: center;">
    <button on:click={() => {currentAddressSpace--; animateDirection("left")}} disabled={currentAddressSpace === 0 || pasEmpty} class="p-2 enabled:bg-red-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Previous Address Space</button>
    <button on:click={() => {currentAddressSpace++; animateDirection("right")}} disabled={currentAddressSpace === sim.pas.addressSpaceList.length - 1 || pasEmpty} class="p-2 enabled:bg-blue-600 disabled:bg-gray-600 rounded-md mt-2 text-blue-50">Next Address Space</button>
</div> -->

<div class="flex justify-center items-center mt-1">
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
                        <td>{segment.bounds >= 0 && segment.size > 0 ?  segment.bounds : 'N/A'}</td>
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

<div class="text-center mt-4 mb-3">
    <button on:click={() => deleteAddressSpace()} disabled={pasEmpty} class="enabled:bg-red-600 disabled:bg-gray-600 rounded-md">Delete Address Space</button>
    <button on:click={() => createNewAddressSpace()} disabled={sim.pas.getPercentFull() === 1} class="enabled:bg-blue-600 disabled:bg-gray-600 rounded-md">New Address Space</button> 
</div>

<PhysicalAddressSpace virtualAddressToPhysical={virtualAddressToPhysical} pasIndicatorText={pasIndicatorText} virtualAddressToPhysicalDecimal={virtualAddressToPhysicalDecimal} addressTranslationValue={addressTranslationValue} sim={sim} pasEmpty={pasEmpty} bind:currentAddressSpace={currentAddressSpace} percentFull={Math.ceil(sim.pas.getPercentFull()*100)} />

<br><br>
<div class="text-center">
    <h2 class="text-3xl text-center">Simulation Presets</h2>
    <br>
    {#each storedBuilds as build}
        <button on:click={() => setBuildFromMemory(build.name)} class="bg-green-800 p-2 rounded-md">{build.name}</button>
        <button on:click={() => deleteBuild(build.name)} class="bg-red-700 p-2 rounded-md mr-2"><i class="bi-trash text-white"></i></button>
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

    .text-input {
        @apply bg-gray-700 rounded-md;
    }
</style>