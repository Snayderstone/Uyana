<script>
  export let data;
</script>

<h1>🔍 Test de conexión Supabase</h1>

<h2>Estado general:</h2>
<pre>{JSON.stringify({ supabaseConfigured: data.supabaseConfigured }, null, 2)}</pre>

<h2>Proyectos:</h2>
<pre>{JSON.stringify(data.proyectos, null, 2)}</pre>

<h2>Instituciones:</h2>
<pre>{JSON.stringify(data.instituciones, null, 2)}</pre>

<h2>Facultades:</h2>
<pre>{JSON.stringify(data.facultades, null, 2)}</pre>

<h2>Participantes:</h2>
<pre>{JSON.stringify(data.participantes, null, 2)}</pre>

<h2>Áreas de conocimiento:</h2>
<pre>{JSON.stringify(data.areas, null, 2)}</pre>

<h2>Tipos de proyecto:</h2>
<pre>{JSON.stringify(data.tipos, null, 2)}</pre>
