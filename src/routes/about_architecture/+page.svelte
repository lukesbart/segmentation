<script>
    import {base} from '$app/paths'
</script>

<title>About Simulator Architecture</title>

<h1 class="text-center text-5xl mb-2">About Architecture of Simulator</h1>

<div class="flex justify-center mb-2">
    <img src="{base}/simarch.png" alt="" style="height: 450px; width: 3/4">
</div>
    
<main>
    <h2 class="text-4xl text-center">Segment</h2>
    <p class="text-justify container mx-auto mb-4">Contains information about itself, information that is necessary for it to function in a Physical Address Space and a Virtual Address Space. Has one VAS and one PAS.</p>

    <h2 class="text-4xl text-center">Virtual Address Space</h2>
    <p class="text-justify container mx-auto mb-4">Contains information necessary for it to work inside of a Physical Address Space. Has methods to manage the Segments inside of it. Has one PAS and many Segments.</p>
   
    <h2 class="text-4xl text-center">Physical Address Space</h2>
    <p class="text-justify container mx-auto mb-4">Contains information necessary for it to work inside a simulator. Has methods to manage segments and address spaces within it. Has many Virtual Address Spaces and Segments. Has one Simulator</p>

    <h2 class="text-4xl text-center">Simulator</h2>
    <p class="text-justify container mx-auto mb-4">Contains method to manage Physical Address Space, Virtual Address Spaces, and Segments. Before making any changes on segments, Virtual Address Space and Physical Address Space validation functions are called. Also provides logic to manage Virtual Address Spaces and the Physical Address Space and validate changes to them. Provides methods to turn a Physical Address Space into JSON and turn JSON back into a complete Physical Address Space. Simulator contains one Physical Address Space, which is provided to the visualization client.</p>

    <h2 class="text-4xl text-center">Philosophy</h2>
    <p class="text-justify container mx-auto mb-4">Logic for simulator and presentation are kept as separate as possible. The goal of this is to allow for the simulator code to be used and expanded on independently of any view code. This was chosen to try to make the Simulator more maintainable. All that must be done to switch out the view is to render the Physical Address Space and provide ways for a user to change the Physical Address Space and things it contains with the functions given in the simulator and reflect those changes in the rendering of the Physical Address Space</p>
</main>