
const { promisify } = require('util')
const fs = require('fs')
const neatCsv = require('neat-csv')

const { extractDataForCsv } = require('./extract-data')

const writeFilePromise = promisify(fs.writeFile)
const readFilePromise = promisify(fs.readFile)

const readFromCsv = async (filename) => {
  const csv = await readFilePromise(filename)
  let data = await neatCsv(csv)
  return data
}

const generateAllReposCsv = async (data, filename) => {
  const options = {
    fields: [ 
      'id', 
      'name', 
      'html_url', 
      {
        label: 'owner',
        value: 'owner.login'
      },
      'created_at',
      'updated_at'
    ]
  }
  await writeFilePromise(filename, extractDataForCsv({ data, options }), 'utf8')
}

const generatePjsonInfoCsv = async (pjsonFilesArr, filename) => {
  const options = {
    fields: [
      {
        label: 'name',
        value: 'name',
        default: 'NULL'
      },
      {
        label: 'owner',
        value: 'repository.owner.login'
      },
      {
        label: 'repo',
        value: 'repository.name'
      },
      {
        label: 'path',
        value: 'path'
      }
    ]
  }
  const dataForCsv = extractDataForCsv({ data: pjsonFilesArr, options })
  await writeFilePromise(filename, dataForCsv, 'utf8')
}

const _getAllDependencies = (fileContent={}) => {
  const { dependencies=[], devDependencies=[], peerDependencies=[] } = fileContent
  const allDependencies = {
    ...dependencies,
    ...devDependencies,
    ...peerDependencies
  }
  return allDependencies
}


const generateDepsInfoCsv = async (pjsonFilesContentsArr, filename, deps) => {
  const depsFields = deps.map(depName => {
    return {
      label: `${depName}-version`,
      value: (row) => {
        const allDependencies = _getAllDependencies(row.fileContent)
        if ('react' in allDependencies) {
          return allDependencies[depName]
        }
      },
      default: 'NULL'
    }
  })
  const options = {
    fields: [
      {
        label: 'repo',
        value: 'repo',
        default: 'NULL'
      },
      {
        label: 'path',
        value: 'path',
        default: 'NULL'
      },
      ...depsFields
    ]
  }
  const dataForCsv = extractDataForCsv({ data: pjsonFilesContentsArr, options })
  await writeFilePromise(filename, dataForCsv, 'utf8')
}

const generateSearchResultsCsv = async (searchResults, filename) => {
  const options = {
    fields: [ 'search', 'repo', 'path', 'filename', 'score', 'url' ]
  }
  const dataForCsv = extractDataForCsv({ data: searchResults, options })
  await writeFilePromise(filename, dataForCsv, 'utf8')
}

const generateIssuesCsv = async(issuesData, filename) => {
  const options = {
    fields: [ 
      'html_url',
      'title',
      'body',
      {
        label: 'author',
        value: 'user.login'
      },
      {
        label: 'comments',
        value: (row) => {
          return row.comments.data.map(comment => {
            const user = comment.user.login
            const body = comment.body
            return `${user}: ${body}`
          }).join('\n')
        }
      }
    ]
  }
  const dataForCsv = extractDataForCsv({ data: issuesData, options })
  await writeFilePromise(filename, dataForCsv, 'utf8')
}

module.exports = {
  readFromCsv,
  generateAllReposCsv,
  generatePjsonInfoCsv,
  generateDepsInfoCsv,
  generateSearchResultsCsv,
  generateIssuesCsv
}