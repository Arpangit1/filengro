/*
 * Filengro.in - Static Site Blog Builder (SSG)
 * Description: Fetches posts from Blogger feed, generates pre-rendered article pages,
 *              compiles the local blog database, and updates sitemap.xml.
 */

var https = require('https');
var fs = require('fs');
var path = require('path');

var feedUrl = 'https://Filengro2026.blogspot.com/feeds/posts/default?alt=json';
var templatePath = path.join(__dirname, 'blog-template.html');
var dbPath = path.join(__dirname, 'js', 'blog-database.js');
var sitemapPath = path.join(__dirname, 'sitemap.xml');

// Helper: Format Date
function formatDate(dateStr) {
  try {
    var date = new Date(dateStr);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  } catch (e) {
    return dateStr;
  }
}

// Helper: Create Excerpt from HTML
function makeExcerpt(htmlStr) {
  if (!htmlStr) return '';
  var clean = htmlStr.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  clean = clean.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  clean = clean.replace(/<[^>]+>/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();
  if (clean.length > 150) {
    return clean.substring(0, 150) + '...';
  }
  return clean || 'Read full details in the publication.';
}

// Helper: Calculate Read Time
function calculateReadTime(htmlStr) {
  var clean = htmlStr.replace(/<[^>]+>/g, ' ');
  var words = clean.trim().split(/\s+/).length || 1;
  var wpm = 200;
  var time = Math.ceil(words / wpm);
  return time + ' min read';
}

// Helper: Extract Post Image
function getPostImage(entry) {
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    return entry.media$thumbnail.url.replace(/\/s72-c\//, '/w640/');
  }
  if (entry.content && entry.content.$t) {
    var match = entry.content.$t.match(/<img[^>]+src="([^">]+)"/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return '';
}

// Helper: Extract Blogger Alternate Link
function getBloggerLink(entry) {
  if (entry.link) {
    for (var i = 0; i < entry.link.length; i++) {
      if (entry.link[i].rel === 'alternate') {
        return entry.link[i].href;
      }
    }
  }
  return '#';
}

// Helper: Extract Slug from Blogger URL
function getSlug(bloggerUrl) {
  if (!bloggerUrl || bloggerUrl === '#') {
    return 'article-' + Math.floor(Math.random() * 100000);
  }
  var filename = bloggerUrl.substring(bloggerUrl.lastIndexOf('/') + 1);
  return filename.replace('.html', '').toLowerCase();
}

// Extract Numeric Post ID from Blogger ID URL
function getPostId(entry) {
  var rawId = entry.id.$t;
  var parts = rawId.split('-');
  return parts[parts.length - 1];
}

// Main logic
function processFeed(data) {
  console.log('Processing feed entries...');
  var entries = data.feed.entry || [];
  
  if (!fs.existsSync(templatePath)) {
    console.error('Error: blog-template.html template not found at ' + templatePath);
    return;
  }
  
  var template = fs.readFileSync(templatePath, 'utf8');
  var posts = [];

  // Parse and build post models
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var id = getPostId(entry);
    var title = entry.title ? entry.title.$t : 'Untitled Post';
    var date = entry.published ? entry.published.$t : '';
    var content = entry.content ? entry.content.$t : '';
    var category = entry.category && entry.category.length > 0 ? entry.category[0].term : 'Compliance';
    var excerpt = makeExcerpt(content);
    var readTime = calculateReadTime(content);
    var image = getPostImage(entry);
    var bloggerLink = getBloggerLink(entry);
    var slug = getSlug(bloggerLink);

    posts.push({
      id: id,
      title: title,
      date: date,
      content: content,
      category: category,
      excerpt: excerpt,
      readTime: readTime,
      image: image,
      bloggerLink: bloggerLink,
      slug: slug
    });
  }

  console.log('Parsed ' + posts.length + ' articles.');

  // Create blog output directories
  if (!fs.existsSync(path.join(__dirname, 'blog'))) {
    fs.mkdirSync(path.join(__dirname, 'blog'));
    console.log('Created blog/ directory.');
  }

  // Pre-render individual article files
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var postDir = path.join(__dirname, 'blog', post.slug);
    
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir);
    }

    // Generate Sidebar recent links relative to current page
    var sidebarHtml = '';
    var otherPosts = posts.filter(function(p) { return p.id !== post.id; }).slice(0, 5);
    for (var j = 0; j < otherPosts.length; j++) {
      var op = otherPosts[j];
      sidebarHtml += '<li><a href="../' + op.slug + '/index.html"><span>' + op.title + '</span><i class="fa-solid fa-chevron-right" style="font-size: 0.75rem;"></i></a></li>\n';
    }
    if (otherPosts.length === 0) {
      sidebarHtml = '<li style="padding: 0.5rem; color: var(--neutral-muted);">No other recent articles.</li>';
    }

    // Featured image block
    var imgHtml = '';
    if (post.image) {
      imgHtml = '<div id="articleFeaturedImage" style="margin-bottom: 2rem; border-radius: var(--border-radius-md); overflow: hidden;"><img src="' + post.image + '" alt="' + post.title + '" style="width: 100%; max-height: 400px; object-fit: cover; display: block;"></div>';
    }

    // JSON-LD Structured Data Schema Markup
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "image": post.image || "https://Filengro.in/images/default-blog.png",
      "datePublished": post.date,
      "dateModified": post.date,
      "author": {
        "@type": "Organization",
        "name": "Filengro",
        "url": "https://Filengro.in"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Filengro",
        "logo": {
          "@type": "ImageObject",
          "url": "https://Filengro.in/images/logo.png"
        }
      },
      "description": post.excerpt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://Filengro.in/blog/" + post.slug + "/"
      }
    };
    var schemaMarkup = '<script type="application/ld+json">\n' + JSON.stringify(schema, null, 2) + '\n</script>';

    // Build replacement map
    var pageHtml = template
      .replace(/\{\{META_TITLE\}\}/g, post.title + ' | Filengro.in')
      .replace(/\{\{META_DESCRIPTION\}\}/g, post.excerpt)
      .replace(/\{\{META_KEYWORDS\}\}/g, post.category + ', business compliance, India')
      .replace(/\{\{CANONICAL_URL\}\}/g, 'https://Filengro.in/blog/' + post.slug + '/')
      .replace(/\{\{POST_IMAGE\}\}/g, post.image || 'https://Filengro.in/images/default-blog.png')
      .replace(/\{\{SCHEMA_MARKUP\}\}/g, schemaMarkup)
      .replace(/\{\{ROOT_PATH\}\}/g, '../../')
      .replace(/\{\{POST_CATEGORY\}\}/g, post.category)
      .replace(/\{\{URL_ENCODED_CATEGORY\}\}/g, encodeURIComponent(post.category))
      .replace(/\{\{POST_TITLE\}\}/g, post.title)
      .replace(/\{\{POST_DATE\}\}/g, formatDate(post.date))
      .replace(/\{\{POST_READ_TIME\}\}/g, post.readTime)
      .replace(/\{\{POST_FEATURED_IMAGE\}\}/g, imgHtml)
      .replace(/\{\{POST_BODY\}\}/g, post.content)
      .replace(/\{\{RECENT_POSTS_SIDEBAR\}\}/g, sidebarHtml);

    fs.writeFileSync(path.join(postDir, 'index.html'), pageHtml, 'utf8');
    console.log('Generated: blog/' + post.slug + '/index.html');
  }

  // Compile js/blog-database.js
  var dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }
  
  // Format posts metadata for database (excluding heavy content body to keep DB lightweight)
  var dbPosts = posts.map(function(p) {
    return {
      id: p.id,
      title: p.title,
      date: p.date,
      category: p.category,
      excerpt: p.excerpt,
      readTime: p.readTime,
      image: p.image,
      slug: p.slug
    };
  });
  
  var dbContent = '// Automatically generated by build-blog.js. Do not edit.\n';
  dbContent += 'const BLOG_POSTS_DB = ' + JSON.stringify(dbPosts, null, 2) + ';\n';
  fs.writeFileSync(dbPath, dbContent, 'utf8');
  console.log('Compiled local database: js/blog-database.js');

  // Generate sitemap.xml
  var sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Static root pages list
  var staticPages = [
    '',
    'index.html',
    'about.html',
    'contact.html',
    'services.html',
    'partner-with-us.html',
    'privacy-policy.html',
    'terms-conditions.html',
    'disclaimer.html',
    'blog.html',
    'company-registration.html',
    'dsc-registration.html',
    'epf-esi-compliance.html',
    'fssai-license.html',
    'gst-registration.html',
    'iec-registration.html',
    'iso-certification.html',
    'labour-license.html',
    'msme-registration.html',
    'payroll-services.html',
    'psara-license.html',
    'shop-establishment.html',
    'trade-license.html',
    'trademark-registration.html',
    'website-designing.html',
    'automation-tools.html',
    'seo-digital-marketing.html',
    'our-work.html',
    'testimonials.html'
  ];
  
  for (var k = 0; k < staticPages.length; k++) {
    var sp = staticPages[k];
    sitemapContent += '  <url>\n';
    sitemapContent += '    <loc>https://Filengro.in/' + sp + '</loc>\n';
    sitemapContent += '    <changefreq>weekly</changefreq>\n';
    sitemapContent += '    <priority>' + (sp === '' || sp === 'index.html' ? '1.0' : '0.8') + '</priority>\n';
    sitemapContent += '  </url>\n';
  }
  
  // Add dynamic blog posts to sitemap
  for (var m = 0; m < posts.length; m++) {
    var p = posts[m];
    sitemapContent += '  <url>\n';
    sitemapContent += '    <loc>https://Filengro.in/blog/' + p.slug + '/</loc>\n';
    sitemapContent += '    <lastmod>' + p.date.split('T')[0] + '</lastmod>\n';
    sitemapContent += '    <changefreq>monthly</changefreq>\n';
    sitemapContent += '    <priority>0.7</priority>\n';
    sitemapContent += '  </url>\n';
  }
  
  sitemapContent += '</urlset>\n';
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('Generated: sitemap.xml');
  console.log('Build completed successfully.');
}

console.log('Downloading feed content from: ' + feedUrl);
https.get(feedUrl, function(response) {
  if (response.statusCode !== 200) {
    console.error('Request failed. Status Code: ' + response.statusCode);
    response.resume();
    return;
  }
  var rawData = '';
  response.on('data', function(chunk) {
    rawData += chunk;
  });
  response.on('end', function() {
    try {
      var data = JSON.parse(rawData);
      processFeed(data);
    } catch (e) {
      console.error('Error parsing feed JSON: ' + e.message);
    }
  });
}).on('error', function(e) {
  console.error('HTTP Request error: ' + e.message);
});
