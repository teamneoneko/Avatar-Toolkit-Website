class VersionSelector {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentDownloadUrl = null;
    }

    initializeElements() {
        this.officialSelector = document.getElementById('official-selector');
        this.backButton = document.getElementById('back-button');
        this.featureBox = document.querySelector('.feature-box');
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
        this.backButton.addEventListener('click', () => this.showFeatureBox());
        this.select.addEventListener('change', () => this.handleVersionChange());
        this.downloadButton.addEventListener('click', () => this.handleDownload());
    }

    showVersionSelector() {
        this.featureBox.style.display = 'none';
        this.versionSelector.style.display = 'block';
        this.backButton.style.display = 'block';
        this.resultContainer.style.display = 'none';
        this.loadVersions();
    }

    showFeatureBox() {
        this.featureBox.style.display = 'block';
        this.versionSelector.style.display = 'none';
        this.backButton.style.display = 'none';
    }

    async loadVersions() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
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
            this.showError('Failed to load version data');
        } finally {
            loadingDiv.remove();
        }
    }

    populateVersionSelect(dataArray, files) {
        this.select.innerHTML = '<option value="">Select Blender Version</option>';
        
        dataArray.forEach((data, index) => {
            const option = document.createElement('option');
            option.value = files[index];
            option.textContent = `Blender ${data.version}`;
            this.select.appendChild(option);
        });

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
            this.resultContainer.style.display = 'none';
            return;
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
        this.select.parentNode.appendChild(loadingDiv);

        try {
            const response = await fetch(`https://raw.githubusercontent.com/teamneoneko/Avatar-Toolkit-Website/main/data/BlenderVersions/${selectedFile}`);
            const data = await response.json();

            // Update version information
            this.latestVersion.textContent = data.version;
            this.developmentStatus.textContent = data.developmentStatus;
            this.releaseDate.textContent = data.releaseDate;
            this.eolDate.textContent = data.eolDate;
            this.description.innerHTML = data.description;

            // Update download button
            this.currentDownloadUrl = data.downloadLink;

            // Update links
            ['github', 'wiki', 'discord', 'archive'].forEach(type => {
                const link = document.getElementById(`${type}-link`);
                if (link) {
                    const url = data[`${type}Link`];
                    link.href = url || '#';
                    link.style.display = url ? 'flex' : 'none';
                }
            });

            // Show/hide unsupported message
            const unsupportedMessage = document.getElementById('unsupported-message');
            if (unsupportedMessage) {
                unsupportedMessage.style.display = data.wikiLink || data.discordLink ? 'none' : 'block';
            }

            this.resultContainer.style.display = 'block';
            this.animateResults();

        } catch (error) {
            console.error('Error loading version details:', error);
            this.showError('Failed to load version details');
        } finally {
            loadingDiv.remove();
        }
    }

    animateResults() {
        this.resultContainer.style.opacity = '0';
        requestAnimationFrame(() => {
            this.resultContainer.style.opacity = '1';
            this.resultContainer.style.transition = 'opacity 0.3s ease';
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.select.parentNode.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
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
