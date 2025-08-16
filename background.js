chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReadme') {
    const repoUrl = request.url;
    const geminiApiKey = request.geminiApiKey;
    generateReadmeForRepo(repoUrl, geminiApiKey)
      .then(readme => {
        sendResponse({ success: true, readme: readme });
      })
      .catch(error => {
        console.error("Error in background script (generateReadme):", error);
        sendResponse({ success: false, error: error.message || "Failed to generate README." });
      });
    return true;
  }
});

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(\/.*)?$/);
  if (match && match[1] && match[2]) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
}

async function fetchGitHubRepoContent(owner, repo) {
  const githubApiBaseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  let combinedContent = '';
  let isFullStack = false;
  let hasApi = false;

  const filesToFetch = [
    'package.json',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'index.js', 'app.js', 'main.js',
    'index.py', 'main.py',
    'src/main.go', 'main.go',
    'README.md',
    'LICENSE',
    'server.js', 'routes.js', 'api.js',
    'index.html', 'src/index.js', 'src/App.js',
    'openapi.yaml', 'swagger.json',
    'docker-compose.yml',
    '.env.example',
    'manage.py',
  ];

  const githubToken = '';

  for (const filePath of filesToFetch) {
    const fileUrl = `${githubApiBaseUrl}${filePath}`;
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          ...(githubToken && { 'Authorization': `token ${githubToken}` })
        }
      });

      if (response.ok) {
        const content = await response.text();
        combinedContent += `\n--- File: ${filePath} ---\n${content}\n`;

        if (['server.js', 'routes.js', 'api.js', 'requirements.txt', 'pom.xml', 'build.gradle', 'main.go', 'manage.py'].includes(filePath)) {
          isFullStack = true;
        }
        if (['index.html', 'src/index.js', 'src/App.js'].includes(filePath)) {
          isFullStack = true;
        }
        if (['openapi.yaml', 'swagger.json', 'routes.js', 'api.js'].includes(filePath)) {
          hasApi = true;
        }
      } else if (response.status === 404) {
        console.log(`File not found: ${filePath}`);
      } else {
        console.warn(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error fetching ${filePath}:`, error);
    }
  }

  if (!combinedContent.trim()) {
    throw new Error("Could not fetch any relevant file content from the repository. Please ensure it's a public repository or try again.");
  }

  return { content: combinedContent, isFullStack, hasApi };
}

async function callLlmApiWithRetry(apiUrl, payload, headers, modelName) {
  let retries = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  while (retries < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (response.status === 429 || response.status === 503) {
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.warn(`${modelName} is busy. Retrying in ${delay / 1000} seconds... (Attempt ${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${modelName} API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (err) {
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.warn(`Retrying ${modelName} after error: ${err.message}. (Attempt ${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error("Model is currently overloaded or unavailable. Please try again later.");
      }
    }
  }
  throw new Error("Model is currently overloaded or unavailable. Please try again later.");
}

async function generateReadmeWithGemini(repoContent, isFullStack, hasApi, geminiApiKey) {
  const prompt = `
You are a professional technical writer. Your task is to generate a complete, beautifully formatted, and visually appealing **README.md** file in Markdown, based on the provided GitHub repository content.

🎯 **Goals:**
- Make it beginner-friendly and informative.
- Add relevant **emojis/icons** (e.g., 🛠️, 📦, 📁, 🔧, 📝, 📄, 📂, ⚙️, 💡, 📌, 📞, 🔗) in section titles and where useful.
- Use **Markdown tables**, bullet points, and formatting for better clarity.
- If both frontend and backend folders are found, assume it's a **full-stack** project.
- If APIs, Swagger/OpenAPI files are found, add an **API Documentation** section.

📄 **README Sections to Include:**

1. 🏷️ **Project Title**
   - A concise, meaningful title with a relevant emoji/icon.
   - space for project overview image telling that replace with original.

2. 📖 **Description**
   - Short paragraph describing the project.
   - Mention its purpose and target users.

3. 🧭 **Table of Contents**
   - should be Auto-generate clickable markdown links for each section.
   -should be clickable and scrollable.

4. 🌟 **Features** in a list format.

5. 🧰 **Technologies Used**
   - List all tools/libraries/languages (backend, frontend, database, auth, etc.).
   - Use technology small icon/logo next to technology name representing the exact tech the size of icon and name should be same.
   -use list format not table.
   -dont use the icon if not available.

6. 📁 **Project Structure**
   - explanation of folder layout and key files in the project with proper directory format.

7. ⚙️ **Setup Instructions**
   - How to:
     - Clone the repo
     - Install dependencies
     - Configure environment variables
     - Run backend and frontend
     - Use Docker if available

8. ▶️ **Usage**
   - How to run or test the project
   - Include CLI or browser examples

9. 🖼️ **Screenshots**
   - Add sample screenshots (with Markdown image syntax and short description).
   -| image | description |
   -telling that replace with original

10. 🧪 **Examples**
   - Sample API requests or CLI commands (include curl/postman/json if found).

11. 📚 **API Documentation**
  //  - If APIs are detected:
     - Create a table listing:
       | Method | Endpoint | Description | Parameters |
       |--------|----------|-------------|------------|

12. 🤝 **Contributing**
   - Guidelines for external contributors.

13. 📞 **Contact Info**
   - Placeholder support or contact details.

---

📦 **Repo Snapshot (analyze below for generating README):**
\`\`\`
${repoContent}
\`\`\`

🧠 **Project Type Inferred**:
- Is Full-Stack: ${isFullStack}
- Has API Routes: ${hasApi}
`;

  const chatHistory = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  const payload = { contents: chatHistory };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  const headers = { 'Content-Type': 'application/json' };

  const result = await callLlmApiWithRetry(apiUrl, payload, headers, "Gemini");

  if (
    result.candidates?.[0]?.content?.parts?.[0]?.text
  ) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Could not generate README. Unexpected Gemini API response.");
  }
}


async function generateReadmeForRepo(repoUrl, geminiApiKey) {
  const repoInfo = parseGitHubUrl(repoUrl);
  if (!repoInfo) throw new Error("Invalid GitHub repository URL.");

  const treeUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/HEAD?recursive=1`;

  const treeRes = await fetch(treeUrl);
  if (!treeRes.ok) throw new Error("Failed to fetch file tree from GitHub.");
  const treeData = await treeRes.json();

  const tree = treeData.tree || [];
  const relevantFiles = tree.filter(file =>
    file.type === 'blob' &&
    /\.(js|ts|jsx|tsx|json|html|css|md|py|go|rs|java|cpp|c|yml|yaml)$/i.test(file.path)
  );

  const contentLimit = 20;
  const filesToFetch = relevantFiles.slice(0, contentLimit);

  const fileContents = await Promise.all(
    filesToFetch.map(async file => {
      const rawUrl = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/HEAD/${file.path}`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) return `// File: ${file.path}\n${await res.text()}`;
        else return '';
      } catch {
        return '';
      }
    })
  );

  let combinedContent = fileContents.join('\n\n').trim();

  const fallbackPrompt = `
This repository has minimal or no content. Generate a README.md with the following sections:

- Project Title (from repo name with icon)
- Description
- Features
- Tech Stack (assume full-stack)
- Installation Steps
- Usage Instructions
- Folder Structure (guess if needed)
- License (MIT by default)
- Contributing Guidelines
- Contact Info

Use markdown formatting and fill in professional placeholders where needed.
`;

  if (!combinedContent) {
    console.warn("No meaningful content found — using fallback prompt.");
    combinedContent = fallbackPrompt;
  }

  const repoName = repoInfo.repo.replace(/[-_]/g, ' ');
  const titleLine = `# ${repoName.charAt(0).toUpperCase() + repoName.slice(1)} 🚀\n\n`;

  const prompt = `${titleLine}${combinedContent}\n\nBased on this, generate a clean and professional README.md.`;

  return await generateReadmeWithGemini(prompt, true, true, geminiApiKey);
}


async function explainTextOrCode(text, geminiApiKey) {
  const prompt = `Please provide a clear and concise explanation for the following text or code snippet. Focus on its purpose, functionality, and any key concepts. If it's code, explain what it does step-by-step.

Text/Code to Explain:
\`\`\`
${text}
\`\`\`
`;

  console.log("Attempting to explain with Gemini...");
  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = { contents: chatHistory };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  const headers = { 'Content-Type': 'application/json' };

  const result = await callLlmApiWithRetry(apiUrl, payload, headers, "Gemini (Explanation)");
  if (result.candidates && result.candidates.length > 0 &&
      result.candidates[0].content && result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Unexpected Gemini API response structure for explanation.");
  }
}