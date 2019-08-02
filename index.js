#!/usr/bin/env node
const program = require('commander')
const pjson = require('./package.json')
const date = new Date().toISOString().slice(0,10)

program
  .version(pjson.version)
  .option('-t, --token [token]', 'pass github token')
  .option('-u, --user [username]', 'pass username')
  .option('-o, --org [orgname]', 'pass organization name')
  .option('-r, --repos', 'pass if you want to extract info about all repos for a user/org')
  .option('-p, --pjson', 'pass if you want to parse all package.json files for a user/org\'s repos')
  .option('-d, --deps [comma separated deps]', 'pass if you want to extract info about specific deps for a user/org\'s repos')
  .option('-s, --search [string to search]', 'search for a specific string in a user/org\'s repos')
  .option('-i, --issues [repo-name]', 'get all issues from a particular repo')
  .parse(process.argv)

const createGithubClient = require('./utils/github')

const { 
  readFromCsv, 
  generatePjsonInfoCsv, 
  generateAllReposCsv,
  generateDepsInfoCsv,
  generateSearchResultsCsv,
  generateIssuesCsv
} = require('./utils/csv')

const getPjsonsCsv = async (owner) => {
  const token = program.token || process.env.GITHUB_TOKEN
  const githubApiClient = createGithubClient(token)
  const allRepos = await readFromCsv(`output/repos-${owner}-${date}.csv`)
    const pjsonFiles = await githubApiClient.getPjsonFiles(allRepos)
    await generatePjsonInfoCsv(pjsonFiles, (`output/pjson-${owner}-${date}.csv`))
}

const getIssuesCsv = async (owner) => {
  const token = program.token || process.env.GITHUB_TOKEN
  const githubApiClient = createGithubClient(token)
  const repoName = program.issues
  const issuesData = await githubApiClient.getIssuesInfo(repoName, owner)
  await generateIssuesCsv(issuesData, (`output/issues-${owner}-${repoName}-${date}.csv`))
}

const getReposCsv = async () => {
  const token = program.token || process.env.GITHUB_TOKEN
  const githubApiClient = createGithubClient(token)
  if (program.org) {
    const orgData = await githubApiClient.getReposInfoForOrg(program.org)
    await generateAllReposCsv(orgData, (`output/repos-${program.org}-${date}.csv`))
  }
  if (program.user) {
    const userData = await githubApiClient.getReposInfoForUser(program.user)
    await generateAllReposCsv(userData, (`output/repos-${program.user}-${date}.csv`))
  }
}

const getDepsCsv = async (owner) => {
  const allPjsonFiles = await readFromCsv((`output/pjson-${owner}-${date}.csv`))
  const token = program.token || process.env.GITHUB_TOKEN
  const githubApiClient = createGithubClient(token)
  const pjsonFilesContents = await githubApiClient.getDepsInfo(allPjsonFiles)
  const depsArr = program.deps.split(',')
  await generateDepsInfoCsv(pjsonFilesContents, (`output/deps-${owner}-${date}.csv`), depsArr)
}

const getSearchResultsCsv = async (owner) => {
  const allRepos = await readFromCsv(`output/repos-${owner}-${date}.csv`)
  const token = program.token || process.env.GITHUB_TOKEN
  const githubApiClient = createGithubClient(token)
  const searchResults = await githubApiClient.getSearchResults(allRepos, program.search)
  await generateSearchResultsCsv(searchResults, (`output/search-results-${owner}-${date}.csv`))
}

if (!program.token || !process.env.GITHUB_TOKEN) {
  throw new Error('You need to pass a Github token to run this (or have a `GITHUB_TOKEN` env var set up). Please see the readme!')
}

if (program.issues) {
  if (!program.org && !program.user) {
    throw new Error('You need to pass a Github username or org name to retrieve issues info. Please see the readme!')
  }
  const owner = program.org || program.user
  console.log(`Generating list of issues for ${owner}/${program.issues}. Check output folder!`)
  getIssuesCsv(owner)
} 

if (program.repos) {
  if (!program.org && !program.user) {
    throw new Error('You need to pass a Github username or org name to retrieve repos info. Please see the readme!')
  }
  console.log(`Generating list of repos info for ${program.org || program.user}. Check output folder!`)
  getReposCsv()
} 

if (program.pjson) {
  if (!program.org && !program.user) {
    throw new Error('You need to pass a Github username or org name to retrieve pjson info. Please see the readme!')
  }
  const owner = program.org || program.user
  console.log(`Generating list of package.json info from repos for ${owner}. Check output folder!`)
  getPjsonsCsv(owner)
}

if (program.deps) {
  if (!program.org && !program.user) {
    throw new Error('You need to pass a Github username or org name to retrieve deps info. Please see the readme!')
  }
  const owner = program.org || program.user
  console.log(`Generating list of deps from repos for ${owner}. Check output folder!`)
  getDepsCsv(owner)
}

if (program.search) {
  if (!program.org && !program.user) {
    throw new Error('You need to pass a Github username or org name to retrieve search info. Please see the readme!')
  }
  const owner = program.org || program.user
  console.log(`Generating list of occurences for ${program.search} from repos for ${owner}. Check output folder!`)
  getSearchResultsCsv(owner)
}
