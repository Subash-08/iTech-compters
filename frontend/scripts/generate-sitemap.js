import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://itechcomputers.shop";
const API_URL = "https://api.itechcomputers.shop/api/v1";

async function generateSitemap() {
    const urls = [];

    const staticPages = [
        "",
        "/products",
        "/blogs",
        "/about",
        "/contact",
        "/support",
        "/prebuilt-pcs",
        "/custom-pcs"
    ];

    staticPages.forEach((page) => {
        urls.push({
            loc: `${SITE_URL}${page}`,
            changefreq: "weekly",
            priority: page === "" ? 1.0 : 0.8
        });
    });

    try {
        const productsRes = await axios.get(`${API_URL}/products?limit=1000`);
        if (productsRes.data && productsRes.data.data && productsRes.data.data.products) {
            productsRes.data.data.products.forEach((p) => {
                urls.push({
                    loc: `${SITE_URL}/product/${p.slug}`,
                    changefreq: "weekly",
                    priority: 0.9,
                    lastmod: p.updatedAt || new Date().toISOString()
                });
            });
        }
    } catch (error) {
        console.error("Failed to fetch products for sitemap:", error.message);
    }

    try {
        const blogsRes = await axios.get(`${API_URL}/blogs?limit=500`);
        if (blogsRes.data && blogsRes.data.data) {
            blogsRes.data.data.forEach((b) => {
                urls.push({
                    loc: `${SITE_URL}/blog/${b.slug || b.Slug}`,
                    changefreq: "monthly",
                    priority: 0.7,
                    lastmod: b.updated_at || b.created_at || new Date().toISOString()
                });
            });
        }
    } catch (error) {
        console.error("Failed to fetch blogs for sitemap:", error.message);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
            .map(
                (u) => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`
            )
            .join("")}
</urlset>`;

    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
    console.log("✅ Sitemap generated successfully");
}

generateSitemap();
