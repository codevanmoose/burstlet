#!/bin/bash
# Script to create GitHub repository and push code

echo "Creating GitHub repository..."

# Create repository using GitHub CLI
gh repo create burstlet \
  --public \
  --description "AI-powered content creation and distribution platform" \
  --homepage "https://burstlet-gilt.vercel.app" \
  --add-readme=false

# Check if repo creation was successful
if [ $? -eq 0 ]; then
    echo "Repository created successfully!"
    
    # Get the repository URL
    REPO_URL=$(gh repo view --json url -q .url)
    
    # Add remote origin
    git remote add origin "$REPO_URL.git"
    
    # Push to GitHub
    echo "Pushing code to GitHub..."
    git push -u origin main
    
    echo "Code pushed successfully!"
    echo "Repository URL: $REPO_URL"
else
    echo "Failed to create repository. Please check if you're logged in to GitHub CLI."
    echo "Run 'gh auth login' to authenticate."
fi