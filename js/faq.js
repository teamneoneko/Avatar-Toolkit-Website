document.addEventListener('DOMContentLoaded', () => {
    // Core DOM elements
    const faqContainer = document.getElementById('faq-container');
    const loadingDiv = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    const searchInput = document.getElementById('faqSearch');
    const categoriesList = document.getElementById('categoriesList');
    const versionSelect = document.getElementById('versionSelect');
    
    // Set initial version
    versionSelect.value = '0.2.1';
    const latestVersion = versionSelect.value;

    // Global data storage
    let faqData = [];
    let categoriesData = [];

    const urlParams = new URLSearchParams(window.location.search);
    const versionParam = urlParams.get('version');
    if (versionParam) {
        versionSelect.value = versionParam;
    }

    // GitHub URLs and version handling
    const getBaseUrl = (version) => `https://raw.githubusercontent.com/teamneoneko/Avatar-Toolkit-Website/main/data/wiki/${version}`;

    // Update fetchFAQData to properly use version folders
    async function fetchFAQData() {
        const version = versionSelect.value; // Gets the selected version (e.g., "0.1.0")
        const baseUrl = getBaseUrl(version);
        const categoriesUrl = `${baseUrl}/categories.json`;
        const faqBaseUrl = `${baseUrl}/faq`;

        try {
            // Get categories and FAQ file list in parallel
            const [categoriesResponse, faqFilesResponse] = await Promise.all([
                fetch(categoriesUrl),
                fetch(`${baseUrl}/faq-files.json`)
            ]);

            if (!categoriesResponse.ok || !faqFilesResponse.ok) {
                throw new Error('Failed to fetch required data');
            }

            const categoriesData = await categoriesResponse.json();
            const faqFiles = (await faqFilesResponse.json()).faqFiles;

            // Fetch all FAQ files in parallel
            const faqPromises = faqFiles.map(filename => 
                fetch(`${faqBaseUrl}/${filename}.json`)
                    .then(response => response.json())
                    .catch(error => {
                        console.warn(`Failed to load ${filename}.json:`, error);
                        return { faqs: [] };
                    })
            );

            const faqResults = await Promise.all(faqPromises);
            
            // Combine all FAQs into one array
            const combinedFaqs = faqResults.reduce((acc, result) => {
                return acc.concat(result.faqs);
            }, []);

            return {
                faqData: combinedFaqs,
                categoriesData: categoriesData.categories
            };
        } catch (error) {
            throw new Error('Failed to fetch FAQ data');
        }
    }

    // Version change handler
    versionSelect.addEventListener('change', () => {
        loadingDiv.style.display = 'block';
        faqContainer.innerHTML = '';
        searchInput.value = ''; // Clear search when switching versions
        
        fetchFAQData()
            .then(({ faqData: data, categoriesData: categories }) => {
                faqData = data;
                categoriesData = categories;
                renderFAQ(faqData, categoriesData);
                handleUrlHash();
            })
            .catch(error => {
                loadingDiv.style.display = 'none';
                errorContainer.style.display = 'block';
                errorContainer.querySelector('#errorMessage').textContent = error.message;
            });
    });

    function createSlug(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
    }

    function handleUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            const slug = hash.replace('#', '');
            const faqItem = document.querySelector(`[data-slug="${slug}"]`);
            if (faqItem) {
                const question = faqItem.querySelector('.faq-question');
                const answer = faqItem.querySelector('.faq-content');
                
                faqItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                answer.classList.remove('hidden');
                question.querySelector('.toggle-icon').textContent = '-';
            }
        }
    }
    
    function renderFAQItems(faqs, container) {
        faqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            const slug = createSlug(faq.question);
            faqItem.dataset.slug = slug;
            
            const question = document.createElement('h3');
            question.className = 'faq-question';
            question.innerHTML = `${faq.question} <span class="toggle-icon">+</span>`;
            
            const answer = document.createElement('div');
            answer.className = 'faq-content hidden markdown-content';
            const formattedContent = formatContent(faq.answer);
            
            const metadata = `
                <div class="faq-metadata">
                    <button class="version-history-btn" data-faq-id="${faq.id || ''}">
                        <span class="version-badge">v${faq.version || '1.0'}</span>
                        <span class="last-updated"><i class="fas fa-clock"></i> ${faq.lastUpdated ? new Date(faq.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                        <span class="history-icon"><i class="fas fa-history"></i></span>
                    </button>
                    <button class="copy-link-btn" data-slug="${slug}">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                </div>
            `;
            
            answer.innerHTML = formattedContent + metadata;
            
            question.addEventListener('click', () => {
                const wasHidden = answer.classList.contains('hidden');
                
                document.querySelectorAll('.faq-content').forEach(content => {
                    content.classList.add('hidden');
                    content.previousElementSibling.querySelector('.toggle-icon').textContent = '+';
                });
                
                if (wasHidden) {
                    answer.classList.remove('hidden');
                    question.querySelector('.toggle-icon').textContent = '-';
                }
            });
            
            faqItem.appendChild(question);
            faqItem.appendChild(answer);
            container.appendChild(faqItem);
        });
    }    
    
    function renderFAQ(faqData, categoriesData) {
        loadingDiv.style.display = 'none';
        faqContainer.innerHTML = '';
        categoriesList.innerHTML = '';

        // Add version banner
        const versionBanner = document.createElement('div');
        versionBanner.className = 'version-banner';
        
        const bannerText = versionSelect.value === latestVersion
            ? `This documentation covers the latest Avatar Toolkit (Version ${versionSelect.value}). If you're using an older version, please select it on the dropdown on the left`
            : `This documentation applies to Avatar Toolkit version ${versionSelect.value} which is an older version, if you're using a newer version please select it on the left hand side`;    
        
        versionBanner.innerHTML = `<i class="fas fa-info-circle"></i> ${bannerText}`;
        faqContainer.appendChild(versionBanner);
        
        // Render categories and subcategories in sidebar
        categoriesData.forEach(category => {
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'category-container';
            
            const categoryLink = document.createElement('a');
            categoryLink.href = `#${category.name.toLowerCase().replace(/\s+/g, '-')}`;
            categoryLink.className = 'category-link';
            categoryLink.innerHTML = `
                ${category.name}
                <span class="category-toggle"><i class="fas fa-chevron-down"></i></span>
            `;
            
            const subcategoryList = document.createElement('div');
            subcategoryList.className = 'subcategory-list collapsed';
            
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    const subcategoryLink = document.createElement('a');
                    subcategoryLink.href = `#${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
                    subcategoryLink.textContent = subcategory;
                    subcategoryLink.className = 'subcategory-link';
                    subcategoryList.appendChild(subcategoryLink);
                });
            }
            
            categoryLink.addEventListener('click', (e) => {
                e.preventDefault();
                subcategoryList.classList.toggle('collapsed');
                categoryLink.querySelector('.category-toggle i').classList.toggle('fa-chevron-down');
                categoryLink.querySelector('.category-toggle i').classList.toggle('fa-chevron-up');
            });
            
            categoryContainer.appendChild(categoryLink);
            categoryContainer.appendChild(subcategoryList);
            categoriesList.appendChild(categoryContainer);
        });
    
        // Render FAQ content by category and subcategory
        categoriesData.forEach(category => {
            const section = document.createElement('section');
            section.id = category.name.toLowerCase().replace(/\s+/g, '-');
            section.className = 'markdown-content';
            
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category.name;
            section.appendChild(categoryTitle);
    
            // Only render FAQs without subcategories at the category level
            const mainCategoryFAQs = faqData.filter(faq => 
                faq.category === category.name && !faq.subcategory
            );
            renderFAQItems(mainCategoryFAQs, section);
    
            // Render subcategory FAQs
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    const subcategoryFAQs = faqData.filter(faq => 
                        faq.category === category.name && 
                        faq.subcategory === subcategory
                    );
                    
                    if (subcategoryFAQs.length > 0) {
                        const subsection = document.createElement('section');
                        subsection.id = subcategory.toLowerCase().replace(/\s+/g, '-');
                        
                        const subTitle = document.createElement('h3');
                        subTitle.textContent = subcategory;
                        subsection.appendChild(subTitle);
    
                        renderFAQItems(subcategoryFAQs, subsection);
                        section.appendChild(subsection);
                    }
                });
            }
    
            if (mainCategoryFAQs.length > 0 || section.querySelectorAll('.faq-item').length > 0) {
                faqContainer.appendChild(section);
            }
        });
    }

    function formatContent(content) {
        if (content.includes('[raw-markdown]')) {
            return content
                .replace('[raw-markdown]', '')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
        }
    
        let processedContent = content;
        
        processedContent = processedContent.replace(/(\|.*\|\n?)+/g, match => {
            const rows = match.trim().split('\n');
            return '<table>' + rows.map(row => {
                const cells = row.split('|').filter(cell => cell.trim().length > 0);
                return '<tr>' + cells.map(cell => `<td>${cell.trim()}</td>`).join('') + '</tr>';
            }).join('') + '</table>';
        });
    
        processedContent = processedContent.replace(/(?:^\d+\.\s+.*(?:\n|$))+/gm, match => {
            const items = match.split('\n').filter(item => item.trim());
            return '<ol>' + items.map(item => {
                const content = item.replace(/^\d+\.\s+/, '');
                return `<li>${content}</li>`;
            }).join('') + '</ol>';
        });
    
        processedContent = processedContent.replace(/(?:^>\s*.*(?:\n|$))+/gm, match => {
            const lines = match.split('\n').filter(line => line.trim());
            const content = lines.map(line => line.replace(/^>\s*/, '')).join('<br>');
            return `<blockquote>${content}</blockquote>`;
        });
    
        return processedContent
            .replace(/\[image:(\d+):(\d+)\](.*?)\[\/image\]/g, '<img loading="lazy" src="$3" style="max-width: 100%; height: auto; object-fit: contain;" alt="FAQ Image">')
            .replace(/\[image\](.*?)\[\/image\]/g, '<img loading="lazy" src="$1" alt="FAQ Image">')
            .replace(/\[link\](.*?)\|(.*?)\[\/link\]/g, '<a href="$1">$2</a>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/^\- (.*?)$/gm, '• $1')
            .replace(/\[color:(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>')
            .replace(/\[details\]([^|]*?)\|([\s\S]*?)\[\/details\]/gs, '<details class="faq-details"><summary class="faq-summary">$1</summary><div class="faq-details-content">$2</div></details>')
            .replace(/\[info\]([\s\S]*?)\[\/info\]/gs, '<div class="info-callout">$1</div>')
            .replace(/\[warning\]([\s\S]*?)\[\/warning\]/gs, '<div class="warning-callout">$1</div>')
            .replace(/\[note\]([\s\S]*?)\[\/note\]/gs, '<div class="note-callout">$1</div>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }   

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const sections = document.querySelectorAll('.wiki-content section');
        const faqContainer = document.getElementById('faq-container');
        let totalVisibleItems = 0;
        
        if (!searchTerm) {
            renderFAQ(faqData, categoriesData);
            return;
        }
        
        faqContainer.innerHTML = '';
        categoriesData.forEach(category => {
            const categoryFAQs = faqData.filter(faq => faq.category === category.name);
            const section = document.createElement('section');
            section.id = category.name.toLowerCase().replace(/\s+/g, '-');
            section.className = 'markdown-content';
            
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category.name;
            categoryTitle.className = 'wiki-content-title';
            section.appendChild(categoryTitle);
            
            let visibleItems = 0;
            
            const categoryMatches = category.name.toLowerCase().includes(searchTerm);
            
            categoryFAQs.forEach(faq => {
                const text = `${faq.question} ${faq.answer}`.toLowerCase();
                const keywords = faq.keywords || [];
                
                const matchesText = text.includes(searchTerm);
                const matchesKeywords = keywords.some(keyword => 
                    keyword.toLowerCase().includes(searchTerm)
                );
                
                if (matchesText || matchesKeywords || categoryMatches) {
                    visibleItems++;
                    totalVisibleItems++;
                    
                    const faqItem = document.createElement('div');
                    faqItem.className = 'faq-item';
                    faqItem.dataset.keywords = faq.keywords ? faq.keywords.join(',') : '';
                    
                    const question = document.createElement('h3');
                    question.className = 'faq-question';
                    question.innerHTML = `${faq.question} <span class="toggle-icon">+</span>`;
                    
                    const answer = document.createElement('div');
                    answer.className = 'faq-content hidden markdown-content';
                    const formattedContent = formatContent(faq.answer);
                    
                    const metadata = `
                        <div class="faq-metadata">
                            <button class="version-history-btn" data-faq-id="${faq.id || ''}">
                                <span class="version-badge">v${faq.version || '1.0'}</span>
                                <span class="last-updated"><i class="fas fa-clock"></i> ${faq.lastUpdated ? new Date(faq.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                                <span class="history-icon"><i class="fas fa-history"></i></span>
                            </button>
                        </div>
                    `;                   
                    
                    answer.innerHTML = formattedContent + metadata;
                    
                    question.addEventListener('click', () => {
                        const wasHidden = answer.classList.contains('hidden');
                        
                        document.querySelectorAll('.faq-content').forEach(content => {
                            content.classList.add('hidden');
                            content.previousElementSibling.querySelector('.toggle-icon').textContent = '+';
                        });
                        
                        if (wasHidden) {
                            answer.classList.remove('hidden');
                            question.querySelector('.toggle-icon').textContent = '-';
                        }
                    });
                    
                    faqItem.appendChild(question);
                    faqItem.appendChild(answer);
                    section.appendChild(faqItem);
                }
            });
            
            if (visibleItems > 0 || categoryMatches) {
                faqContainer.appendChild(section);
            }
            
            const categoryId = section.id;
            const sidebarLink = document.querySelector(`.wiki-nav a[href="#${categoryId}"]`);
            if (sidebarLink) {
                sidebarLink.style.display = (visibleItems > 0 || categoryMatches) ? 'block' : 'none';
            }
        });
    
        if (totalVisibleItems === 0) {
            faqContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>There are no results for this search. Please try again using different keywords.</p>
                </div>
            `;
        }
    });
        
    // Version history popup handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.version-history-btn')) {
            const faqId = e.target.closest('.version-history-btn').dataset.faqId;
            const faq = faqData.find(f => f.id === parseInt(faqId));
            
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'version-history-modal';
            modal.innerHTML = `
                <h3>Version History</h3>
                ${faq.history ? faq.history.map(h => `
                    <div class="history-item">
                        <div class="history-version">Version ${h.version}</div>
                        <div class="history-date">${new Date(h.date).toLocaleDateString()}</div>
                        <div class="history-changes">${h.changes}</div>
                    </div>
                `).join('') : '<div class="history-item">No version history available</div>'}                
                <button class="close-modal">Close</button>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            
            const closeModal = () => {
                overlay.remove();
                modal.remove();
            };
            
            overlay.addEventListener('click', closeModal);
            modal.querySelector('.close-modal').addEventListener('click', closeModal);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.copy-link-btn')) {
            const slug = e.target.closest('.copy-link-btn').dataset.slug;
            const version = document.getElementById('versionSelect').value;
            const url = `${window.location.origin}${window.location.pathname}?version=${version}#${slug}`;
            
            navigator.clipboard.writeText(url).then(() => {
                const button = e.target.closest('.copy-link-btn');
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            });
        }
    });
    
    // Initialize with GitHub data
    fetchFAQData()
        .then(({ faqData: data, categoriesData: categories }) => {
            faqData = data;
            categoriesData = categories;
            console.log('Data received:', { faqData, categoriesData });
            renderFAQ(faqData, categoriesData);
            handleUrlHash();
        })
        .catch(error => {
            loadingDiv.style.display = 'none';
            errorContainer.style.display = 'block';
            errorContainer.querySelector('#errorMessage').textContent = error.message;
        });
});
