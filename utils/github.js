const pMap = require('p-map')

const retry = require('@octokit/plugin-retry')
const throttling = require('@octokit/plugin-throttling')

const MyOctokit = require('@octokit/rest')
  .plugin(retry, throttling)

class GithubApiClient {
  constructor(token) {
    this.token = token
    this.octokit = new MyOctokit({
      auth: `token ${this.token}`,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)
    
          if (options.request.retryCount === 0) { // only retries once
            console.log(`Retrying after ${retryAfter} seconds!`)
            return true
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          // does not retry, only logs a warning
          octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`)
        }
      },
      retry: {
        doNotRetry: ['429']
      }
    })
  }

  async _getRepoPjsonFiles (owner, repo) {
    try {
      const searchResults = await this.octokit.search.code({
        q: `filename:package.json+repo:${owner}/${repo}`
      })
      return {
        repo,
        files: searchResults.data.items
      }
    } catch (e) {
      return {
        repo,
        files: []
      }
    }
  }

  async _getFilesWithRefs(owner, repo, query) {
    try {
      const searchResults = await this.octokit.search.code({
        q: `${query}+repo:${owner}/${repo}`
      })
      return {
        repo,
        files: searchResults.data.items
      }
    } catch (e) {
      return {
        repo,
        files: []
      }
    }
  }

  async getSearchResults (reposInfo, stringToSearch) {
    const searchMapper = async (repo) => {
      const searchFiles = await this._getFilesWithRefs(repo.owner, repo.name, stringToSearch)
        console.log(`Searching for "${stringToSearch}" in repo ${repo.name}`)
        return searchFiles
    }

    const filesResults = await pMap(reposInfo, searchMapper, { concurrency: 1 })

    const files = []

    filesResults.map(result => {
      result.files.map(file => {
        files.push({
          search: stringToSearch,
          filename: file.name,
          path: file.path,
          repo: file.repository.name,
          score: file.score,
          url: file.html_url
        })
      })
    })

    return files
  }

  async _getRepoPjsonFileContents (owner, repo, path) {
    try {
      const { data: { content } } = await this.octokit.repos.getContents({ owner, repo, path })
      
      const buff = new Buffer.from(content, 'base64')
      const fileContent = JSON.parse(buff.toString())

      return {
        repo,
        path,
        fileContent
      }
    } catch (error) {
      return {
        repo,
        path,
        error
      }
    }
  }

  async getReposInfoForOrg (org) {
    const repos = await this.octokit.paginate(this.octokit.repos.listForOrg.endpoint({ org }))
    return repos
  }

  async getReposInfoForUser (username) {
    const repos = await this.octokit.paginate(this.octokit.repos.listForUser.endpoint({ username }))
    return repos
  }

  async getIssuesInfo (repo, owner) {
    const issues = await this.octokit.paginate(this.octokit.issues.listForRepo.endpoint.merge({
      owner,
      repo,
      state: 'all'
    }))
    const promises = issues.map(async issue => {
      const issue_number = issue.number
      const comments = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number
      })
      issue.comments = comments
      return issue
    })
    const issuesWithComments = await Promise.all(promises)
    return issuesWithComments
  }

  async getRepoContent (owner, repo) {
    const content = await this.octokit.repos.getContent({ owner, repo, path: '' })
    return content
  }

  async getPjsonFiles (reposInfo) {
    const searchPjsonMapper = async (repo) => {
      const repoPjsonFiles = await this._getRepoPjsonFiles(repo.owner, repo.name)
        console.log(`Getting package.json(s) from repo ${repo.name}`)
        return repoPjsonFiles
    }

      const filesResults = await pMap(reposInfo, searchPjsonMapper, { concurrency: 1 })
      const files = []
      filesResults.map(result => {
        files.push(...result.files)
      })
      const pjsonFiles = files.filter(file => {
        return file.name === 'package.json'
          && (file.path === 'package.json' || file.path === 'app/package.json' || file.path === 'ui/package.json' || file.path === 'src/package.json')
      })
      return pjsonFiles
  }

  async getDepsInfo (pjsonFiles) {
    const getPjsonContentMapper = async (fileInfo) => {
      const { owner, repo, path } = fileInfo
      console.log(`Now getting package.json contents from repo ${repo}, path ${path}`)
      const contents = await this._getRepoPjsonFileContents(owner, repo, path)
      return contents
    }

    try {
      const contentResults = await pMap(pjsonFiles, getPjsonContentMapper, { concurrency: 1 })
      return contentResults
    } catch (error) {
      throw error
    }
  }
}

const createClient = (token) => {
  return new GithubApiClient(token)
}

module.exports = createClient