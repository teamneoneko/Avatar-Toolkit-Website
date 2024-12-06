class VersionSelector {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentDownloadUrl = null;
    }

    initializeElements() {
        this.officialSelector = document.getElementById('official-selector');
        this.backButton = document.getElementById('back-button');
        this.typeSelector = document.querySelector('.feature-box');
        this.versionSelector = document.querySelector('.version-selector');
        this.select = document.getElementById('blender-version-select');
        this.downloadButton = document.getElementById('download-button');
        this.latestVersion = document.getElementById('latest-version');
        this.developmentStatus = document.getElementById('development-status');
        this.releaseDate = document.getElementById('release-date');
        this.eolDate = document.getElementById('eol-date');
        this.description = document.getElementById('version-description');
        this.resultContainer = document.querySelector('.result-container');
    }    

    bindEvents() {
        this.officialSelector.addEventListener('click', () => this.showVersionSelector());
        this.backButton.addEventListener('click', () => this.showTypeSelector());
        this.select.addEventListener('change', () => this.handleVersionChange());
        this.downloadButton.addEventListener('click', () => this.handleDownload());
    }

    showVersionSelector() {
        this.typeSelector.style.display = 'none';
        this.versionSelector.style.display = 'block';
        this.backButton.style.display = 'block';
        this.resultContainer.style.display = 'none';
        this.loadVersions();
    }

    showTypeSelector() {
        this.typeSelector.style.display = 'block';
        this.versionSelector.style.display = 'none';
        this.backButton.style.display = 'none';
        this.resultContainer.style.display = 'none';
    }

    async loadVersions() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        this.select.parentNode.appendChild(loadingDiv);

        try {
            const response = await fetch('https://raw.githubusercontent.com/teamneoneko/Avatar-Toolkit-Website/main/data/BlenderVersions/versions.json');
            const files = await response.json();
            files.sort().reverse();

            const promises = files.map(file => 
                fetch(`https://raw.githubusercontent.com/teamneoneko/Avatar-Toolkit-Website/main/data/BlenderVersions/${file}`)
                    .then(response => response.json())
            );

            const dataArray = await Promise.all(promises);
            this.populateVersionSelect(dataArray, files);
        } catch (error) {
            console.error('Error loading versions:', error);
        } finally {
            loadingDiv.remove();
        }
    }

    populateVersionSelect(dataArray, files) {
        this.select.innerHTML = '<option value="">Choose your Blender version</option>';
        
        dataArray.forEach((data, index) => {
            const option = document.createElement('option');
            option.value = files[index];
            option.textContent = `Blender ${data.version}`;
            this.select.appendChild(option);
        });

        this.downloadButton.disabled = true;
        this.resetDisplayFields();
    }

    resetDisplayFields() {
        this.latestVersion.textContent = '-';
        this.developmentStatus.textContent = '-';
        this.releaseDate.textContent = '-';
        this.eolDate.textContent = '-';
        this.description.innerHTML = '';
        this.resultContainer.style.display = 'none';
    }

    async handleVersionChange() {
        const selectedFile = this.select.value;
        if (!selectedFile) {
            this.downloadButton.disabled = true;
            this.resultContainer.style.display = 'none';
            return;
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        this.select.parentNode.appendChild(loadingDiv);

        try {
            const response = await fetch(`https://raw.githubusercontent.com/teamneoneko/Avatar-Toolkit-Website/main/data/BlenderVersions/${selectedFile}`);
            const data = await response.json();

            this.latestVersion.textContent = data.latestVersion || 'N/A';
            this.developmentStatus.textContent = data.developmentStatus || 'N/A';
            this.releaseDate.textContent = data.releaseDate || 'N/A';
            this.eolDate.textContent = data.eolDate || 'N/A';
            this.description.innerHTML = data.description || '';

            const links = {
                'github-link': data.githubLink,
                'download-link': data.downloadLink,
                'wiki-link': data.wikiLink,
                'discord-link': data.discordLink,
                'archive-link': data.archiveLink
            };

            let hasSupport = false;
            Object.entries(links).forEach(([id, url]) => {
                const element = document.getElementById(id);
                if (element && url) {
                    element.href = url;
                    element.style.display = 'inline-block';
                    if (id === 'wiki-link' || id === 'discord-link') {
                        hasSupport = true;
                    }
                } else if (element) {
                    element.style.display = 'none';
                }
            });

            const unsupportedMessage = document.getElementById('unsupported-message');
            unsupportedMessage.style.display = hasSupport ? 'none' : 'block';

            this.currentDownloadUrl = data.downloadLink || null;
            this.downloadButton.disabled = !this.currentDownloadUrl;
            this.resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading version details:', error);
            this.downloadButton.disabled = true;
            this.resultContainer.style.display = 'none';
        } finally {
            loadingDiv.remove();
        }
    }

    handleDownload() {
        if (this.currentDownloadUrl) {
            window.location.href = this.currentDownloadUrl;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VersionSelector();
});
