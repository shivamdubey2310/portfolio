/* Projects page functionality - Modal and data loading */

(function () {
  // Project data mapping - file names to display
  const projectFiles = {
    'Near Real-Time CDC Lakehouse Pipeline': 'Near Real-Time CDC Lakehouse Pipeline',
    'Automated E-commerce Data Warehouse & Star Schema Design': 'Automated E-commerce Data Warehouse & Star Schema Design',
    'Automated Linux‑Native ETL (Bash, Python & PostgreSQL)': 'Automated Linux‑Native ETL (Bash, Python & PostgreSQL)',
    'Automated PokeAPI ETL Pipeline with Apache Airflow & MySQL': 'Automated PokeAPI ETL Pipeline with Apache Airflow & MySQL',
    'Automated Tech‑News ETL (PySpark & MongoDB Atlas)': 'Automated Tech‑News ETL (PySpark & MongoDB Atlas)',
    'Automated Weather Monitoring in Microsoft Fabric': 'Automated Weather Monitoring in Microsoft Fabric',
    'Containerized Web‑Scraping ETL (Airflow & PostgreSQL)': 'Containerized Web‑Scraping ETL (Airflow & PostgreSQL)',
    'End-to-End Medallion ETL Pipeline via Microsoft Fabric': 'End-to-End Medallion ETL Pipeline via Microsoft Fabric',
    'Enterprise University Management System & Relational Database Design': 'Enterprise University Management System & Relational Database Design',
    'Orchestrated NoSQL ETL Pipeline for Studio Ghibli Analytics': 'Orchestrated NoSQL ETL Pipeline for Studio Ghibli Analytics',
    'Real-Time Delta Lake Streaming Pipeline (Spark Structured Streaming)': 'Real-Time Delta Lake Streaming Pipeline (Spark Structured Streaming)',
    'Sales Analytics & Data Quality Dashboard': 'Sales Analytics & Data Quality Dashboard',
    'Scalable Spotify Hit Predictor (PySpark MLlib & Streamlit)': 'Scalable Spotify Hit Predictor (PySpark MLlib & Streamlit)',
    'Self‑Service API Data Ingestion Utility (Streamlit)': 'Self‑Service API Data Ingestion Utility (Streamlit)'
  };

  // Other Projects data mapping
  const otherProjectFiles = {
    'Python For data analysis CheatSheets': 'Python For data analysis CheatSheets',
    'Essential Bash Scripts for Data Engineers': 'Essential Bash Scripts for Data Engineers',
    'PySpark Practice case study': 'PySpark Practice case study',
    'SQL Practice Problems': 'SQL Practice Problems',
    'MongoDB Practice case study': 'MongoDB Practice case study'
  };

  const modal = document.getElementById('projectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalImg = document.getElementById('modalImg');

  if (!modal) return;

  // Parse project text content into HTML
  function parseProjectContent(text, githubUrl) {
    const lines = text.split('\n');
    let html = '';
    let inSection = false;
    let sectionTitle = '';
    let isFirstLine = true;
    let solutionIntroAdded = false;
    let solutionListStarted = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Skip the first line (project name) as it's duplicated in modal title
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }
      
      // Check for section headers
      if (trimmed === 'Overview') {
        if (inSection) html += '</div>';
        html += '<div class="projectSection"><h4 class="sectionLabel">Overview</h4>';
        inSection = true;
        sectionTitle = 'overview';
      } else if (trimmed === 'Tech Stack') {
        if (inSection) html += '</div>';
        html += '<div class="projectSection"><h4 class="sectionLabel">Tech Stack</h4><div class="techStack">';
        inSection = true;
        sectionTitle = 'techstack';
      } else if (trimmed === 'The Challenge') {
        if (sectionTitle === 'techstack') html += '</div>';
        if (inSection) html += '</div>';
        html += '<div class="projectSection"><h4 class="sectionLabel">The Challenge</h4>';
        inSection = true;
        sectionTitle = 'challenge';
      } else if (trimmed === 'The Solution') {
        if (inSection) html += '</div>';
        html += '<div class="projectSection"><h4 class="sectionLabel">The Solution</h4>';
        inSection = true;
        sectionTitle = 'solution';
        solutionIntroAdded = false;
        solutionListStarted = false;
      } else if (trimmed === 'Key Highlights') {
        if (sectionTitle === 'solution' && solutionListStarted) html += '</ul>';
        if (inSection) html += '</div>';
        html += '<div class="projectSection"><h4 class="sectionLabel">Key Highlights</h4><ul class="highlights">';
        inSection = true;
        sectionTitle = 'highlights';
      } else if (trimmed === 'Links' || trimmed.startsWith('Links')) {
        // Skip this section from file - we'll add GitHub link at the end
        if (sectionTitle === 'highlights') html += '</ul>';
        if (inSection) html += '</div>';
        inSection = true;
        sectionTitle = 'links';
      } else if (sectionTitle === 'techstack') {
        // Tech stack items (format: "- Label: Value")
        if (trimmed.startsWith('-')) {
          const content = trimmed.replace(/^-\s*/, '');
          if (content.includes(':')) {
            const colonIndex = content.indexOf(':');
            const label = content.substring(0, colonIndex).trim();
            const value = content.substring(colonIndex + 1).trim();
            html += `<div class="techItem"><span class="techLabel">${label}:</span> <span class="techValue">${value}</span></div>`;
          } else {
            html += `<div class="techItem"><span class="techValue">${content}</span></div>`;
          }
        }
      } else if (sectionTitle === 'highlights') {
        // Highlight items
        if (trimmed.startsWith('-')) {
          const content = trimmed.replace(/^-\s*/, '');
          html += `<li>${formatBoldText(content)}</li>`;
        }
      } else if (sectionTitle === 'solution') {
        // Solution items - first line is intro text, rest are bullet points with bold category
        if (trimmed.startsWith('-')) {
          const content = trimmed.replace(/^-\s*/, '');
          if (!solutionListStarted) {
            html += '<ul class="solutionList">';
            solutionListStarted = true;
          }
          // Format like Tech Stack: bold label before colon
          if (content.includes(':')) {
            const colonIndex = content.indexOf(':');
            const label = content.substring(0, colonIndex).trim();
            const value = content.substring(colonIndex + 1).trim();
            html += `<li><strong>${label}:</strong> ${value}</li>`;
          } else {
            html += `<li>${content}</li>`;
          }
        } else if (!solutionIntroAdded) {
          html += `<p>${formatBoldText(trimmed)}</p>`;
          solutionIntroAdded = true;
        }
      } else if (sectionTitle === 'links') {
        // Skip all links from file - we'll add GitHub link at the end
      } else if (sectionTitle === 'overview' && trimmed) {
        html += `<p class="oneLiner">${trimmed}</p>`;
      } else if (sectionTitle === 'challenge' && trimmed) {
        html += `<p>${formatBoldText(trimmed)}</p>`;
      }
    }

    if (sectionTitle === 'highlights') html += '</ul>';
    if (sectionTitle === 'techstack') html += '</div>';
    if (inSection && sectionTitle !== 'links') html += '</div>';

    // Add Links section with GitHub button at the end
    if (githubUrl) {
      html += `<div class="projectSection projectLinks">
        <h4 class="sectionLabel">Links</h4>
        <a href="${githubUrl}" target="_blank" rel="noopener" class="projectLink githubBtn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          View on GitHub
        </a>
      </div>`;
    }

    return html;
  }

  // Format bold text (text between ** or before :)
  function formatBoldText(text) {
    // Handle **bold** syntax
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Handle text before colon as bold (like "Feature: description")
    text = text.replace(/^([A-Za-z\s\-&]+):\s*/g, '<strong>$1:</strong> ');
    return text;
  }

  // Format links in text
  function formatLinks(text) {
    // Handle [text](url) format
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="projectLink">$1</a>');
    // Handle [text] format (placeholder links)
    text = text.replace(/\[([^\]]+)\]/g, '<span class="projectLinkPlaceholder">$1</span>');
    return text;
  }

  // Load project content from file
  async function loadProjectContent(projectName, githubUrl, isOtherProject = false) {
    try {
      const folder = isOtherProject ? 'Other_project_data' : 'Project_data';
      const response = await fetch(`./${folder}/${projectName}.txt`);
      if (!response.ok) throw new Error('Failed to load');
      const text = await response.text();
      return parseProjectContent(text, githubUrl);
    } catch (error) {
      console.error('Error loading project:', error);
      return '<p class="error">Unable to load project details.</p>';
    }
  }

  // Open modal with animation
  async function openModal(projectName, githubUrl, isOtherProject = false) {
    if (!projectName) return;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Set title with typing effect preparation
    modalTitle.textContent = projectName;

    // Set image with loading state
    modalImg.style.opacity = '0';
    modalImg.style.transform = 'scale(0.9)';
    
    const imgFolder = isOtherProject ? 'Other_project_images' : 'project_images';
    const imgSrc = `./${imgFolder}/${projectName}.png`;
    modalImg.src = imgSrc;
    modalImg.alt = `${projectName} architecture`;
    
    // Animate image on load
    modalImg.onload = () => {
      requestAnimationFrame(() => {
        modalImg.style.transition = 'opacity 400ms ease, transform 400ms ease';
        modalImg.style.opacity = '1';
        modalImg.style.transform = 'scale(1)';
      });
    };

    // Load content with loading state
    modalContent.innerHTML = '<div class="loading">Loading project details...</div>';
    const content = await loadProjectContent(projectName, githubUrl, isOtherProject);
    
    // Fade in content
    modalContent.style.opacity = '0';
    modalContent.innerHTML = content;
    requestAnimationFrame(() => {
      modalContent.style.transition = 'opacity 300ms ease';
      modalContent.style.opacity = '1';
    });
  }

  // Close modal with animation
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    // Re-enable body scroll after animation
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 350);
  }

  // Event listeners for project cards
  const projectCards = document.querySelectorAll('[data-project-card]');
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const projectName = card.getAttribute('data-project');
      const githubUrl = card.getAttribute('data-github');
      const isOtherProject = card.hasAttribute('data-other-project');
      if (projectName) {
        // Add click ripple effect
        const rect = card.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          background: rgba(73,136,196,.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 600ms ease-out;
          pointer-events: none;
          width: 100px;
          height: 100px;
          left: ${e.clientX - rect.left - 50}px;
          top: ${e.clientY - rect.top - 50}px;
        `;
        card.style.position = 'relative';
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        
        openModal(projectName, githubUrl, isOtherProject);
      }
    });

    // Keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const projectName = card.getAttribute('data-project');
        const githubUrl = card.getAttribute('data-github');
        const isOtherProject = card.hasAttribute('data-other-project');
        if (projectName) {
          openModal(projectName, githubUrl, isOtherProject);
        }
      }
    });
  });

  // Close modal events
  document.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Prevent modal content click from closing
  modal.querySelector('.modalContent').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Add ripple animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();
