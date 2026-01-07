class BlogController {
    constructor(model, view) {
    this.model = model;
    this.view = view;
    this.isInitialized = false;
    
    // Bind methods to maintain context
    this.initialize = this.initialize.bind(this);
    this.handlePostCreate = this.handlePostCreate.bind(this);
    this.handlePostUpdate = this.handlePostUpdate.bind(this);
    this.handlePostDelete = this.handlePostDelete.bind(this);
    this.handlePostEdit = this.handlePostEdit.bind(this);
    this.handleLoadingStart = this.handleLoadingStart.bind(this);
    this.handleLoadingEnd = this.handleLoadingEnd.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handlePostsLoaded = this.handlePostsLoaded.bind(this);
    this.handlePostCreated = this.handlePostCreated.bind(this);
    this.handlePostUpdated = this.handlePostUpdated.bind(this);
    this.handlePostDeleted = this.handlePostDeleted.bind(this);
  }
  // Initialization
  async initialize() {
    if (this.isInitialized) {
      console.warn('Controller already initialized');
      return;
    }

    try {
      console.log('Initializing Blog Controller...');
      this.setupModelObservers();
      this.setupViewObservers();
      
      await this.view.initialize();
      await this.loadPosts();
      
      this.isInitialized = true;
      console.log('Blog Controller initialized successfully');
    } catch (error) {
      console.error('Failed to initialize controller:', error);
      this.view.showError('Failed to initialize application. Please refresh the page.');
      throw error;
    }
  }

  // Observer setup
  setupModelObservers() {
    this.model.addObserver({
      onPostsLoaded: this.handlePostsLoaded,
      onPostCreated: this.handlePostCreated,
      onPostUpdated: this.handlePostUpdated,
      onPostDeleted: this.handlePostDeleted,
      onError: this.handleError,
      onLoadingStart: this.handleLoadingStart,
      onLoadingEnd: this.handleLoadingEnd,
    });
  }

  setupViewObservers() {
    this.view.addObserver({
      onViewInitialized: this.handleViewInitialized,
      onPostCreate: this.handlePostCreate,
      onPostUpdate: this.handlePostUpdate,
      onPostDelete: this.handlePostDelete,
      onPostEdit: this.handlePostEdit,
    });
  }

  // Data operations
  async loadPosts() {
    try {
      console.log('Loading blog posts...');
      await this.model.loadPosts();
    } catch (error) {
      console.error('Failed to load posts:', error);
      this.view.showError('Failed to load blog posts. Please try again.');
    }
  }

  async handlePostCreate(postData) {
    try {
      console.log('Creating new post:', postData);
      await this.model.createPost(postData);
      this.view.showSuccess('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      this.view.showError('Failed to create post. Please try again.');
    }
  }

//   async handlePostUpdate(updateData) {}
  
//   async handlePostDelete(postId)

//   handlePostEdit(postId) {}


  // Event handlers
  handleViewInitialized() {
    console.log('View initialized');
  }

  handlePostsLoaded(posts) {
    console.log('Posts loaded:', posts.length);
    this.view.renderPosts(posts);
  }

  handlePostCreated(newPost) {
    console.log('Post created:', newPost.id);
    this.view.clearForm();
    this.loadPosts(); // Refresh the list
  }

//   handlePostUpdated(updatedPost) {}

//   handlePostDeleted(postId) {}

  handleLoadingStart() {
    console.log('Loading started');
    this.view.showLoading();
  }

  handleLoadingEnd() {
    console.log('Loading ended');
    this.view.hideLoading();
  }

  handleError(errorMessage) {
    console.error('Error occurred:', errorMessage);
    // Error is already handled by the view in most cases
  }

  async handlePostUpdate(updateData) {
    try {
      console.log('Updating post:', updateData.id);
      await this.model.updatePost(updateData.id, updateData);
      this.view.showSuccess('Post updated successfully!');
      this.view.hideEditModal();
    } catch (error) {
      console.error('Failed to update post:', error);
      this.view.showError('Failed to update post. Please try again.');
    }
  }

  async handlePostDelete(postId) {
    // Use a custom confirmation for better UX
    if (this.view.showDeleteConfirmation) {
      // If view has a custom confirmation method, use it
      const confirmed = await this.view.showDeleteConfirmation();
      if (!confirmed) return;
    } else {
      // Fall back to browser confirm
      const confirmed = confirm('Are you sure you want to delete this post?');
      if (!confirmed) return;
    }

    try {
      console.log('Deleting post:', postId);
      await this.model.deletePost(postId);
      this.view.showSuccess('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      this.view.showError('Failed to delete post. Please try again.');
    }
  }

  handlePostEdit(postId) {
    console.log('Edit requested for post:', postId);
    const post = this.model.getPostById(postId);
    if (post) {
      this.view.showEditModal(post);
    } else {
      this.view.showError('Post not found for editing.');
    }
    return post; // Return post data for view to use
  }

  handlePostUpdated(updatedPost) {
    console.log('Post updated:', updatedPost.id);
    // Refresh posts or update specific post in view
    this.loadPosts();
  }

  handlePostDeleted(postId) {
    console.log('Post deleted:', postId);
    // Remove the deleted post from view
    this.loadPosts();
  }
  // Utility methods
  formatDate(dateString) {
    return this.model.formatDate(dateString);
  }

  validatePostData(postData) {
    return this.model.validatePostData(postData);
  }

  getPostById(postId) {
    return this.model.getPostById(postId);
  }

  // Debugging and development helpers
  getState() {
    return {
      isInitialized: this.isInitialized,
      postsCount: this.model.posts.length,
      currentEditId: this.view.currentEditId,
      isLoading: this.model.isLoading,
    };
  }

  reset() {
    console.log('Resetting controller...');
    this.view.clearForm();
    this.loadPosts();
  }
}

//  window.controllerExplanation = controllerExplanation;
window.BlogController = BlogController;