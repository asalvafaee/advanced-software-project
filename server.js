const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'blog.db');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory (not 'public' since you don't have that folder)
app.use(express.static(__dirname));
// Serve index.html for all non-API routes
// Serve the main HTML file for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to SQLite database');

        // Create posts table
        db.run(`
          CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT DEFAULT 'Anonymous',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating table:', err.message);
            reject(err);
          } else {
            console.log('Posts table ready');

            // Check if we need to add initial data
            db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
              if (err) {
                console.error('Error counting posts:', err.message);
                reject(err);
              } else if (row.count === 0) {
                // Add initial data
                const initialPosts = [
                  {
                    title: 'Welcome to My Blog',
                    content: 'This is my first blog post! I\'m excited to share my thoughts and experiences with you.',
                    author: 'Blog Owner'
                  },
                  {
                    title: 'Getting Started with MVC',
                    content: 'MVC (Model-View-Controller) is a software design pattern that separates an application into three interconnected components.',
                    author: 'Developer'
                  }
                ];

                const stmt = db.prepare(`
                  INSERT INTO posts (title, content, author)
                  VALUES (?, ?, ?)
                `);

                initialPosts.forEach((post) => {
                  stmt.run([post.title, post.content, post.author]);
                });

                stmt.finalize((err) => {
                  if (err) {
                    console.error('Error finalizing statement:', err.message);
                    reject(err);
                  } else {
                    console.log('Added initial blog posts');
                    resolve(db);
                  }
                });
              } else {
                console.log(`Found ${row.count} existing posts`);
                resolve(db);
              }
            });
          }
        });
      }
    });
  });
}

// DB Instance
let db;

// ========== API ROUTES ==========

// GET all posts
app.get('/api/posts', (req, res) => {
  console.log('GET /api/posts');

  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching posts:', err.message);
      res.status(500).json({ error: 'Failed to fetch posts' });
    } else {
      // Convert SQLite format to match frontend expectations
      const posts = rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        author: row.author,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString()
      }));
      res.json(posts);
    }
  });
});

// GET single post by ID
app.get('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`GET /api/posts/${id}`);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching post:', err.message);
      res.status(500).json({ error: 'Failed to fetch post' });
    } else if (!row) {
      res.status(404).json({ error: 'Post not found' });
    } else {
      const post = {
        id: row.id,
        title: row.title,
        content: row.content,
        author: row.author,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString()
      };
      res.json(post);
    }
  });
});

// POST create new post
app.post('/api/posts', (req, res) => {
  console.log('POST /api/posts');

  const { title, content, author = 'Anonymous' } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({
      error: 'Title and content are required'
    });
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const trimmedAuthor = author.trim();

  db.run(
      `INSERT INTO posts (title, content, author) VALUES (?, ?, ?)`,
      [trimmedTitle, trimmedContent, trimmedAuthor],
      function(err) {
        if (err) {
          console.error('Error creating post:', err.message);
          return res.status(500).json({ error: 'Failed to create post' });
        }

        // Get the newly created post
        db.get('SELECT * FROM posts WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching new post:', err.message);
            return res.status(500).json({ error: 'Post created but failed to retrieve' });
          }

          const newPost = {
            id: row.id,
            title: row.title,
            content: row.content,
            author: row.author,
            createdAt: new Date(row.created_at).toISOString(),
            updatedAt: new Date(row.updated_at).toISOString()
          };

          console.log(`Post created with ID: ${newPost.id}`);
          res.status(201).json(newPost);
        });
      }
  );
});

// PUT update post
app.put('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`PUT /api/posts/${id}`);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  const { title, content, author } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({
      error: 'Title and content are required'
    });
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const trimmedAuthor = author ? author.trim() : undefined;

  // Check if post exists
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, existingPost) => {
    if (err) {
      console.error('Error checking post:', err.message);
      return res.status(500).json({ error: 'Failed to update post' });
    }

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Update the post
    const updateQuery = trimmedAuthor
        ? `UPDATE posts SET title = ?, content = ?, author = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        : `UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const params = trimmedAuthor
        ? [trimmedTitle, trimmedContent, trimmedAuthor, id]
        : [trimmedTitle, trimmedContent, id];

    db.run(updateQuery, params, function(err) {
      if (err) {
        console.error('Error updating post:', err.message);
        return res.status(500).json({ error: 'Failed to update post' });
      }

      // Get the updated post
      db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated post:', err.message);
          return res.status(500).json({ error: 'Post updated but failed to retrieve' });
        }

        const updatedPost = {
          id: row.id,
          title: row.title,
          content: row.content,
          author: row.author,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString()
        };

        console.log(`Post ${id} updated successfully`);
        res.json(updatedPost);
      });
    });
  });
});

// DELETE post
app.delete('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`DELETE /api/posts/${id}`);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  // Delete the post
  db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting post:', err.message);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    console.log(`Post ${id} deleted successfully`);
    res.json({
      success: true,
      message: 'Post deleted successfully',
      deletedId: id
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'ERROR',
        error: err.message
      });
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      postsCount: row.count
    });
  });
});

// ========== SERVE FRONTEND ==========

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other static files (CSS, JS)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// ========== INITIALIZE AND START ==========

async function startServer() {
  try {
    console.log('Starting Blog MVC Server...');
    console.log('Database path:', DB_PATH);

    // Initialize database
    db = await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`
========================================
🚀 Blog MVC Server is running!
========================================
📡 Local: http://localhost:${PORT}

📚 API Endpoints:
   GET    /api/posts
   GET    /api/posts/:id
   POST   /api/posts
   PUT    /api/posts/:id
   DELETE /api/posts/:id
   GET    /api/health

💡 Open http://localhost:${PORT} in your browser
💡 Press Ctrl+C to stop the server
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server
startServer();