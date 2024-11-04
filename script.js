function initTheme() {
    // Check for saved preference first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        return;
    }
    
    // Otherwise use system preference - this is the default behavior!
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// Initialize theme
initTheme();

// Add event listener once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const generateBtn = document.getElementById('generateBtn');
    const projectDescription = document.getElementById('projectDescription');
    const errorToast = document.getElementById('errorToast');
    const errorMessage = errorToast.querySelector('.error-message');

    // Close toast on click
    errorToast.querySelector('.close-toast').addEventListener('click', () => {
        errorToast.classList.remove('show');
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorToast.classList.add('show');
        setTimeout(() => errorToast.classList.remove('show'), 5000);
    }

    function showPreview(template) {
        const previewContainer = document.getElementById('previewContainer');
        const previewContent = previewContainer.querySelector('.preview-content');
        
        // Ensure elements exist
        if (!previewContainer || !previewContent) {
            console.error('Preview elements not found');
            return;
        }
        
        // Update content and show preview
        previewContent.textContent = template.slice(0, 500) + (template.length > 500 ? '...' : '');
        previewContainer.style.display = 'block';
        
        // Setup preview click handler
        const previewCard = previewContainer.querySelector('.preview-card');
        if (previewCard) {
            previewCard.onclick = () => showModal(template);
        }
        
        // Trigger animation
        requestAnimationFrame(() => {
            previewContainer.style.opacity = '1';
            previewContainer.style.transform = 'translateY(0)';
        });
    }

    function highlightMarkdown(text) {
        return text
            // Escape HTML first
            .replace(/[&<>'"]/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[char]))
            // Headers
            .replace(/^(#{1,6}\s.*$)/gm, '<span class="heading">$1</span>')
            // Code blocks
            .replace(/```(.+?)\n([\s\S]*?)```/g, '<span class="code-block">```$1\n$2```</span>')
            // Inline code
            .replace(/`([^`]+)`/g, '<span class="code">`$1`</span>')
            // Lists
            .replace(/^(\s*[-*+]\s.*$)/gm, '<span class="list-item">$1</span>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<span class="link">[$1]($2)</span>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
            // Italic
            .replace(/\*(.*?)\*/g, '<span class="italic">$1</span>');
    }

    function showModal(template) {
        const modal = document.getElementById('templateModal');
        const codeElement = modal.querySelector('.template-code');
        
        if (!modal || !codeElement) {
            console.error('Modal elements not found');
            return;
        }
        
        // Apply syntax highlighting
        codeElement.innerHTML = highlightMarkdown(template);
        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    const ENCOURAGING_MESSAGES = [
        "Analyzing your project requirements...",
        "Crafting custom instructions...",
        "Optimizing for clarity...",
        "Adding best practices...",
        "Fine-tuning the template...",
        "Almost ready for review...",
        "Polishing the final details...",
        "Getting everything perfect...",
        "Worth the wait, promise! ✨",
        "Making it extra special...",
    ];

    function updateGenerationStatus() {
        const container = document.querySelector('.generator-container');
        const statusText = document.querySelector('.status-text');
        const statusSecondary = document.querySelector('.status-secondary');
        const progressFill = document.querySelector('.progress-fill');
        
        let progress = 0;
        let messageIndex = 0;
        let slowdown = false;

        const updateProgress = () => {
            if (slowdown) {
                progress += 0.2;
            } else if (progress > 85) {
                progress += 0.3;
                slowdown = true;
            } else {
                progress += 1.5;
            }
            
            progressFill.style.width = `${Math.min(progress, 98)}%`;
        };

        const updateMessage = () => {
            messageIndex = (messageIndex + 1) % ENCOURAGING_MESSAGES.length;
            statusSecondary.textContent = ENCOURAGING_MESSAGES[messageIndex];
            statusSecondary.style.opacity = 0;
            requestAnimationFrame(() => {
                statusSecondary.style.opacity = 0.7;
            });
        };

        const progressInterval = setInterval(updateProgress, 150);
        const messageInterval = setInterval(updateMessage, 3000);

        // Initial message
        statusSecondary.textContent = ENCOURAGING_MESSAGES[0];

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
            progressFill.style.width = '100%';
            container.classList.remove('generating');
        };
    }

    async function generateTemplate() {
        const container = document.querySelector('.generator-container');
        const description = projectDescription.value.trim();
        
        if (!description) {
            showError('Please describe your project first');
            return;
        }

        try {
            container.classList.add('generating');
            const cleanup = updateGenerationStatus();
            
            const response = await fetch('http://localhost:3000/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDescription: description })
            });

            cleanup();

            if (!response.ok) {
                throw new Error('Failed to generate template');
            }

            const data = await response.json();
            showPreview(data.template);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Failed to generate template. Please try again.');
        } finally {
            container.classList.remove('generating');
        }
    }

    // Handle button click
    generateBtn.addEventListener('click', generateTemplate);

    // Handle Cmd+Enter / Ctrl+Enter
    projectDescription.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            generateTemplate();
        }
    });

    // Add copy to clipboard functionality
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(templateOutput.textContent);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        }
    });

    // Auto-grow textarea
    projectDescription.addEventListener('input', () => {
        projectDescription.style.height = 'auto';
        projectDescription.style.height = Math.min(
            Math.max(projectDescription.scrollHeight, 80),
            200
        ) + 'px';
    });
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {  // Only if no manual preference
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});

function initModal() {
    const modal = document.getElementById('templateModal');
    const overlay = modal.querySelector('.modal-overlay');

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
}

// Call this when DOM is loaded
document.addEventListener('DOMContentLoaded', initModal);
