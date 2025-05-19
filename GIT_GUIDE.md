# DROPREEL Git Workflow Guide

This document outlines the Git workflow and best practices for the DROPREEL project. Following these guidelines ensures a clean, maintainable codebase and smooth collaboration.

## Table of Contents
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Versioning](#versioning)
- [Release Process](#release-process)
- [GitHub-Specific Workflows](#github-specific-workflows)
- [Project-Specific Details](#project-specific-details)
- [Best Practices](#best-practices)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Branching Strategy

### Main Branches
- `main`: Production-ready, stable code. Always in a deployable state.
- `develop`: Integration branch for features. When features are complete, they are merged here.

### Supporting Branches
- `feature/*`: For new features or enhancements
- `bugfix/*`: For bug fixes
- `hotfix/*`: For critical production fixes
- `release/*`: For preparing new releases
- `docs/*`: For documentation updates

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools
- `perf`: Performance improvements
- `ci`: Changes to CI configuration
- `revert`: Revert a previous commit

### Scopes
- `ui`: User interface changes
- `api`: API-related changes
- `auth`: Authentication and authorization
- `db`: Database changes
- `deps`: Dependency updates
- `config`: Configuration changes

### Examples
```
feat(ui): add glassmorphism design to video player
fix(auth): resolve token refresh issue
docs: update README with setup instructions
```

## Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality
- **PATCH** version for backward-compatible bug fixes

## Release Process

### Creating a New Release

1. Create a release branch from `develop`:
   ```sh
   git checkout develop
   git pull origin develop
   git checkout -b release/vX.Y.Z
   ```

2. Update version numbers:
   - Update `package.json` version
   - Update any other version references
   - Update `CHANGELOG.md` with release notes

3. Commit the version bump:
   ```sh
   git add .
   git commit -m "chore: bump version to vX.Y.Z"
   ```

4. Merge to `main` and tag the release:
   ```sh
   git checkout main
   git merge --no-ff release/vX.Y.Z
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin main --tags
   ```

5. Update `develop` with the release changes:
   ```sh
   git checkout develop
   git merge --no-ff main
   git push origin develop
   ```

6. Create a GitHub release with release notes

## GitHub-Specific Workflows

### Creating a GitHub Release
1. Go to the [Releases](https://github.com/btangonan/DROPREEL/releases) page
2. Click "Draft a new release"
3. Tag version: `vX.Y.Z` (match with `package.json`)
4. Target: `main` branch
5. Release title: "DROPREEL vX.Y.Z"
6. Add release notes from `CHANGELOG.md`
7. Publish release

### Branch Protection
- `main` and `develop` branches are protected
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require linear history
- Do not allow force pushes

### GitHub Actions
- Automated testing on push to any branch
- Build verification on pull requests
- Automatic deployment to Vercel on push to main

## Project-Specific Details

### Files to Update for New Versions
- `package.json` - Update version number
- `CHANGELOG.md` - Add release notes
- Any documentation that references the version

### Build Process
1. Run `npm run build` to create a production build
2. Test the build locally with `npm start`
3. Push to main to trigger Vercel deployment

### Environment Variables
- Store sensitive information in `.env.local` (not committed to Git)
- Use `env.example` as a template for required environment variables
- Never commit `.env` files to version control

## Best Practices

### General
- Always pull before pushing
- Keep commits small and focused
- Write clear, descriptive commit messages
- Never commit sensitive information
- Keep the `main` branch always deployable
- Use meaningful branch names (e.g., `feature/add-user-authentication`)

### Branch Management
- Delete merged branches (both local and remote)
- Keep feature branches up to date with `develop`
- Rebase feature branches instead of merging when possible
- Use `git pull --rebase` to avoid merge commits when pulling

### Code Review
- All changes must be reviewed before merging to `develop` or `main`
- Use GitHub pull requests for code reviews
- Request reviews from at least one other developer
- Use the "Squash and merge" option when merging PRs to keep history clean

## Common Tasks

### Starting a New Feature
```sh
git checkout develop
git pull origin develop
git checkout -b feature/feature-name
# Make changes, commit, and push
git push -u origin feature/feature-name
# Create a pull request from the feature branch to develop
```

### Fixing a Bug
```sh
git checkout develop
git pull origin develop
git checkout -b bugfix/describe-issue
# Fix the bug, add tests, commit, and push
git push -u origin bugfix/describe-issue
# Create a pull request from the bugfix branch to develop
```

### Updating Documentation
```sh
git checkout develop
git pull origin develop
git checkout -b docs/update-readme
# Update documentation, commit, and push
git push -u origin docs/update-readme
# Create a pull request from the docs branch to develop
```

### Creating a Hotfix
```sh
git checkout main
git pull origin main
git checkout -b hotfix/describe-issue
# Make the fix, commit, and push
git push -u origin hotfix/describe-issue
# After review, merge to main and then to develop
```

### Syncing a Fork
```sh
# Add the original repository as a remote
# git remote add upstream https://github.com/original-repo/DROPREEL.git

# Fetch the latest changes from upstream
git fetch upstream

# Merge changes from upstream/develop to your local develop
git checkout develop
git merge upstream/develop

git checkout your-feature-branch
git merge develop
# Resolve any conflicts and commit
```

## Git Hooks

### Pre-commit
- Run linter
- Run tests
- Check for sensitive data

### Commit-msg
- Validate commit message format
- Check for JIRA ticket reference (if applicable)

## Troubleshooting

### Merge Conflicts
1. Identify the conflicting files with `git status`
2. Open each file and look for the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Resolve the conflicts by keeping the appropriate code
4. Mark the file as resolved with `git add <file>`
5. Complete the merge with `git commit`

### Undoing Changes
- Discard changes in working directory: `git checkout -- <file>`
- Unstage a file: `git reset HEAD <file>`
- Undo the last commit: `git reset --soft HEAD~1`
- Revert a specific commit: `git revert <commit-hash>`

### Recovering Lost Commits
1. Find the lost commit: `git reflog`
2. Note the commit hash
3. Recover it: `git cherry-pick <commit-hash>`

## Code Review Checklist

### Required
- [ ] Code follows project style guide
- [ ] Tests are included for new features
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No sensitive data is committed

### Recommended
- [ ] Code is properly commented
- [ ] Performance considerations are addressed
- [ ] Accessibility requirements are met
- [ ] Cross-browser compatibility is verified

## Git Aliases

Add these to your `~/.gitconfig` for faster workflows:

```ini
[alias]
    co = checkout
    ci = commit
    st = status
    br = branch
    hist = log --pretty=format:'%h %ad | %s%d [%an]' --graph --date=short
    type = cat-file -t
    dump = cat-file -p
    unstage = reset HEAD --
    last = log -1 HEAD
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Guides](https://guides.github.com/)

---

*Last updated: 2025-05-18*
