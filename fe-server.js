var http = require('http');
var url = require('url');
const { parse } = require('querystring');
var fs = require('fs');

const config = require('./config/config.json');
const defaultConfig = config.development;
global.gConfig = defaultConfig;

function getHTML(recipes, savedMessage) {
  var recipeCards = '';
  if (recipes && recipes.length > 0) {
    // show only unique recipes by name to avoid duplicates
    const seen = new Set();
    const unique = recipes.filter(r => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });
    unique.forEach(function(r) {
      var ingredients = Array.isArray(r.ingredients) ? r.ingredients.join(', ') : r.ingredients;
      recipeCards += `
        <div class="card">
          <div class="card-header">
            <span class="card-name">${r.name}</span>
            <span class="card-time">⏱ ${r.prepTimeInMinutes} min</span>
          </div>
          <div class="card-ingredients">
            <span class="ingredients-label">Ingredients</span>
            <span class="ingredients-value">${ingredients}</span>
          </div>
        </div>`;
    });
  }

  var savedBanner = savedMessage ? `<div class="saved-banner">✓ Recipe saved successfully!</div>` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recipe Tracker</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f0e0c;
      --surface: #1a1814;
      --surface2: #242018;
      --accent: #e8b86d;
      --accent2: #c9956a;
      --text: #f0ebe0;
      --text-muted: #8a8070;
      --border: #2e2a22;
      --success: #6dbc8e;
      --radius: 12px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      min-height: 100vh;
      background-image:
        radial-gradient(ellipse at 20% 0%, rgba(232,184,109,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 100%, rgba(201,149,106,0.04) 0%, transparent 60%);
    }

    .wrapper {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    /* Header */
    header {
      text-align: center;
      margin-bottom: 56px;
    }
    .logo-tag {
      display: inline-block;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--accent);
      border: 1px solid rgba(232,184,109,0.3);
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(42px, 8vw, 72px);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -1px;
      background: linear-gradient(135deg, var(--text) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 15px;
      letter-spacing: 0.3px;
    }

    /* Form */
    .form-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 36px;
      margin-bottom: 48px;
      position: relative;
      overflow: hidden;
    }
    .form-section::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent), var(--accent2), transparent);
    }
    .form-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      margin-bottom: 28px;
      color: var(--text);
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-group.full { grid-column: 1 / -1; }
    label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    input {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 300;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      width: 100%;
    }
    input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(232,184,109,0.1);
    }
    input::placeholder { color: var(--text-muted); opacity: 0.5; }
    .hint {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    button[type="submit"] {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border: none;
      border-radius: 8px;
      padding: 14px 32px;
      color: #0f0e0c;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      width: 100%;
    }
    button[type="submit"]:hover { opacity: 0.9; transform: translateY(-1px); }
    button[type="submit"]:active { transform: translateY(0); }

    /* Saved banner */
    .saved-banner {
      background: rgba(109,188,142,0.12);
      border: 1px solid rgba(109,188,142,0.3);
      color: var(--success);
      border-radius: 8px;
      padding: 14px 20px;
      margin-bottom: 28px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Recipes section */
    .recipes-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 24px;
    }
    .recipes-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
    }
    .recipes-count {
      font-size: 13px;
      color: var(--text-muted);
    }

    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      transition: border-color 0.2s, transform 0.2s;
    }
    .card:hover {
      border-color: rgba(232,184,109,0.3);
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 8px;
    }
    .card-name {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      line-height: 1.2;
      flex: 1;
    }
    .card-time {
      font-size: 12px;
      color: var(--accent);
      background: rgba(232,184,109,0.1);
      border: 1px solid rgba(232,184,109,0.2);
      padding: 4px 10px;
      border-radius: 100px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .card-ingredients {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ingredients-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .ingredients-value {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }
    .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 15px; }

    /* Divider */
    .divider {
      height: 1px;
      background: var(--border);
      margin: 48px 0;
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .wrapper { padding: 32px 16px 60px; }
    }
  </style>
</head>
<body>
<div class="wrapper">

  <header>
    <div class="logo-tag">EAD CA2 — TU Dublin</div>
    <h1>Recipe Tracker</h1>
    <p class="subtitle">Add and browse your favourite recipes</p>
  </header>

  <div class="form-section">
    <div class="form-title">Add a New Recipe</div>
    <form action="/" method="post">
      <div class="form-grid">
        <div class="form-group full">
          <label for="name">Recipe Name</label>
          <input type="text" id="name" name="name" placeholder="e.g. Spaghetti Carbonara" required/>
        </div>
        <div class="form-group full">
          <label for="ingredients">Ingredients</label>
          <input type="text" id="ingredients" name="ingredients" placeholder="e.g. pasta, eggs, bacon, parmesan" required/>
          <span class="hint">Separate ingredients with commas</span>
        </div>
        <div class="form-group">
          <label for="prepTimeInMinutes">Prep Time (minutes)</label>
          <input type="number" id="prepTimeInMinutes" name="prepTimeInMinutes" placeholder="e.g. 30" min="0" required/>
        </div>
      </div>
      <button type="submit">Save Recipe</button>
    </form>
  </div>

  ${savedBanner}

  <div class="divider"></div>

  <div class="recipes-header">
    <span class="recipes-title">Your Recipes</span>
    <span class="recipes-count">${recipes ? new Set(recipes.map(r=>r.name)).size : 0} saved</span>
  </div>

  ${recipeCards ? `<div class="recipes-grid">${recipeCards}</div>` : `
    <div class="empty-state">
      <div class="icon">🍽️</div>
      <p>No recipes yet — add your first one above!</p>
    </div>`}

</div>
</body>
</html>`;
}

http.createServer(function (req, res) {
  console.log('App is starting....');
  console.log(req.url);

  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'});
    res.end();
    return;
  }

  const httpClient = require('http');
  var savedMessage = false;
  var timeout = 0;

  if (req.method === 'POST') {
    timeout = 2000;
    var qs = require('querystring');
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      var post = qs.parse(body);
      var myJSONObject = {
        name: post['name'],
        ingredients: post['ingredients'].split(',').map(s => s.trim()),
        prepTimeInMinutes: parseInt(post['prepTimeInMinutes']) || 0
      };

      const options = {
        hostname: global.gConfig.webservice_host,
        port: global.gConfig.webservice_port,
        path: '/recipe',
        method: 'POST',
      };

      const req2 = httpClient.request(options, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => { console.log('Data Saved!'); });
      });
      req2.setHeader('content-type', 'application/json');
      req2.write(JSON.stringify(myJSONObject));
      req2.end();
    });

    savedMessage = true;
  }

  setTimeout(function() {
    const options = {
      hostname: global.gConfig.webservice_host,
      port: global.gConfig.webservice_port,
      path: '/recipes',
      method: 'GET',
    };

    const getReq = httpClient.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        var recipes = [];
        try { recipes = JSON.parse(data); } catch(e) { recipes = []; }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(getHTML(recipes, savedMessage));
      });
    });
    getReq.on('error', (e) => {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(getHTML([], false));
    });
    getReq.end();
  }, timeout);

}).listen(global.gConfig.exposedPort, () => {
  console.log(`Server running on port ${global.gConfig.exposedPort}`);
});
