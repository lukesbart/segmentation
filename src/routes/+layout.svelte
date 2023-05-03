<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.4/font/bootstrap-icons.css">

<script>
    import { base } from "$app/paths";
    import "../app.css"
</script>

<nav class="flex w-full bg-gray-800 p-4">
    <div class="w-2/6">
        <h1 class="text-xl"><a href="{base}/">Segmentation Simulator</a></h1>
    </div>
    <div class="text-right w-4/6">
        <div>
            <a class="inline-block mr-2" href="{base}/">Simulator</a>
            <a class="inline-block mr-2" href="{base}/about_segmentation">Concept</a>
            <a class="inline-block" href="{base}/about_architecture">Architecture</a>
        </div>
    </div>
</nav>

<slot />
