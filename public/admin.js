    const API_URL = '/api/projects';
    const API_PROFILE_URL = '/api/profile';
    const API_ADMIN_PROFILE_URL = '/api/admin/profile';
    const API_MESSAGES_URL = '/api/admin/messages';
    const form = document.getElementById('project-form');
    const tokenInput = document.getElementById('admin-token');
    const projectsGrid = document.getElementById('admin-projects-grid');

    // Automatically pull the hidden token saved by your canvas drawing gesture or spy modal
    const cachedToken = localStorage.getItem('admin_token') || 'supersecureadminpass123';
    if (tokenInput) {
        tokenInput.value = cachedToken;
    }
    
    const idInput = document.getElementById('project-id');
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');
    const linkInput = document.getElementById('link');
    const projectTagsInput = document.getElementById('project-tags');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const loadSecureBtn = document.getElementById('load-secure-btn');
    const profileForm = document.getElementById('profile-form');
    const heroTitleInput = document.getElementById('hero-title');
    const heroBioInput = document.getElementById('hero-bio');
    const contactPhoneInput = document.getElementById('contact-phone');
    const skillsInput = document.getElementById('profile-skills');
    const hobbiesInput = document.getElementById('profile-hobbies');
    const messagesGrid = document.getElementById('admin-messages-grid');

    // Add event listener to handle cancel edit functionality
    cancelEditBtn.addEventListener('click', resetFormState);

    // Load Secure Data
    loadSecureBtn.addEventListener('click', () => {
        loadMessages();
    });

    // --- UTILITIES ---
    // Prevent XSS attacks by escaping HTML characters
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 1. READ: Fetch records and draw cards inside the DOM layout
    async function loadProjects() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            
            projectsGrid.innerHTML = '';
            if (data.length === 0) {
                projectsGrid.innerHTML = '<p>No projects found in your local database layer.</p>';
                return;
            }

            data.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'card';
                let projTags = [];
                try { projTags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []); } catch(e) {}
                card.innerHTML = `
                    <div>
                        <span class="badge">ID: ${proj.id}</span>
                        <h3>${escapeHtml(proj.title)}</h3>
                        <p>${escapeHtml(proj.description)}</p>
                        <p><strong>Tags:</strong> ${escapeHtml(projTags.join(', '))}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn edit-btn">Edit</button>
                        <button class="btn btn-danger delete-btn">Delete</button>
                    </div>
                `;
                
                // Add event listeners securely avoiding inline handlers and XSS issues
                card.querySelector('.edit-btn').addEventListener('click', () => {
                    populateEditForm(proj.id, proj.title, proj.description, proj.link, projTags);
                });
                card.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteProject(proj.id);
                });

                projectsGrid.appendChild(card);
            });
        } catch (err) {
            projectsGrid.innerHTML = '<p style="color: var(--danger)">Could not connect to Express server backend.</p>';
        }
    }

    // --- REUSABLE TOAST NOTIFICATION POPUP ENGINE ---
    function showToast(title, message, type = 'success', duration = 4000) {
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

    // 2. CREATE / UPDATE: Intercept the dynamic submit block
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = tokenInput.value;
        const targetId = idInput.value;
        
        const payload = {
            title: titleInput.value,
            description: descInput.value,
            link: linkInput.value,
            tags: projectTagsInput.value.split(',').map(s => s.trim()).filter(s => s)
        };

        // Determine if we target a POST or a PUT path
        const isEdit = targetId !== "";
        const endpoint = isEdit ? `${API_URL}/${targetId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                showToast(
                    isEdit ? 'Project Modified' : 'Project Created',
                    isEdit ? `Project "${payload.title}" updated successfully!` : `Project "${payload.title}" created successfully!`,
                    'success'
                );
                resetFormState();
                loadProjects();
            } else {
                showToast('Save Failed', result.error || 'Server error occurred.', 'error');
            }
        } catch (err) {
            showToast('Network Error', 'Failed to transmit request to backend pipeline.', 'error');
        }
    });

    // 3. DELETE: Drop records based on target parameters
    async function deleteProject(id) {
        if (!confirm(`Are you sure you want to delete Project ID ${id}?`)) return;
        
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': tokenInput.value }
            });
            const result = await res.json();

            if (res.ok) {
                showToast('Project Deleted', result.message || `Project ID ${id} deleted.`, 'info');
                if (idInput.value === id.toString()) resetFormState();
                loadProjects();
            } else {
                showToast('Delete Failed', result.error || 'Could not delete project.', 'error');
            }
        } catch (err) {
            showToast('Network Error', 'Failed to execute delete cycle.', 'error');
        }
    }

    // --- FORM INTERFACE HELPERS ---
    function populateEditForm(id, title, desc, link, tags) {
        idInput.value = id;
        titleInput.value = title;
        descInput.value = desc;
        linkInput.value = link;
        projectTagsInput.value = Array.isArray(tags) ? tags.join(', ') : '';
        
        formTitle.innerText = `Editing Project ID: ${id}`;
        submitBtn.innerText = 'Update Project';
        cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetFormState() {
        idInput.value = "";
        form.reset();
        formTitle.innerText = "Create New Project";
        submitBtn.innerText = "Save Project";
        cancelEditBtn.style.display = 'none';
    }

    let uploadedBase64 = null;
    let uploadedMimeType = null;
    let removePictureFlag = false;

    const picInput = document.getElementById('profile-pic');
    const picPreview = document.getElementById('profile-pic-preview');
    const removePicBtn = document.getElementById('remove-pic-btn');

    if (picInput) {
        picInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const dataUrl = evt.target.result;
                    const parts = dataUrl.split(',');
                    const mime = parts[0].match(/:(.*?);/)[1];
                    uploadedBase64 = parts[1];
                    uploadedMimeType = mime;
                    removePictureFlag = false;
                    
                    if (picPreview) {
                        picPreview.src = dataUrl;
                        picPreview.style.display = 'block';
                    }
                    if (removePicBtn) removePicBtn.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePicBtn) {
        removePicBtn.addEventListener('click', () => {
            uploadedBase64 = "";
            uploadedMimeType = "";
            removePictureFlag = true;
            if (picInput) picInput.value = "";
            if (picPreview) picPreview.style.display = 'none';
            removePicBtn.style.display = 'none';
        });
    }

    // Fetch and populate Profile
    async function loadProfile() {
        try {
            const res = await fetch(API_PROFILE_URL);
            const data = await res.json();
            if (data.hero_title) heroTitleInput.value = data.hero_title;
            if (data.hero_bio) heroBioInput.value = data.hero_bio;
            if (data.contact_phone) contactPhoneInput.value = data.contact_phone;
            if (data.skills) skillsInput.value = (typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills).join(', ');
            if (data.hobbies) hobbiesInput.value = (typeof data.hobbies === 'string' ? JSON.parse(data.hobbies) : data.hobbies).join(', ');
            
            if (data.picture_base64 && data.picture_mime_type) {
                if (picPreview) {
                    picPreview.src = `data:${data.picture_mime_type};base64,${data.picture_base64}`;
                    picPreview.style.display = 'block';
                }
                if (removePicBtn) removePicBtn.style.display = 'inline-block';
            } else {
                if (picPreview) picPreview.style.display = 'none';
                if (removePicBtn) removePicBtn.style.display = 'none';
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    }

    // Save Profile
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = tokenInput.value;
        if (!token) {
            showToast('Authentication Required', 'Please enter your active secret token first.', 'error');
            return;
        }

        const payload = {
            hero_title: heroTitleInput.value,
            hero_bio: heroBioInput.value,
            contact_phone: contactPhoneInput.value,
            skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s),
            hobbies: hobbiesInput.value.split(',').map(s => s.trim()).filter(s => s)
        };

        if (removePictureFlag) {
            payload.picture_base64 = "";
            payload.picture_mime_type = "";
        } else if (uploadedBase64) {
            payload.picture_base64 = uploadedBase64;
            payload.picture_mime_type = uploadedMimeType;
        }

        try {
            const res = await fetch(API_ADMIN_PROFILE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                showToast('Profile Saved!', 'Profile settings and image saved successfully to database.', 'success');
                uploadedBase64 = null;
                uploadedMimeType = null;
                removePictureFlag = false;
                loadProfile();
            } else {
                showToast('Update Failed', result.error || 'Server error occurred.', 'error');
            }
        } catch (err) {
            showToast('Network Error', 'Failed to update profile settings.', 'error');
        }
    });

    // Load Messages
    async function loadMessages() {
        const token = tokenInput.value;
        if (!token) {
            showToast('Authentication Required', 'Please enter your secret admin token first.', 'error');
            return;
        }
        
        try {
            const res = await fetch(API_MESSAGES_URL, {
                headers: { 'x-admin-token': token }
            });
            
            if (!res.ok) {
                messagesGrid.innerHTML = '<p style="color: var(--danger)">Unauthorized or Failed to load messages.</p>';
                showToast('Access Denied', 'Invalid token or unauthorized request.', 'error');
                return;
            }
            
            const data = await res.json();
            messagesGrid.innerHTML = '';
            
            if (data.length === 0) {
                messagesGrid.innerHTML = '<p>No messages found in your inbox.</p>';
                showToast('Data Synchronized', 'No messages found in inbox.', 'info');
                return;
            }

            showToast('Data Synchronized', `Pulled ${data.length} message(s) from database.`, 'success');

            data.forEach(msg => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div>
                        <span class="badge">Received: ${new Date(msg.created_at).toLocaleString()}</span>
                        <h3>${escapeHtml(msg.sender_name)}</h3>
                        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(msg.sender_email)}" style="color:var(--primary)">${escapeHtml(msg.sender_email)}</a></p>
                        <p style="margin-top:0.5rem; padding:0.5rem; background:#1e293b; border-radius:4px; font-style:italic;">"${escapeHtml(msg.message_body)}"</p>
                    </div>
                    <div style="margin-top:0.8rem;">
                        <button class="btn btn-danger delete-msg-btn">Delete Message</button>
                    </div>
                `;
                card.querySelector('.delete-msg-btn').addEventListener('click', () => {
                    deleteMessage(msg.id);
                });
                messagesGrid.appendChild(card);
            });
        } catch (err) {
            messagesGrid.innerHTML = '<p style="color: var(--danger)">Could not connect to fetch messages.</p>';
            showToast('Connection Error', 'Failed to load messages from server.', 'error');
        }
    }

    // Delete Message
    async function deleteMessage(id) {
        const token = tokenInput.value;
        if (!confirm(`Are you sure you want to delete message ID ${id}?`)) return;

        try {
            const res = await fetch(`/api/admin/messages/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': token }
            });
            const result = await res.json();
            if (res.ok) {
                showToast('Message Deleted', result.message || `Message ${id} purged.`, 'info');
                loadMessages();
            } else {
                showToast('Delete Failed', result.error || 'Failed to delete message.', 'error');
            }
        } catch (err) {
            showToast('Network Error', 'Connection error while deleting message.', 'error');
        }
    }

    // Initialize the dashboard by loading existing projects
    loadProjects();
    loadProfile();

    // --- CHANGE ADMIN SECRET TOKEN HANDLER ---
    const changeTokenForm = document.getElementById('change-token-form');
    const newTokenInput = document.getElementById('new-token-input');
    const confirmTokenInput = document.getElementById('confirm-token-input');

    if (changeTokenForm) {
        changeTokenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentToken = tokenInput ? tokenInput.value.trim() : '';
            const newToken = newTokenInput ? newTokenInput.value.trim() : '';
            const confirmToken = confirmTokenInput ? confirmTokenInput.value.trim() : '';

            if (!currentToken) {
                showToast('Authentication Required', 'Please enter your active token at top of page.', 'error');
                return;
            }

            if (!newToken || newToken.length < 4) {
                showToast('Invalid Token', 'New secret token must be at least 4 characters long.', 'error');
                return;
            }

            if (newToken !== confirmToken) {
                showToast('Mismatch Error', 'New secret token and confirm token do not match.', 'error');
                return;
            }

            try {
                const res = await fetch('/api/admin/change-token', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': currentToken
                    },
                    body: JSON.stringify({ newToken })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    showToast('Passcode Updated!', 'Admin Secret Token updated! Local session synchronized.', 'success');
                    localStorage.setItem('admin_token', newToken);
                    if (tokenInput) tokenInput.value = newToken;
                    if (newTokenInput) newTokenInput.value = '';
                    if (confirmTokenInput) confirmTokenInput.value = '';
                } else {
                    showToast('Update Failed', data.error || 'Failed to update admin token.', 'error');
                }
            } catch (err) {
                showToast('Network Error', 'Connection error. Failed to update secret token.', 'error');
            }
        });
    }