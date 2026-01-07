class BlogView {
  constructor() {
    this.postsContainer = null;
    this.formContainer = null;
    this.loadingIndicator = null;
    this.errorContainer = null;
    this.currentEditId = null;
    this.observers = [];
    this.editModal = null;
    this.editFormContainer = null;
    this.showDeleteConfirmation = this.showDeleteConfirmation.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleDeleteCancel = this.handleDeleteCancel.bind(this);
    // Bind methods to maintain context
    this.renderPosts = this.renderPosts.bind(this);
    this.renderPostForm = this.renderPostForm.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.hideLoading = this.hideLoading.bind(this);
    this.showError = this.showError.bind(this);
    this.hideError = this.hideError.bind(this);
    this.showEditModal = this.showEditModal.bind(this);
    this.hideEditModal = this.hideEditModal.bind(this);
    this.renderEditForm = this.renderEditForm.bind(this);
  }

  // Observer pattern implementation
  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyObservers(event, data) {
    this.observers.forEach((observer) => {
      if (observer[event]) {
        observer[event](data);
      }
    });
  }

  // Initialization
  initialize() {
    this.setupDOMElements();
    this.renderPostForm();
    this.notifyObservers('onViewInitialized');
  }
  //
  // setupDOMElements() {
  //   this.postsContainer = document.getElementById('posts-container');
  //   this.formContainer = document.getElementById('form-container');
  //   this.loadingIndicator = document.getElementById('loading-indicator');
  //   this.errorContainer = document.getElementById('error-container');
  //   this.editModal = document.getElementById('edit-modal');
  //   this.editFormContainer = document.getElementById('edit-form-container');
  //
  //   if (
  //     !this.postsContainer ||
  //     !this.formContainer ||
  //     !this.loadingIndicator ||
  //     !this.errorContainer
  //   ) {
  //     throw new Error('Required DOM elements not found. Check HTML structure.');
  //   }
  // }
  setupDOMElements() {
    this.postsContainer = document.getElementById('posts-container');
    this.formContainer = document.getElementById('form-container');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorContainer = document.getElementById('error-container');
    this.editModal = document.getElementById('edit-modal');
    this.editFormContainer = document.getElementById('edit-form-container');
    this.deleteModal = document.getElementById('delete-modal');

    // Set up delete modal events
    if (this.deleteModal) {
      document.getElementById('confirm-delete').addEventListener('click', this.handleDeleteConfirm);
      document.getElementById('cancel-delete').addEventListener('click', this.handleDeleteCancel);
    }
    if (
        !this.postsContainer ||
        !this.formContainer ||
        !this.loadingIndicator ||
        !this.errorContainer
    ) {
      throw new Error('Required DOM elements not found. Check HTML structure.');
    }

    // Set up event delegation for posts container
    this.setupEventDelegation();
  }

  setupEventDelegation() {
    // Use event delegation - attach ONE event listener to the container
    // This handles clicks on ANY delete/edit button inside
    this.postsContainer.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const postId = button.getAttribute('data-post-id');

      if (!action || !postId) return;

      const id = parseInt(postId);

      if (action === 'edit') {
        e.preventDefault();
        e.stopPropagation();
        this.handleEdit(id);
      } else if (action === 'delete') {
        e.preventDefault();
        e.stopPropagation();
        this.handleDelete(id);
      }
    });
  }
  // Add this method to show success messages
  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <span class="success-icon">✅</span>
      <span class="success-text">${this.escapeHtml(message)}</span>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  // Rendering methods
  renderPosts(posts) {
    if (!posts || posts.length === 0) {
      this.postsContainer.innerHTML = `
        <div class="no-posts">
          <h3>No blog posts yet</h3>
          <p>Be the first to create a blog post!</p>
        </div>
      `;
      return;
    }

    this.postsContainer.innerHTML = posts
      .map((post) => this.renderPostCard(post))
      .join('');
    // this.attachPostEventListeners();
  }

  renderPostCard(post) {
    const formattedDate = this.formatDate(post.createdAt);

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-meta">
            <span class="post-date">${formattedDate}</span>
            ${
        post.updatedAt !== post.createdAt
            ? '<span class="post-updated">Updated</span>'
            : ''
    }
          </div>
        </div>
        <div class="post-content">
          ${this.renderPostContent(post.content)}
        </div>
        <div class="post-actions">
          <button class="btn btn-edit" data-action="edit" data-post-id="${post.id}">
            <span class="icon">✏️</span> Edit
          </button>
          <button class="btn btn-delete" data-action="delete" data-post-id="${post.id}">
            <span class="icon">🗑️</span> Delete
          </button>
        </div>
      </article>
    `;
  }

  // Event handling
  // attachPostEventListeners() {
  //   this.postsContainer.addEventListener('click', (e) => {
  //     const action = e.target.closest('[data-action]');
  //     if (!action) return;
  //
  //     // Ensure postId is a number to match model's numeric IDs
  //     const postId = Number(action.dataset.postId);
  //     const actionType = action.dataset.action;
  //
  //     switch (actionType) {
  //       case 'edit':
  //         this.handleEdit(postId);
  //         break;
  //       case 'delete':
  //         this.handleDelete(postId);
  //         break;
  //     }
  //   });
  // }

  attachFormEventListeners() {
    const form = document.getElementById('post-form');
    const cancelEdit = document.getElementById('cancel-edit');

    if (form) {
      form.addEventListener('submit', this.handleSubmit);

      // Add real-time validation
      const titleInput = document.getElementById('title');
      const contentInput = document.getElementById('content');

      if (titleInput) {
        titleInput.addEventListener('blur', () => {
          this.validateField('title', titleInput.value.trim());
        });
      }

      if (contentInput) {
        contentInput.addEventListener('blur', () => {
          this.validateField('content', contentInput.value.trim());
        });
      }
    }

    if (cancelEdit) {
      cancelEdit.addEventListener('click', () => this.cancelEdit());
    }
  }

  // Real-time field validation
  validateField(fieldName, value) {
    const errors = [];

    if (fieldName === 'title') {
      if (!value) {
        errors.push({ field: 'title', message: 'Title is required' });
      } else if (value.length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
      } else if (value.length > 200) {
        errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
      }
    } else if (fieldName === 'content') {
      if (!value) {
        errors.push({ field: 'content', message: 'Content is required' });
      } else if (value.length < 10) {
        errors.push({ field: 'content', message: 'Content must be at least 10 characters' });
      }
    }

    if (errors.length > 0) {
      this.displayFieldError(fieldName, errors[0].message);
    } else {
      this.clearFieldError(fieldName);
    }

    return errors.length === 0;
  }

  displayFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    if (inputElement) {
      inputElement.classList.remove('error');
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const postData = {
      title: formData.get('title').trim(),
      content: formData.get('content').trim(),
    };

    // Clear previous errors
    this.clearFormErrors();

    // Validate form
    const errors = this.validateForm(postData);
    if (errors.length > 0) {
      this.displayFormErrors(errors);
      return;
    }

    if (this.currentEditId) {
      this.notifyObservers('onPostUpdate', {
        id: this.currentEditId,
        ...postData,
      });
    } else {
      this.notifyObservers('onPostCreate', postData);
    }
  }

  handleEdit(postId) {
    const post = this.notifyObservers('onPostEdit', postId);
    // The controller should handle the edit logic and call showEditModal
  }

  renderPostContent(content) {
    // Escape HTML and convert newlines to <br>
    return this.escapeHtml(content).replace(/\n/g, '<br>');
  }

  renderPostForm() {
    const isEditing = !!this.currentEditId;
    this.formContainer.innerHTML = `
      <form id="post-form" class="post-form">
        <h3>${isEditing ? 'Edit Post' : 'Create New Post'}</h3>
        
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            placeholder="Enter post title" 
            required
            minlength="3"
            maxlength="200"
          />
          <div id="title-error" class="error-message"></div>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea 
            id="content" 
            name="content" 
            rows="5" 
            placeholder="Write your post content here..." 
            required
            minlength="10"
          ></textarea>
          <div id="content-error" class="error-message"></div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            ${isEditing ? 'Update Post' : 'Create Post'}
          </button>
          ${isEditing ? `
            <button type="button" id="cancel-edit" class="btn btn-secondary">
              Cancel Edit
            </button>
          ` : ''}
        </div>
      </form>
    `;

    this.attachFormEventListeners();
  }

  showEditModal(postData) {
    this.currentEditId = postData.id;
    this.renderEditForm(postData);
    this.editModal.style.display = 'block';
  }

  hideEditModal() {
    this.editModal.style.display = 'none';
    this.currentEditId = null;
  }

  renderEditForm(postData) {
    this.editFormContainer.innerHTML = `
      <form id="edit-post-form" class="post-form">
        <div class="form-group">
          <label for="edit-title">Title</label>
          <input 
            type="text" 
            id="edit-title" 
            name="title" 
            value="${this.escapeHtml(postData.title)}"
            placeholder="Enter post title" 
            required
            minlength="3"
            maxlength="200"
          />
          <div id="edit-title-error" class="error-message"></div>
        </div>
        
        <div class="form-group">
          <label for="edit-content">Content</label>
          <textarea 
            id="edit-content" 
            name="content" 
            rows="5" 
            placeholder="Write your post content here..." 
            required
            minlength="10"
          >${this.escapeHtml(postData.content)}</textarea>
          <div id="edit-content-error" class="error-message"></div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            Update Post
          </button>
          <button type="button" id="cancel-edit-modal" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    `;

    this.attachEditFormEventListeners();
  }

  attachEditFormEventListeners() {
    const form = document.getElementById('edit-post-form');
    const cancelBtn = document.getElementById('cancel-edit-modal');
    const closeBtn = document.getElementById('close-edit-modal');

    if (form) {
      form.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideEditModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideEditModal());
    }

    // Close modal when clicking outside
    this.editModal.addEventListener('click', (event) => {
      if (event.target === this.editModal) {
        this.hideEditModal();
      }
    });
  }

  async handleEditSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const postData = {
      title: formData.get('title').trim(),
      content: formData.get('content').trim(),
    };

    this.clearEditFormErrors();

    const errors = this.validateForm(postData);
    if (errors.length > 0) {
      this.displayEditFormErrors(errors);
      return;
    }

    // Notify the controller to update the post
    this.notifyObservers('onPostUpdate', {
      id: this.currentEditId,
      ...postData,
    });

    this.hideEditModal();
  }

  clearEditFormErrors() {
    const errorElements = this.editFormContainer.querySelectorAll('.error-message');
    const inputElements = this.editFormContainer.querySelectorAll('.error');

    errorElements.forEach((element) => {
      element.textContent = '';
      element.style.display = 'none';
    });
    inputElements.forEach((element) => element.classList.remove('error'));
  }

  displayEditFormErrors(errors) {
    errors.forEach((error) => {
      const errorElement = document.getElementById(`edit-${error.field}-error`);
      const inputElement = document.getElementById(`edit-${error.field}`);

      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
      }

      if (inputElement) {
        inputElement.classList.add('error');
      }
    });
  }

  // handleDelete(postId) {
  //   // The confirmation is already done in the controller
  //   this.notifyObservers('onPostDelete', postId);
  // }
  showDeleteConfirmation() {
    return new Promise((resolve) => {
      this.deleteResolve = resolve;
      this.deleteModal.style.display = 'block';
    });
  }

  handleDeleteConfirm() {
    if (this.deleteResolve) {
      this.deleteResolve(true);
    }
    this.deleteModal.style.display = 'none';
    this.deleteResolve = null;
    this.pendingDeleteId = null;
  }

  handleDeleteCancel() {
    if (this.deleteResolve) {
      this.deleteResolve(false);
    }
    this.deleteModal.style.display = 'none';
    this.deleteResolve = null;
    this.pendingDeleteId = null;
  }

  handleDelete(postId) {
    this.pendingDeleteId = postId;
    this.notifyObservers('onPostDelete', postId);
  }

  //   showEditModal(postData) {}
  //   hideEditModal() {}
  //  renderEditForm(postData) {}
  //   attachEditFormEventListeners() {}
  // async handleEditSubmit(e) {}
  //   clearEditFormErrors() {}
  //   handleDelete(postId) {}
  //  displayEditFormErrors(errors) {}
  //  handleDelete(postId) {}

  // Form utilities
  populateForm(postData) {
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');

    if (titleInput && contentInput) {
      titleInput.value = postData.title;
      contentInput.value = postData.content;
      this.currentEditId = postData.id;
      this.renderPostForm(); // Re-render form to show editing state
    }
  }

  clearForm() {
    const form = document.getElementById('post-form');
    if (form) {
      form.reset();
    }
    this.currentEditId = null;
    this.clearFormErrors();
    this.renderPostForm(); // Re-render form to show create state
  }

  cancelEdit() {
    this.clearForm();
  }

  validateForm(postData) {
    const errors = [];

    // Check title
    if (!postData.title || postData.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required'
      });
    } else if (postData.title.trim().length < 3) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long'
      });
    } else if (postData.title.trim().length > 200) {
      errors.push({
        field: 'title',
        message: 'Title cannot exceed 200 characters'
      });
    }

    // Check content
    if (!postData.content || postData.content.trim() === '') {
      errors.push({
        field: 'content',
        message: 'Content is required'
      });
    } else if (postData.content.trim().length < 10) {
      errors.push({
        field: 'content',
        message: 'Content must be at least 10 characters long'
      });
    }

    return errors;
  }
  displayFormErrors(errors) {
    // First clear all existing errors
    this.clearFormErrors();

    errors.forEach((error) => {
      const errorElement = document.getElementById(`${error.field}-error`);
      const inputElement = document.getElementById(error.field);

      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block'; // Show it
        errorElement.classList.add('visible');
      }

      if (inputElement) {
        inputElement.classList.add('error');
        // Add focus to first error field
        if (errors[0] === error) {
          inputElement.focus();
        }
      }
    });
  }
  clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.error');

    errorElements.forEach((element) => {
      element.textContent = '';
      element.style.display = 'none'; // Ensure it's hidden
      element.classList.remove('visible'); // Remove any visible class
    });

    inputElements.forEach((element) => {
      element.classList.remove('error');
      // Remove any inline error styles
      element.style.borderColor = '';
      element.style.boxShadow = '';
    });
  }
  // UI state management
  showLoading() {
    this.loadingIndicator.style.display = 'block';
    this.hideError();
  }

  hideLoading() {
    this.loadingIndicator.style.display = 'none';
  }

  showError(message) {
    this.errorContainer.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${this.escapeHtml(message)}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
    `;
    this.errorContainer.style.display = 'block';
  }

  hideError() {
    this.errorContainer.style.display = 'none';
  }

  showSuccess(message) {
    // Simple success notification (could be enhanced with better UI)
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <span class="success-icon">✅</span>
      <span class="success-text">${this.escapeHtml(message)}</span>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  // Utility methods
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// window.viewExplanation = viewExplanation;
window.BlogView = BlogView;