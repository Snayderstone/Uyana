import { description, siteBaseUrl, title } from '$lib/data/meta';
import { blogService } from '$lib/services/public/blog.service';

export const prerender = true;

// Normalizar base URL (quitar slash final) y ayudar a construir rutas absolutas
const baseUrl = siteBaseUrl.replace(/\/+$/g, '');

function joinUrl(path: string) {
  if (!path) return baseUrl;
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

function resolveUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return joinUrl(path);
}

// Función para formatear fecha RFC 2822
function formatRFC2822(dateString: string): string {
	const date = new Date(dateString);
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	const dayName = days[date.getUTCDay()];
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = months[date.getUTCMonth()];
	const year = date.getUTCFullYear();
	const hours = String(date.getUTCHours()).padStart(2, '0');
	const minutes = String(date.getUTCMinutes()).padStart(2, '0');
	const seconds = String(date.getUTCSeconds()).padStart(2, '0');
	
	return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
}

export async function GET() {
  // Obtener todos los posts publicados desde el servicio
  const posts = await blogService.getPublishedPosts();

  const body = xml(posts);
  const headers = {
    'Cache-Control': 'max-age=0, s-maxage=3600',
    'Content-Type': 'application/xml'
  };
  return new Response(body, { headers });
}

const xml = (posts: any[]) => `
<rss version="2.0"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
	xmlns:georss="http://www.georss.org/georss"
	xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
>
  <channel>
    <atom:link href="${joinUrl('rss.xml')}" rel="self" type="application/rss+xml" />
    <title>${title}</title>
    <link>${baseUrl}</link>
    <description>${description}</description>
    <image>
      <url>${joinUrl('favicons/favicon-32x32.png')}</url>
      <title>${title}</title>
      <link>${siteBaseUrl}</link>
      <width>32</width>
      <height>32</height>
    </image>
    ${posts
    .map(
      (post) => `
        <item>
          <guid>${joinUrl('blog/' + post.slug)}</guid>
          <title>${post.titulo}</title>
          <description>${post.resumen}</description>
          <link>${joinUrl('blog/' + post.slug)}</link>
          <pubDate>${formatRFC2822(post.fecha_publicacion)}</pubDate>
          ${post.etiquetas ? post.etiquetas.map((tag: any) => `<category>${tag.nombre}</category>`).join('') : ''}
          <content:encoded><![CDATA[
            <div style="margin: 50px 0; font-style: italic;">
              If anything looks wrong, 
              <strong>
                <a href="${joinUrl('blog/' + post.slug)}">
                  read on the site!
                </a>
              </strong>
            </div>
          ]]></content:encoded>
          ${post.imagen_portada ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${resolveUrl(post.imagen_portada)}"/>` : ''}
          ${post.imagen_portada ? `<media:content xmlns:media="http://search.yahoo.com/mrss/" medium="image" url="${resolveUrl(post.imagen_portada)}"/>` : ''}          
        </item>
      `
    )
    .join('')}
  </channel>
</rss>`;