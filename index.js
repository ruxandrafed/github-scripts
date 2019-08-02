#!/usr/bin/env node
const fs = require('fs')
const program = require('commander')
const pjson = require('./package.json')
const date = new Date().toISOString().slice(0,10)

program
  .version(pjson.version)
  .option('-t, --token <token>', 'pass github token')
  .option('-u, --user <username>', 'pass username')
  .option('-o, --org <orgname>', 'pass organization name')
  .option('-r, --repos', 'pass if you want to extract info about all repos for a user/org')
  .option('-p, --pjson', 'pass if you want to parse all package.json files for a user/org\'s repos')
  .option('-d, --deps <comma separated deps>', 'pass if you want to extract info about specific deps for a user/org\'s repos')
  .option('-s, --search <string to search>', 'search for a specific string in a user/org\'s repos')
  .option('-i, --issues <repo-name>', 'get all issues from a particular repo')
  .parse(process.argv)

const { 
  readFromCsv, 
  generatePjsonInfoCsv, 
  generateAllReposCsv,
  generateDepsInfoCsv,
  generateSearchResultsCsv,
  generateIssuesCsv
} = require('./utils/csv')

const getPjsonsCsv = async (owner) => {
  const path = `output/repos-${owner}-${date}.csv`
  if (!fs.existsSync(path)) {
    await getReposCsv()
  }
  console.log(`Generating list of package.json info from repos for ${owner}. Check output folder!`)
  const allRepos = await readFromCsv(path)
  const pjsonFiles = await githubApiClient.getPjsonFiles(allRepos)
  await generatePjsonInfoCsv(pjsonFiles, (`output/pjson-${owner}-${date}.csv`))
}

const getIssuesCsv = async (owner, repoName) => {
  console.log(`Generating list of issues for ${owner}/${program.issues}. Check output folder!`)
  const issuesData = await githubApiClient.getIssuesInfo(repoName, owner)
  await generateIssuesCsv(issuesData, (`output/issues-${owner}-${repoName}-${date}.csv`))
}

const getReposCsv = async () => {
  console.log(`Generating list of repos info for ${program.org || program.user}. Check output folder!`)
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
  const path = `output/pjson-${owner}-${date}.csv`
  if (!fs.existsSync(path)) {
    await getPjsonsCsv(owner)
  }
  console.log(`Generating list of deps from repos for ${owner}. Check output folder!`)
  const allPjsonFiles = await readFromCsv((path))
  const pjsonFilesContents = await githubApiClient.getDepsInfo(allPjsonFiles)
  const depsArr = program.deps.split(',')
  await generateDepsInfoCsv(pjsonFilesContents, (`output/deps-${owner}-${date}.csv`), depsArr)
}

const getSearchResultsCsv = async (owner) => {
  const path = `output/repos-${owner}-${date}.csv`
  if (!fs.existsSync(path)) {
    await getReposCsv()
  }
  console.log(`Generating list of occurences for ${program.search} from repos for ${owner}. Check output folder!`)
  const allRepos = await readFromCsv(path)
  const searchResults = await githubApiClient.getSearchResults(allRepos, program.search)
  await generateSearchResultsCsv(searchResults, (`output/search-results-${owner}-${date}.csv`))
}

if (!program.token || !process.env.GITHUB_TOKEN) {
  throw new Error('You need to pass a Github token to run this (or have a `GITHUB_TOKEN` env var set up). Please see the readme!')
}

if (!program.org && !program.user) {
  throw new Error('You need to pass a Github username or org name to retrieve info. Please see the readme!')
}

const createGithubClient = require('./utils/github')
const githubApiClient = createGithubClient(program.token || process.env.GITHUB_TOKEN)

if (program.issues) {
  getIssuesCsv(program.org || program.user, program.issues)
} 

if (program.repos) {
  getReposCsv()
} 

if (program.pjson) {
  getPjsonsCsv(program.org || program.user)
}

if (program.deps) {
  getDepsCsv(program.org || program.user)
}

if (program.search) {
  getSearchResultsCsv(owprogram.org || program.userner)
}
