class BlogModel {
  constructor() {
    this.posts = [];
    this.observers = [];
    this.apiBaseUrl = '/api/posts';
    this.isLoading = false;
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

  //   API Methods
  async loadPosts() {
    this.setLoading(true);
    this.notifyObservers('onLoadingStart');

    try {
      const response = await fetch(this.apiBaseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.posts = await response.json();
      this.notifyObservers('onPostsLoaded', this.posts);
      return this.posts;
    } catch (error) {
      console.error('Error loading posts:', error);
      this.notifyObservers('onError', error.message);
      throw error;
    } finally {
      this.setLoading(false);
      this.notifyObservers('onLoadingEnd');
    }
  }

  async createPost(postData) {
    this.setLoading(true);

    try {
      // Validate post data
      const validationErrors = this.validatePostData(postData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('. '));
      }

      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newPost = await response.json();
      this.posts.unshift(newPost); // Add to beginning
      this.notifyObservers('onPostCreated', newPost);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      this.notifyObservers('onError', error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updatePost(postId, postData) {
    this.setLoading(true);

    try {
      // Validate post data
      const validationErrors = this.validatePostData(postData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('. '));
      }

      const response = await fetch(`${this.apiBaseUrl}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedPost = await response.json();

      // Update local posts array
      const index = this.posts.findIndex(post => post.id === postId);
      if (index !== -1) {
        this.posts[index] = { ...this.posts[index], ...updatedPost };
      }

      this.notifyObservers('onPostUpdated', updatedPost);
      return updatedPost;
    } catch (error) {
      console.error('Error updating post:', error);
      this.notifyObservers('onError', error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async deletePost(postId) {
    this.setLoading(true);

    try {
      const response = await fetch(`${this.apiBaseUrl}/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove from local posts array
      this.posts = this.posts.filter(post => post.id !== postId);

      this.notifyObservers('onPostDeleted', postId);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      this.notifyObservers('onError', error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
  //   async updatePost(postId, postData) {}
  
  //   async deletePost(postId) {}

  // Utility methods
  setLoading(loading) {
    this.isLoading = loading;
    this.notifyObservers('onLoadingChange', loading);
  }

   getPostById(postId) {
    return this.posts.find(post => post.id === postId);
  }

  validatePostData(postData) {
    const errors = [];
    
    if (!postData.title || postData.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (postData.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    
    if (!postData.content || postData.content.trim().length === 0) {
      errors.push('Content is required');
    } else if (postData.content.trim().length < 10) {
      errors.push('Content must be at least 10 characters long');
    }
    
    return errors;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// window.modelExplanation = modelExplanation;
window.BlogModel = BlogModel;