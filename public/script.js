// --- CONFIGURATION ---
const API_BASE_URL = '/api';

// 1. Render Engine Configuration
document.addEventListener("DOMContentLoaded", () => {
    // Welcome Splash Timeout Trigger
    setTimeout(() => {
        const splash = document.getElementById("welcome-splash");
        if (splash) {
            splash.classList.add("splash-hidden");
        }
    }, 2200);

    // MAGNETIC CTA BUTTON ENGINE
    const magneticButtons = document.querySelectorAll(".cta-btn");
    magneticButtons.forEach(btn => {
        btn.addEventListener("mousemove", (e) => {
            const position = btn.getBoundingClientRect();
            // Calculate cursor offset relative to the absolute center of the button shape
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            // Subtly pull the button 35% towards the cursor coordinate vector
            btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
        });
        
        btn.addEventListener("mouseleave", () => {
            // Snap back smoothly when cursor leaves tracking box boundary
            btn.style.transform = "translate(0px, 0px)";
        });
    });

    // Run display checks
    revealSections();
});

// 2. Scroll Reveal Engine & Stagger Activation
window.addEventListener("scroll", revealSections);

function revealSections() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            reveal.classList.add("active");
        }
    });

    // Handle Project Cascade Triggering when grid is in view
    const staggerCards = document.querySelectorAll(".stagger-card");
    staggerCards.forEach((card, index) => {
        const windowHeight = window.innerHeight;
        const elementTop = card.getBoundingClientRect().top;
        if (elementTop < windowHeight - 50) {
            // Apply a sequential loading delay time window to each initial card element
            setTimeout(() => {
                card.classList.add("active-render");
            }, index * 120); 
        }
    });
}

// 3. PREMIUM CANVAS PARTICLE INTERACTIVE BACKGROUND ENGINE
(function initCanvasEngine() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) {
        // Wait and retry if DOM structure isn't ready
        setTimeout(initCanvasEngine, 100);
        return;
    }
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    
    // Mouse tracking coordinate map
    let mouse = { x: null, y: null, radius: 130 };
    
    const heroSection = document.getElementById('hero');
    heroSection.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    
    heroSection.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resizeCanvas() {
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            // Collision detection check for canvas boundaries
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            
            // Mouse proximity mouse magnetic interactions
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius + this.size) {
                    if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                    if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                    if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                    if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
                }
            }
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        // Scale particle counts cleanly with viewport area metrics
        let numberOfParticles = (canvas.width * canvas.height) / 11000;
        if (numberOfParticles > 90) numberOfParticles = 90; // Limit processing footprints
        
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 0.5;
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = 'rgba(214, 175, 55, 0.4)'; // Gold hue stream mapping
            
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Connect node pathways if dots get near each other
    function connectNodes() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 110) {
                    let opacity = (1 - (distance / 110)) * 0.15;
                    ctx.strokeStyle = `rgba(214, 175, 55, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Modern 60FPS browser looping system
    function animateFrameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectNodes();
        requestAnimationFrame(animateFrameLoop);
    }

    setTimeout(() => {
        resizeCanvas();
        animateFrameLoop();
    }, 100);
})();

// --- FEATURE 0: FETCH AND RENDER PROFILE DYNAMICALLY ---
async function fetchAndRenderProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`);
        const profile = await response.json();

        // Update Hero avatar picture if uploaded in PostgreSQL/DB
        const heroAvatar = document.querySelector('.hero-avatar');
        if (heroAvatar && profile.picture_base64 && profile.picture_mime_type) {
            heroAvatar.src = `data:${profile.picture_mime_type};base64,${profile.picture_base64}`;
        }

        // Update Hero text
        const heroTextDiv = document.querySelector('.hero-text h1');
        const heroBioDiv = document.querySelector('.hero-text p');
        if (heroTextDiv && profile.hero_title) {
            heroTextDiv.innerHTML = profile.hero_title;
        }
        if (heroBioDiv && profile.hero_bio) {
            heroBioDiv.innerHTML = profile.hero_bio;
        }

        // Update Contact Phone
        const phoneLink = document.querySelector('.phone-link');
        if (phoneLink && profile.contact_phone) {
            phoneLink.href = `tel:${profile.contact_phone}`;
            phoneLink.innerText = `📞 ${profile.contact_phone}`;
        }

        // Inject Skills
        const skillsContainer = document.getElementById("skills-container");
        if (skillsContainer && profile.skills) {
            skillsContainer.innerHTML = '';
            const skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
            skills.forEach(skill => {
                const span = document.createElement("span");
                span.className = "skill-tag";
                span.innerText = skill;
                skillsContainer.appendChild(span);
            });
        }

        // Inject Hobbies
        const hobbiesContainer = document.getElementById("hobbies-container");
        if (hobbiesContainer && profile.hobbies) {
            hobbiesContainer.innerHTML = '';
            const hobbies = typeof profile.hobbies === 'string' ? JSON.parse(profile.hobbies) : profile.hobbies;
            hobbies.forEach(hobby => {
                const span = document.createElement("span");
                span.className = "skill-tag hobby-tag";
                span.innerText = hobby;
                hobbiesContainer.appendChild(span);
            });
        }
    } catch (error) {
        console.error('Could not fetch profile from local backend:', error);
    }
}


// --- FEATURE 1: FETCH AND RENDER PROJECTS DYNAMICALLY WITH CATEGORY FILTERING ---
let cachedProjectsList = [];
let currentSelectedCategory = 'All';

async function fetchAndRenderProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    const projects = await response.json();

    if (projects && Array.isArray(projects)) {
      cachedProjectsList = projects;
      renderCategoryFilterButtons(projects);
      renderFilteredProjects(currentSelectedCategory);
      revealSections();
    }
  } catch (error) {
    console.error('Could not fetch projects from local backend:', error);
  }
}

function renderCategoryFilterButtons(projects) {
    const filterBar = document.getElementById('project-filter-bar');
    if (!filterBar) return;

    // Collect all unique tags across projects
    const tagCounts = { 'All': projects.length };
    
    projects.forEach(proj => {
        let tags = [];
        try { 
            tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []); 
        } catch(e) {}
        
        tags.forEach(t => {
            if (!t) return;
            const cleanedTag = t.trim();
            if (cleanedTag) {
                tagCounts[cleanedTag] = (tagCounts[cleanedTag] || 0) + 1;
            }
        });
    });

    filterBar.innerHTML = '';

    Object.keys(tagCounts).forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `filter-btn ${cat === currentSelectedCategory ? 'active' : ''}`;
        btn.innerHTML = `${cat === 'All' ? '🌐 All' : '#' + cat} <span class="filter-count">${tagCounts[cat]}</span>`;

        btn.addEventListener('click', () => {
            currentSelectedCategory = cat;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredProjects(cat);
        });

        filterBar.appendChild(btn);
    });
}

function renderFilteredProjects(category) {
    const container = document.getElementById('projects-container');
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (!container) return;

    container.innerHTML = '';

    const filtered = cachedProjectsList.filter(proj => {
        if (category === 'All') return true;
        let tags = [];
        try { 
            tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []); 
        } catch(e) {}
        return tags.some(t => t.trim().toLowerCase() === category.trim().toLowerCase());
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p class="no-projects-msg">No projects found matching category <strong>#${category}</strong>.</p>`;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    filtered.forEach((proj, index) => {
        const card = document.createElement("div");
        
        if (index > 3) {
            card.className = "project-card hidden-node";
        } else {
            card.className = "project-card stagger-card";
        }
        
        let tags = [];
        try { tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []); } catch(e) {}
        
        card.innerHTML = `
            <h3>${proj.title}</h3>
            <p>${proj.description}</p>
            <div class="project-footer">
                <div class="project-tags">
                    ${tags.map(t => `<span class="tag-badge" style="cursor:pointer;" title="Filter by ${t}">#${t}</span>`).join('')}
                </div>
                <a href="${proj.link}" target="_blank" class="repo-link">Code →</a>
            </div>
        `;

        // Allow clicking on tag badges inside cards to directly filter
        card.querySelectorAll('.tag-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const rawTag = badge.innerText.replace('#', '').trim();
                const matchingBtn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.innerText.includes(rawTag));
                if (matchingBtn) {
                    matchingBtn.click();
                }
            });
        });

        container.appendChild(card);
    });

    // Pagination display logic
    if (loadMoreBtn) {
        if (filtered.length > 4) {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.innerText = "Show More Projects";
            setupPagination();
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function setupPagination() {
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
        const newBtn = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
        
        newBtn.addEventListener("click", () => {
            const hiddenCards = document.querySelectorAll(".project-card.hidden-node");
            
            if (hiddenCards.length > 0) {
                hiddenCards.forEach((card, index) => {
                    card.classList.remove("hidden-node");
                    card.classList.add("visible-node");
                    card.style.animationDelay = `${index * 60}ms`;
                });
                newBtn.innerText = "Show Less";
            } else {
                const extraCards = document.querySelectorAll(".project-card.visible-node");
                extraCards.forEach(card => {
                    card.classList.remove("visible-node");
                    card.classList.add("hidden-node");
                    card.style.animationDelay = "0ms";
                });
                newBtn.innerText = "Show More Projects";
                document.getElementById("projects").scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// --- REUSABLE TOAST NOTIFICATION POPUP ENGINE ---
function showToastPopup(title, message, type = 'success', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-popup toast-${type}`;

    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button type="button" class="toast-close" title="Close notification">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.add('toast-fadeOut');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }
}

// --- FEATURE 2: CAPTURE AND SUBMIT CONTACT FORM DATA ---
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Stop standard page reload

    // Gather inputs using the updated HTML IDs
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const body = document.getElementById('form-body').value;

    // Visual feedback for user
    if (submitBtn) submitBtn.innerText = 'Sending...';

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, body }) // Perfectly matches your backend validation fields
      });

      const data = await response.json();

      if (data.success) {
        showToastPopup('Message Transmitted!', `Thank you ${name}, your message has been securely sent to Lewi Kibru.`, 'success');
        form.reset(); // Wipe fields clear
      } else {
        showToastPopup('Submission Failed', data.error || 'Server rejected message payload.', 'error');
      }
    } catch (error) {
      console.error('Network or communication error:', error);
      showToastPopup('Connection Error', 'Could not connect to Express server. Please verify network.', 'error');
    } finally {
      if (submitBtn) submitBtn.innerText = 'Send Message';
    }
  });
}

// --- SPY VAULT INTERACTION ENGINE ---
function initSpyVaultEngine() {
    const modal = document.getElementById('spy-vault-modal');
    const tokenInput = document.getElementById('spy-token-input');
    const statusMsg = document.getElementById('spy-status-msg');
    const spyForm = document.getElementById('spy-passcode-form');
    const cancelBtn = document.getElementById('spy-cancel-btn');
    const toggleVisBtn = document.getElementById('spy-toggle-vis');

    if (!modal) return;

    const cachedToken = localStorage.getItem('admin_token');
    if (cachedToken && tokenInput) {
        tokenInput.value = cachedToken;
    }

    window.openSpyVaultModal = function() {
        modal.classList.add('open');
        if (statusMsg) {
            statusMsg.className = 'spy-status-msg';
            statusMsg.innerText = 'STATUS: STANDBY... ENTER PASSCODE KEYCODE';
        }
        setTimeout(() => {
            if (tokenInput) tokenInput.focus();
        }, 300);
    };

    window.closeSpyVaultModal = function() {
        modal.classList.remove('open');
    };

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.closeSpyVaultModal();
        });
    }

    if (toggleVisBtn && tokenInput) {
        toggleVisBtn.addEventListener('click', () => {
            tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
        });
    }

    // 1. TRIGGER ACTION: Triple click on red dot in LEWI.KIBRU logo
    const secretDot = document.getElementById('secret-dot');
    if (secretDot) {
        let dotClickCount = 0;
        let dotClickTimer = null;
        secretDot.addEventListener('click', () => {
            dotClickCount++;
            clearTimeout(dotClickTimer);
            if (dotClickCount >= 3) {
                dotClickCount = 0;
                window.openSpyVaultModal();
            } else {
                dotClickTimer = setTimeout(() => { dotClickCount = 0; }, 1500);
            }
        });
    }

    // 3. TRIGGER ACTION C: Keyboard Shortcut (Ctrl+Shift+A) or Secret Typing ('spy' / 'admin')
    let keyBuffer = '';
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            window.openSpyVaultModal();
            return;
        }

        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);

        if (keyBuffer.endsWith('spy') || keyBuffer.endsWith('admin') || keyBuffer.endsWith('vault')) {
            keyBuffer = '';
            window.openSpyVaultModal();
        }
    });

    // 4. SUBMIT VERIFICATION FORM
    if (spyForm) {
        spyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredToken = tokenInput ? tokenInput.value.trim() : '';

            if (!enteredToken) return;

            if (statusMsg) {
                statusMsg.className = 'spy-status-msg';
                statusMsg.innerText = '⚡ VERIFYING AUTHORIZATION KEYCODE...';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': enteredToken
                    },
                    body: JSON.stringify({ token: enteredToken })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (statusMsg) {
                        statusMsg.className = 'spy-status-msg success';
                        statusMsg.innerText = '🔓 ACCESS GRANTED! REDIRECTING TO COMMAND CENTER...';
                    }
                    localStorage.setItem('admin_token', enteredToken);

                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 800);
                } else {
                    if (statusMsg) {
                        statusMsg.className = 'spy-status-msg error';
                        statusMsg.innerText = '❌ ACCESS DENIED! INVALID PASSCODE KEYCODE.';
                    }
                }
            } catch (err) {
                if (statusMsg) {
                    statusMsg.className = 'spy-status-msg error';
                    statusMsg.innerText = '❌ SYSTEM CONNECTION ERROR. VERIFY SERVER RUNTIME.';
                }
            }
        });
    }
}

// --- RUN INITIALIZATIONS ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderProfile();
  fetchAndRenderProjects();
  setupContactForm();
  initSpyVaultEngine();
});

// --- HIDDEN ADMIN GESTURE TRACKING ON THE CANVAS ---
const heroCanvas = document.getElementById('hero-canvas');
const ctxGesture = heroCanvas ? heroCanvas.getContext('2d') : null;

if (heroCanvas) {
  let mousePoints = [];
  let isTracking = false;

  heroCanvas.addEventListener('mousedown', (e) => {
    mousePoints = [{ x: e.offsetX, y: e.offsetY }];
    isTracking = true;
    if (ctxGesture) {
        ctxGesture.beginPath();
        ctxGesture.moveTo(e.offsetX, e.offsetY);
        ctxGesture.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctxGesture.lineWidth = 2;
    }
  });

  heroCanvas.addEventListener('mousemove', (e) => {
    if (!isTracking) return;
    mousePoints.push({ x: e.offsetX, y: e.offsetY });
    if (ctxGesture) {
        ctxGesture.lineTo(e.offsetX, e.offsetY);
        ctxGesture.stroke();
    }
  });

  heroCanvas.addEventListener('mouseup', () => {
    isTracking = false;
    if (ctxGesture) ctxGesture.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    if (mousePoints.length < 15) return;

    const startPoint = mousePoints[0];
    const midPoint = mousePoints[Math.floor(mousePoints.length / 2)];
    const endPoint = mousePoints[mousePoints.length - 1];

    const movedDownFirst = (midPoint.y - startPoint.y > 60) && (Math.abs(midPoint.x - startPoint.x) < 70);
    const movedRightSecond = (endPoint.x - midPoint.x > 60) && (Math.abs(endPoint.y - midPoint.y) < 70);

    if (movedDownFirst && movedRightSecond) {
      if (typeof window.openSpyVaultModal === 'function') {
        window.openSpyVaultModal();
      }
    }
  });
}
