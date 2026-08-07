/*
 * Filengro.in - Blogger Feed Integration (CORS-Safe JSONP Version)
 * Brand: Filengro
 * Description: Dynamic fetch of articles from Blogger JSON feed using JSONP.
 *              Supports homepage previews, directory listing, and dedicated article detail view.
 *              Loads from static database js/blog-database.js if compiled for fast load and offline-compatible.
 */

document.addEventListener('DOMContentLoaded', () => {
  const feedBaseUrl = 'https://Filengro2026.blogspot.com/feeds/posts/default';
  const feedUrl = feedBaseUrl + '?alt=json';
  const jsonpFeedUrl = feedBaseUrl + '?alt=json-in-script&max-results=50&callback=processBloggerFeed';


  // Section selectors
  const blogsGrid = document.getElementById('blogsGrid');
  const homepageBlogSection = document.getElementById('homepageBlogSection');
  const articleContentSection = document.getElementById('articleContentSection');
  
  // Blog directory page elements
  const filterContainer = document.getElementById('blogFilterContainer');
  const loadingState = document.getElementById('blogLoadingState');
  const emptyState = document.getElementById('blogEmptyState');
  const errorState = document.getElementById('blogErrorState');
  const searchInput = document.getElementById('blogSearchInput');
  const searchBtn = document.getElementById('blogSearchBtn');

  // Dedicated article page template elements (used for article.html fallback rendering)
  const articleMainGrid = document.getElementById('articleMainGrid');
  const articleLoadingState = document.getElementById('articleLoadingState');
  const articleErrorState = document.getElementById('articleErrorState');
  const articleTitle = document.getElementById('articleTitle');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  const articleCategory = document.getElementById('articleCategory');
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  const articleDate = document.getElementById('articleDate');
  const articleReadTime = document.getElementById('articleReadTime');
  const articleFeaturedImage = document.getElementById('articleFeaturedImage');
  const articleBody = document.getElementById('articleBody');
  const recentPostsList = document.getElementById('recentPostsList');

  let posts = [];
  let jsonpTimeout = null;

  // Helper: Format Date (en-IN)
  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateStr;
    }
  };

  // Helper: Create Excerpt from HTML
  const makeExcerpt = (htmlStr) => {
    if (!htmlStr) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlStr;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 150) {
      return cleanText.substring(0, 150) + '...';
    }
    return cleanText || 'Read full details in the publication.';
  };

  // Helper: Calculate Read Time
  const calculateReadTime = (htmlStr) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlStr || '';
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim().split(/\s+/).length || 1;
    const wpm = 200;
    const time = Math.ceil(words / wpm);
    return `${time} min read`;
  };

  // Helper: Extract Post Image
  const getPostImage = (entry) => {
    if (entry.media$thumbnail && entry.media$thumbnail.url) {
      return entry.media$thumbnail.url.replace(/\/s72-c\//, '/w640/');
    }
    if (entry.content && entry.content.$t) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = entry.content.$t;
      const img = tempDiv.querySelector('img');
      if (img && img.src) {
        return img.src;
      }
    }
    return null;
  };

  // Helper: Extract Blogger Alternate Link
  const getBloggerLink = (entry) => {
    if (entry.link) {
      const altLink = entry.link.find(l => l.rel === 'alternate');
      return altLink ? altLink.href : '#';
    }
    return '#';
  };

  // Helper: Extract Slug from Blogger URL
  const getSlug = (bloggerUrl) => {
    if (!bloggerUrl || bloggerUrl === '#') {
      return 'article-' + Math.floor(Math.random() * 100000);
    }
    const filename = bloggerUrl.substring(bloggerUrl.lastIndexOf('/') + 1);
    return filename.replace('.html', '').toLowerCase();
  };

  // Extract Numeric Post ID from Blogger ID URL
  const getPostId = (entry) => {
    const rawId = entry.id.$t;
    const parts = rawId.split('-');
    return parts[parts.length - 1]; // Return the final numeric id
  };

  // Render cards grid on Directory page / Home page
  const renderGrid = (filteredPosts) => {
    if (!blogsGrid) return;
    blogsGrid.innerHTML = '';

    if (filteredPosts.length === 0) {
      blogsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--neutral-muted);">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 1rem; color: var(--neutral-border);"></i>
          <h3>No Match Found</h3>
          <p>We couldn't find any articles matching your search query.</p>
        </div>
      `;
      return;
    }

    filteredPosts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'blog-card fade-in-section';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      
      const imageHTML = post.image 
        ? `<img src="${post.image}" alt="${post.title}" style="width:100%; height:100%; object-fit:cover;">`
        : `<div class="blog-img-placeholder">${post.category.toUpperCase()}</div>`;

      // Link directly to pre-built static article pages (works offline / file://)
      const articleUrl = `blog/${post.slug}/index.html`;

      card.innerHTML = `
        <div class="blog-img-box">
          ${imageHTML}
          <span class="blog-category-badge">${post.category}</span>
        </div>
        <div class="blog-card-content">
          <div class="blog-meta">
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(post.date)}</span>
            <span><i class="fa-regular fa-clock"></i> ${post.readTime}</span>
          </div>
          <h3 style="font-size: 1.2rem; line-height: 1.4; margin-bottom: 1rem; color: var(--primary-dark); font-weight: 700;">${post.title}</h3>
          <p>${post.excerpt}</p>
          <a href="${articleUrl}" class="blog-read-more">
            Read Full Article <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      `;

      blogsGrid.appendChild(card);
    });
  };

  // Render full article on article.html detail template (fallback mode only)
  const renderArticle = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeId = urlParams.get('id');

    if (!activeId) {
      showArticleError();
      return;
    }

    const activePost = posts.find(p => p.id === activeId);

    if (!activePost) {
      showArticleError();
      return;
    }

    // Populate SEO and titles
    document.title = `${activePost.title} | Filengro.in`;
    articleTitle.textContent = activePost.title;
    breadcrumbTitle.textContent = activePost.title;
    
    // Category mapping
    articleCategory.textContent = activePost.category;
    breadcrumbCategory.textContent = activePost.category;
    breadcrumbCategory.parentElement.href = `blog.html?category=${encodeURIComponent(activePost.category)}`;
    
    // Metadata
    articleDate.textContent = formatDate(activePost.date);
    articleReadTime.textContent = activePost.readTime;
    
    // Featured Image
    if (activePost.image) {
      articleFeaturedImage.innerHTML = `<img src="${activePost.image}" alt="${activePost.title}" style="width: 100%; max-height: 400px; object-fit: cover; display: block;">`;
      articleFeaturedImage.style.display = 'block';
    } else {
      articleFeaturedImage.style.display = 'none';
    }

    // Article Content
    articleBody.innerHTML = activePost.content;

    // Populate Sidebar: Other recent posts
    if (recentPostsList) {
      recentPostsList.innerHTML = '';
      const otherPosts = posts.filter(p => p.id !== activeId).slice(0, 5);

      if (otherPosts.length === 0) {
        recentPostsList.innerHTML = '<li style="padding: 0.5rem; color: var(--neutral-muted);">No other recent articles.</li>';
      } else {
        otherPosts.forEach(op => {
          const li = document.createElement('li');
          li.innerHTML = `
            <a href="blog/${op.slug}/index.html">
              <span>${op.title}</span>
              <i class="fa-solid fa-chevron-right" style="font-size: 0.75rem;"></i>
            </a>
          `;
          recentPostsList.appendChild(li);
        });
      }
    }

    // Show main grid, hide loading state
    if (articleLoadingState) articleLoadingState.style.display = 'none';
    if (articleMainGrid) articleMainGrid.style.display = 'grid';
  };

  const showArticleError = () => {
    if (articleLoadingState) articleLoadingState.style.display = 'none';
    if (articleMainGrid) articleMainGrid.style.display = 'none';
    if (articleErrorState) articleErrorState.style.display = 'block';
  };

  // Main navigation rendering logic
  const handleDisplay = () => {
    // CONTEXT A: ARTICLE DETAIL PAGE (article.html - fallback rendering)
    if (articleContentSection) {
      renderArticle();
    }
    // CONTEXT B: HOME PAGE (index.html)
    else if (homepageBlogSection) {
      if (posts.length === 0) {
        homepageBlogSection.style.display = 'none';
      } else {
        renderGrid(posts.slice(0, 3));
      }
    } 
    // CONTEXT C: BLOG DIRECTORY (blog.html)
    else {
      if (loadingState) loadingState.style.display = 'none';

      if (posts.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
      } else {
        if (filterContainer) filterContainer.style.display = 'flex';
        if (blogsGrid) blogsGrid.style.display = 'grid';
        
        // Dynamic URL Category Filtering
        const urlParams = new URLSearchParams(window.location.search);
        const catQuery = urlParams.get('category');
        if (catQuery) {
          const filtered = posts.filter(p => p.category.toLowerCase() === catQuery.toLowerCase());
          renderGrid(filtered);
          if (searchInput) searchInput.value = catQuery; // Pre-fill search input
        } else {
          renderGrid(posts);
        }
      }
    }
  };

  // Handle API load failure — fall back to static database before showing error UI
  const handleError = (error) => {
    console.error('Blogger Feed connection error:', error);

    // If live fetch failed, try the pre-compiled static database as a fallback
    if (typeof BLOG_POSTS_DB !== 'undefined' && BLOG_POSTS_DB.length > 0) {
      console.warn('Live Blogger feed unavailable. Falling back to cached static database.');
      posts = BLOG_POSTS_DB;
      handleDisplay();
      return;
    }

    // No database either — show error UI
    if (articleContentSection) {
      showArticleError();
    } else if (homepageBlogSection) {
      homepageBlogSection.style.display = 'none'; // Silent fallback on home page
    } else {
      if (loadingState) loadingState.style.display = 'none';
      if (errorState) errorState.style.display = 'block';
    }
  };

  // Global Callback for Blogger Feed (JSONP fallback load)
  window.processBloggerFeed = (data) => {
    if (jsonpTimeout) clearTimeout(jsonpTimeout);
    
    try {
      const entries = data.feed.entry || [];
      
      posts = entries.map(entry => {
        const id = getPostId(entry);
        const title = entry.title ? entry.title.$t : 'Untitled Post';
        const date = entry.published ? entry.published.$t : '';
        const content = entry.content ? entry.content.$t : '';
        const category = entry.category && entry.category.length > 0 ? entry.category[0].term : 'Compliance';
        const excerpt = makeExcerpt(content);
        const readTime = calculateReadTime(content);
        const image = getPostImage(entry);
        const bloggerLink = getBloggerLink(entry);
        const slug = getSlug(bloggerLink);

        return { id, title, date, content, category, excerpt, readTime, image, bloggerLink, slug };
      });

      handleDisplay();
    } catch (err) {
      handleError(err);
    }
  };

  // Inject Script Dynamically (JSONP — fetches live from Blogger every page load)
  const loadFeed = () => {
    const script = document.createElement('script');
    script.src = jsonpFeedUrl; // Uses pre-built URL with max-results=50
    script.async = true;

    // Timeout (10 seconds)
    jsonpTimeout = setTimeout(() => {
      handleError(new Error('Blogger API request timeout'));
    }, 10000);

    script.onerror = () => {
      if (jsonpTimeout) clearTimeout(jsonpTimeout);
      handleError(new Error('Blogger script download error'));
    };

    document.body.appendChild(script);
  };

  // Search filter logic (only on blog directory page)
  if (searchInput && searchBtn) {
    const handleSearch = () => {
      const query = searchInput.value.toLowerCase().trim();
      const filtered = posts.filter(post => {
        return post.title.toLowerCase().includes(query) ||
               post.excerpt.toLowerCase().includes(query) ||
               post.category.toLowerCase().includes(query);
      });
      renderGrid(filtered);
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleSearch();
      else if (searchInput.value === '') renderGrid(posts); // reset on empty search
    });
  }

  // Always fetch live from Blogger so new posts appear automatically.
  // If the live fetch fails or times out, handleError() will fall back to BLOG_POSTS_DB.
  console.log('Fetching live articles from Blogger feed...');
  loadFeed();
});
